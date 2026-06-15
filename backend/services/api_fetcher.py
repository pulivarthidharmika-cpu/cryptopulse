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
    "vs_currencies": "usd",
    "include_24hr_vol": "true"
}


async def fetch_and_store_prices():
    try:
        response = requests.get(API_URL, params=PARAMS)
        data = response.json()

        timestamp = datetime.utcnow()

        for coin in COINS:
            price = data[coin]["usd"]
            volume = data[coin].get("usd_24h_vol", 0)

            price_record = {
                "coin": coin,
                "price": price,
                "volume": volume,
                "currency": "usd",
                "timestamp": timestamp
            }

            await historical_prices_collection.insert_one(price_record.copy())

            await live_prices_collection.update_one(
                {"coin": coin},
                {"$set": price_record},
                upsert=True
            )

        print("Prices and volume stored successfully")

    except Exception as e:
        print("Error fetching prices:", e)


async def main():
    while True:
        await fetch_and_store_prices()
        await asyncio.sleep(30)


if __name__ == "__main__":
    asyncio.run(main())
    
    