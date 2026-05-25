from kafka import KafkaConsumer
from pymongo import MongoClient
import json

client = MongoClient("mongodb://localhost:27017/")

db = client["crypto_db"]

collection = db["prices"]

consumer = KafkaConsumer(
    "btc-price",
    bootstrap_servers='localhost:9092',
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

for message in consumer:

    data = message.value

    print("Received:", data)

    collection.insert_one(data)
    