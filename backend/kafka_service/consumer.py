import asyncio
import json

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

        await alerts_collection.insert_one(
            clean_data
        )

        logger.info(
            f"Market alert stored in MongoDB: "
            f"{clean_data.get('coin', 'unknown')}"
        )

    except Exception as e:

        logger.error(
            f"MongoDB alert storage failed: {str(e)}"
        )


# ==================================================
# KAFKA CONSUMER
# ==================================================

_consumer = None


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

            request_timeout_ms=3000,

            consumer_timeout_ms=1000,

            value_deserializer=lambda message:
                json.loads(
                    message.decode("utf-8")
                )
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

    logger.info(
        f"Received message from '{topic}': {data}"
    )

    # --------------------------------------------------
    # Existing price topic
    # --------------------------------------------------

    if topic == KAFKA_TOPIC:

        await store_price(data)

    # --------------------------------------------------
    # Bitcoin price topic
    # --------------------------------------------------

    elif topic == BTC_PRICE_TOPIC:

        await store_price(data)

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

    while True:

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

    global _consumer

    try:

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