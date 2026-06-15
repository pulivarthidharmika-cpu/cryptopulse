import json
from kafka import KafkaConsumer
from pymongo import MongoClient

consumer = KafkaConsumer(
    "crypto-prices",
    bootstrap_servers="localhost:9092",
    auto_offset_reset="latest",
    enable_auto_commit=True,
    value_deserializer=lambda m: json.loads(m.decode("utf-8"))
)

client = MongoClient("mongodb://localhost:27017")
db = client["cryptopulse_db"]

live_prices = db["live_prices"]
historical_prices = db["historical_prices"]


print("Kafka Consumer started. Waiting for messages...")

for message in consumer:
    data = message.value

    live_prices.update_one(
        {"coin": data["coin"]},
        {"$set": data},
        upsert=True
    )

    historical_prices.insert_one(data)

    print(f"Stored in MongoDB: {data}")
    