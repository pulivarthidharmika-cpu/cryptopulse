import requests
import asyncio
from datetime import datetime

from database.database import (
    live_prices_collection,
    historical_prices_collection
)

API_URL = "https://api.coingecko.com/api/v3/simple/price"

COINS = ["bitcoin", "ethereum", "solana"]

PARAMS = {
    "ids": ",".join(COINS),
    "vs_currencies": "usd"
}


async def fetch_and_store_prices():
    try:
        response = requests.get(API_URL, params=PARAMS)
        data = response.json()

        timestamp = datetime.utcnow()

        for coin in COINS:
            price = data[coin]["usd"]

            price_record = {
                "coin": coin,
                "price": price,
                "currency": "usd",
                "timestamp": timestamp
            }

            # Store every record in historical_prices
            await historical_prices_collection.insert_one(
                price_record.copy()
            )

            # Store only latest record in live_prices
            await live_prices_collection.update_one(
                {"coin": coin},
                {
                    "$set": {
                        "coin": coin,
                        "price": price,
                        "currency": "usd",
                        "timestamp": timestamp
                    }
                },
                upsert=True
            )

        print("Prices stored successfully")

    except Exception as e:
        print("Error fetching prices:", e)


async def main():
    while True:
        await fetch_and_store_prices()
        await asyncio.sleep(30)   # Fetch every 30 seconds


if __name__ == "__main__":
    asyncio.run(main())
    