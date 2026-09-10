import json

from kafka import KafkaProducer

from config.settings import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_TOPIC,
    BTC_PRICE_TOPIC,
    MARKET_ALERTS_TOPIC,
    TRADE_VOLUME_TOPIC
)

from utils.logger import logger


# ==================================================
# KAFKA PRODUCER
# Lazy & Resilient
# ==================================================

_producer = None


def get_producer():
    """
    Create Kafka producer only when it is needed.

    This prevents the application from failing to start
    if Kafka is temporarily unavailable.
    """

    global _producer

    if _producer is not None:
        return _producer

    try:

        _producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,

            value_serializer=lambda value:
                json.dumps(value).encode("utf-8"),

            request_timeout_ms=2000,

            api_version_auto_timeout_ms=2000,

            max_block_ms=2000
        )

        logger.info(
            "Kafka Producer initialized successfully"
        )

        return _producer

    except Exception as e:

        logger.warning(
            f"Kafka Producer initialization failed: {str(e)}"
        )

        _producer = None

        return None


# ==================================================
# HELPER - SEND MESSAGE
# ==================================================

def _send_message(
    topic: str,
    data: dict
):
    """
    Send a message to a Kafka topic.

    Returns:
        True  -> successful
        False -> failed
    """

    try:

        producer = get_producer()

        if producer is None:

            logger.warning(
                f"Kafka unavailable. "
                f"Skipping message for topic '{topic}'"
            )

            return False

        producer.send(
            topic,
            value=data
        )

        producer.flush(timeout=2)

        logger.info(
            f"Kafka message published to '{topic}'"
        )

        return True

    except Exception as e:

        logger.warning(
            f"Kafka publish failed for "
            f"topic '{topic}': {str(e)}"
        )

        return False


# ==================================================
# PUBLISH PRICE
# ==================================================

def publish_price(price_data: dict):
    """
    Publish cryptocurrency price information.

    Backward compatibility:
        The existing 'crypto-prices' topic is still used.

    New architecture:
        Bitcoin data  -> btc-price
        Volume data   -> trade-volume
    """

    try:

        coin = price_data.get(
            "coin",
            ""
        ).lower()

        # --------------------------------------------------
        # 1. EXISTING TOPIC
        #
        # Keep this temporarily so the current consumer
        # continues working while we migrate the architecture.
        # --------------------------------------------------

        old_topic_success = _send_message(
            KAFKA_TOPIC,
            price_data
        )

        # --------------------------------------------------
        # 2. BITCOIN PRICE TOPIC
        #
        # Requirement:
        # btc-price
        # --------------------------------------------------

        if coin == "bitcoin":

            _send_message(
                BTC_PRICE_TOPIC,
                price_data
            )

        # --------------------------------------------------
        # 3. TRADE VOLUME TOPIC
        #
        # Requirement:
        # trade-volume
        # --------------------------------------------------

        if price_data.get("volume") is not None:

            volume_data = {
                "coin": coin,
                "volume": price_data.get("volume"),
                "price": price_data.get("price"),
                "currency": price_data.get("currency"),
                "timestamp": price_data.get("timestamp")
            }

            _send_message(
                TRADE_VOLUME_TOPIC,
                volume_data
            )

        logger.info(
            f"Price processing completed for '{coin}'"
        )

        return old_topic_success

    except Exception as e:

        logger.warning(
            f"Price publish failed for "
            f"{price_data.get('coin')}: {str(e)}"
        )

        return False


# ==================================================
# PUBLISH MARKET ALERT
# ==================================================

def publish_market_alert(
    alert_data: dict
):
    """
    Publish market-alert information.

    Used by the Alert Engine when a price/market
    condition is detected.
    """

    try:

        if not isinstance(alert_data, dict):

            logger.warning(
                "Invalid market alert data"
            )

            return False

        return _send_message(
            MARKET_ALERTS_TOPIC,
            alert_data
        )

    except Exception as e:

        logger.warning(
            f"Market alert publish failed: {str(e)}"
        )

        return False


# ==================================================
# CLOSE PRODUCER
# ==================================================

def close_producer():
    """
    Close Kafka producer cleanly when the application
    shuts down.
    """

    global _producer

    try:

        if _producer is not None:

            _producer.flush(timeout=2)

            _producer.close()

            _producer = None

            logger.info(
                "Kafka Producer closed successfully"
            )

    except Exception as e:

        logger.warning(
            f"Kafka Producer close failed: {str(e)}"
        )