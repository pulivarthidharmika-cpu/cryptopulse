import asyncio
import json
from datetime import datetime

from kafka import KafkaConsumer

from database.database import (
    live_prices_collection,
    historical_prices_collection,
    alerts_collection
)

from config.settings import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_TOPIC,
    BTC_PRICE_TOPIC,
    MARKET_ALERTS_TOPIC,
    TRADE_VOLUME_TOPIC
)

from utils.logger import logger
from routers.price_routes import price_websocket_manager
from routers.alert_routes import alert_websocket_manager


# ==================================================
# STORE PRICE DATA IN MONGODB
# ==================================================

async def store_price(data: dict):

    try:

        if not data.get("coin"):
            logger.warning(
                "Price message missing coin. Skipping."
            )
            return

        clean_data = {
            k: v
            for k, v in data.items()
            if k != "_id"
        }

        # --------------------------------------------------
        # Store latest price
        # --------------------------------------------------

        await live_prices_collection.update_one(
            {"coin": clean_data["coin"]},
            {"$set": clean_data},
            upsert=True
        )

        # --------------------------------------------------
        # Store historical price
        # --------------------------------------------------

        timestamp = clean_data.get("timestamp")

        if timestamp is not None:

            await historical_prices_collection.update_one(
                {
                    "coin": clean_data["coin"],
                    "timestamp": timestamp
                },
                {"$set": clean_data},
                upsert=True
            )

        logger.info(
            f"Price stored in MongoDB: "
            f"{clean_data['coin']}"
        )

    except Exception as e:

        logger.error(
            f"MongoDB price storage failed: {str(e)}"
        )


# ==================================================
# STORE TRADE VOLUME
# ==================================================

async def store_trade_volume(data: dict):

    try:

        coin = data.get("coin")

        if not coin:
            logger.warning(
                "Trade-volume message missing coin."
            )
            return

        logger.info(
            f"Trade volume received: "
            f"{coin} = {data.get('volume')}"
        )

        # --------------------------------------------------
        # Volume is already included in live_prices and
        # historical_prices by the price pipeline.
        #
        # Therefore we don't create duplicate documents
        # unnecessarily.
        # --------------------------------------------------

    except Exception as e:

        logger.error(
            f"Trade volume processing failed: {str(e)}"
        )


# ==================================================
# STORE MARKET ALERT
# ==================================================

async def store_market_alert(data: dict):

    try:

        clean_data = {
            k: v
            for k, v in data.items()
            if k != "_id"
        }

        if not clean_data:
            return

        from bson import ObjectId

        alert_id = clean_data.get("alert_id")
        now_iso = clean_data.get("triggered_at") or datetime.utcnow().isoformat()

        if alert_id:
            try:
                obj_id = ObjectId(alert_id)
                await alerts_collection.update_one(
                    {"_id": obj_id},
                    {"$set": {
                        "status": "triggered",
                        "triggered_at": now_iso,
                        "current_price": clean_data.get("current_price"),
                        "message": clean_data.get("message")
                    }}
                )
            except Exception:
                pass

        logger.info(
            f"Market alert stored in MongoDB: "
            f"{clean_data.get('coin', 'unknown')} - {clean_data.get('message', '')}"
        )

    except Exception as e:

        logger.error(
            f"MongoDB alert storage failed: {str(e)}"
        )


# ==================================================
# KAFKA CONSUMER
# ==================================================

_consumer = None
_stop_event = asyncio.Event()
CONSUMER_DEAD_LETTERS = []
MAX_DLQ_SIZE = 100


def safe_deserialize(message_bytes: bytes):
    """Safely decode JSON Kafka message without throwing uncaught exceptions on corrupt payloads."""
    try:
        return json.loads(message_bytes.decode("utf-8"))
    except Exception as e:
        logger.error(f"Failed to deserialize Kafka message: {e}")
        return {"_corrupt": True, "error": str(e), "raw": str(message_bytes[:200])}


def get_consumer_status() -> dict:
    """Return consumer health, active topics, and dead-letter statistics."""
    topics = [
        KAFKA_TOPIC,
        BTC_PRICE_TOPIC,
        TRADE_VOLUME_TOPIC,
        MARKET_ALERTS_TOPIC
    ]
    return {
        "status": "active" if _consumer is not None else "standby",
        "bootstrap_servers": KAFKA_BOOTSTRAP_SERVERS,
        "topics": list(dict.fromkeys(topics)),
        "dead_letter_count": len(CONSUMER_DEAD_LETTERS),
        "is_running": not _stop_event.is_set(),
    }


def get_consumer():

    global _consumer

    if _consumer is not None:
        return _consumer

    try:

        topics = [
            KAFKA_TOPIC,
            BTC_PRICE_TOPIC,
            TRADE_VOLUME_TOPIC,
            MARKET_ALERTS_TOPIC
        ]

        # --------------------------------------------------
        # Remove duplicate topic names
        # --------------------------------------------------

        topics = list(dict.fromkeys(topics))

        _consumer = KafkaConsumer(
            *topics,

            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,

            auto_offset_reset="latest",

            enable_auto_commit=True,

            group_id="cryptopulse-consumer-group",

            session_timeout_ms=10000,

            request_timeout_ms=30000,

            consumer_timeout_ms=1000,

            value_deserializer=safe_deserialize
        )

        logger.info(
            "Kafka Consumer connected to "
            f"{KAFKA_BOOTSTRAP_SERVERS}"
        )

        logger.info(
            f"Listening to topics: {topics}"
        )

        return _consumer

    except Exception as e:

        logger.warning(
            f"Kafka Consumer connection failed: "
            f"{str(e)}"
        )

        _consumer = None

        return None


# ==================================================
# PROCESS KAFKA MESSAGE
# ==================================================

async def process_message(
    topic: str,
    data: dict
):

    if not isinstance(data, dict):
        logger.warning(f"Discarding non-dict payload from '{topic}': {data}")
        return

    # Check for payload corruption caught by safe_deserialize
    if data.get("_corrupt"):
        entry = {
            "topic": topic,
            "payload": data,
            "timestamp": datetime.utcnow().isoformat(),
        }
        if len(CONSUMER_DEAD_LETTERS) >= MAX_DLQ_SIZE:
            CONSUMER_DEAD_LETTERS.pop(0)
        CONSUMER_DEAD_LETTERS.append(entry)
        logger.warning(f"Corrupted payload detected on topic '{topic}'. Routed to consumer DLQ.")
        return

    logger.info(
        f"Received message from '{topic}': {data}"
    )

    # --------------------------------------------------
    # Existing price topic
    # --------------------------------------------------

    if topic == KAFKA_TOPIC:

        await store_price(data)
        await price_websocket_manager.broadcast(data)

    # --------------------------------------------------
    # Bitcoin price topic
    # --------------------------------------------------

    elif topic == BTC_PRICE_TOPIC:

        await store_price(data)
        await price_websocket_manager.broadcast(data)

    # --------------------------------------------------
    # Trade volume topic
    # --------------------------------------------------

    elif topic == TRADE_VOLUME_TOPIC:

        await store_trade_volume(data)

    # --------------------------------------------------
    # Market alerts topic
    # --------------------------------------------------

    elif topic == MARKET_ALERTS_TOPIC:

        await store_market_alert(data)
        await alert_websocket_manager.broadcast(data)

    else:

        logger.warning(
            f"Unknown Kafka topic: {topic}"
        )


# ==================================================
# START KAFKA CONSUMER
# ==================================================

async def consume_messages():

    logger.info(
        "Kafka Consumer starting..."
    )

    loop = asyncio.get_running_loop()

    while not _stop_event.is_set():

        try:

            consumer = get_consumer()

            if consumer is None:

                await asyncio.sleep(5)

                continue

            messages = await loop.run_in_executor(
                None,
                lambda: consumer.poll(
                    timeout_ms=1000
                )
            )

            if messages:

                for topic_partition, records in messages.items():

                    topic = topic_partition.topic

                    for message in records:

                        data = message.value

                        await process_message(
                            topic,
                            data
                        )

        except Exception as e:

            logger.warning(
                f"Kafka consumer error: {str(e)}"
            )

            await asyncio.sleep(5)


# ==================================================
# CLOSE CONSUMER
# ==================================================

def close_consumer():

    global _consumer, _stop_event

    try:
        _stop_event.set()

        if _consumer is not None:

            _consumer.close()

            _consumer = None

            logger.info(
                "Kafka Consumer closed successfully"
            )

    except Exception as e:

        logger.warning(
            f"Kafka Consumer close failed: {str(e)}"
        )


# ==================================================
# RUN DIRECTLY
# ==================================================

if __name__ == "__main__":

    asyncio.run(
        consume_messages()
    )