import asyncio
import json

from kafka import KafkaConsumer

from database.database import (
    live_prices_collection,
    historical_prices_collection
)

from config.settings import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_TOPIC
)

from utils.logger import logger


# --------------------------------------------------
# Store Price Data In MongoDB
# --------------------------------------------------

async def store_price(data: dict):

    try:

        # ------------------------------------------
        # Store latest price
        # ------------------------------------------

        await live_prices_collection.update_one(
            {"coin": data["coin"]},
            {"$set": data},
            upsert=True
        )

        # ------------------------------------------
        # Store historical price
        # ------------------------------------------

        await historical_prices_collection.insert_one(
            data.copy()
        )

        logger.info(
            f"Price stored in MongoDB: {data['coin']}"
        )

    except Exception as e:

        logger.error(
            f"MongoDB price storage failed: {str(e)}"
        )

        raise


# --------------------------------------------------
# Kafka Consumer
# --------------------------------------------------

consumer = KafkaConsumer(

    KAFKA_TOPIC,

    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,

    auto_offset_reset="latest",

    enable_auto_commit=True,

    value_deserializer=lambda message:
        json.loads(message.decode("utf-8"))
)


# --------------------------------------------------
# Start Kafka Consumer
# --------------------------------------------------

async def consume_messages():

    logger.info(
        f"Kafka Consumer started on topic: {KAFKA_TOPIC}"
    )

    print(
        f"Kafka Consumer started. "
        f"Listening to '{KAFKA_TOPIC}'..."
    )

    loop = asyncio.get_running_loop()

    # KafkaConsumer is synchronous, so iteration
    # is moved to a background executor.

    while True:

        try:

            messages = await loop.run_in_executor(
                None,
                consumer.poll,
                1000
            )

            for _, records in messages.items():

                for message in records:

                    data = message.value

                    logger.info(
                        f"Received from Kafka: {data}"
                    )

                    print(
                        f"Received from Kafka: {data}"
                    )

                    await store_price(data)

        except Exception as e:

            logger.error(
                f"Kafka consumer error: {str(e)}"
            )

            print(
                f"Kafka consumer error: {e}"
            )

            await asyncio.sleep(5)


# --------------------------------------------------
# Run Consumer Directly
# --------------------------------------------------

if __name__ == "__main__":

    asyncio.run(
        consume_messages()
    )