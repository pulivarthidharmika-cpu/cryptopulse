import json

from kafka import KafkaProducer

from config.settings import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_TOPIC
)

from utils.logger import logger


# --------------------------------------------------
# Kafka Producer
# --------------------------------------------------

producer = KafkaProducer(
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_serializer=lambda value: json.dumps(value).encode("utf-8")
)


# --------------------------------------------------
# Publish Price To Kafka
# --------------------------------------------------

def publish_price(price_data: dict):

    try:

        producer.send(
            KAFKA_TOPIC,
            value=price_data
        )

        producer.flush()

        logger.info(
            f"Price published to Kafka: {price_data['coin']}"
        )

    except Exception as e:

        logger.error(
            f"Kafka publish failed: {str(e)}"
        )

        raise