import json
import time
from datetime import datetime
from kafka import KafkaProducer
import requests

producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

TOPIC_NAME = "crypto-prices"

API_URL = "https://api.coingecko.com/api/v3/simple/price"
COINS = ["bitcoin", "ethereum", "solana"]


def fetch_crypto_prices():
    params = {
        "ids": ",".join(COINS),
        "vs_currencies": "usd"
    }

    response = requests.get(API_URL, params=params)
    response.raise_for_status()

    data = response.json()
    timestamp = datetime.utcnow().isoformat()

    messages = []

    for coin in COINS:
        messages.append({
            "coin": coin,
            "currency": "usd",
            "price": data[coin]["usd"],
            "timestamp": timestamp
        })

    return messages


while True:
    try:
        prices = fetch_crypto_prices()

        for price in prices:
            producer.send(TOPIC_NAME, value=price)
            print(f"Sent to Kafka: {price}")

        producer.flush()
        time.sleep(30)

    except Exception as e:
        print(f"Producer error: {e}")
        time.sleep(30)
        