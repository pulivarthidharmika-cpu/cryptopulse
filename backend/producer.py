from kafka import KafkaProducer
import requests
import json
import time

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda x: json.dumps(x).encode('utf-8')
)

while True:

    url = "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"

    response = requests.get(url).json()

    data = {
        "symbol": response["symbol"],
        "price": response["price"]
    }

    producer.send("btc-price", value=data)

    print("Sent:", data)

    time.sleep(2)