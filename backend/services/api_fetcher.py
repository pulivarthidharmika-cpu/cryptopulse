# Import requests library to call external APIs
import requests

# Import asyncio for running continuous async tasks
import asyncio

# Import datetime to store timestamps
from datetime import datetime


# Import MongoDB collections
from database.database import (
    live_prices_collection,
    historical_prices_collection,
    coins_collection
)

# Import project settings from .env/config
from config.settings import SUPPORTED_COINS, CURRENCY

# Import logger
from utils.logger import logger


# --------------------------------------------------
# CoinGecko API URL
# Used to fetch cryptocurrency data
# --------------------------------------------------
API_URL = "https://api.coingecko.com/api/v3/simple/price"


# --------------------------------------------------
# Get Active Coins
# Reads coins from MongoDB coins collection
# If no coins are found, it uses default SUPPORTED_COINS
# --------------------------------------------------
async def get_active_coins():

    # Fetch active coins from MongoDB
    coins = await coins_collection.find(
        {"active": True},
        {"_id": 0, "coin": 1}
    ).to_list(length=100)

    # If coins exist in MongoDB, use them
    if coins:
        return [coin["coin"] for coin in coins]

    # If coins collection is empty, use default coins
    return SUPPORTED_COINS


# --------------------------------------------------
# Fetch Crypto Prices and Store in MongoDB
# --------------------------------------------------
async def fetch_and_store_prices():
    try:

        # Get coins from MongoDB
        active_coins = await get_active_coins()

        # API parameters
        params = {
            "ids": ",".join(active_coins),
            "vs_currencies": CURRENCY,
            "include_24hr_vol": "true",
            "include_market_cap": "true"
        }

        # Send GET request to CoinGecko API
        response = requests.get(
            API_URL,
            params=params,
            timeout=10
        )

        # Raise exception if API fails
        response.raise_for_status()

        # Convert JSON response into Python dictionary
        data = response.json()

        # Current timestamp
        timestamp = datetime.utcnow()

        # Loop through all active coins
        for coin in active_coins:

            # Check if coin exists in API response
            if coin not in data:
                logger.warning(
                    f"{coin} not found in API response"
                )
                continue

            # Extract current price
            price = data[coin].get(CURRENCY)

            # Extract 24-hour trading volume
            volume = data[coin].get(
                f"{CURRENCY}_24h_vol",
                0
            )

            # Extract market capitalization
            market_cap = data[coin].get(
                f"{CURRENCY}_market_cap",
                0
            )

            # Create MongoDB document
            price_record = {
                "coin": coin,
                "price": price,
                "volume": volume,
                "market_cap": market_cap,
                "currency": CURRENCY,
                "timestamp": timestamp
            }

            # Store record in historical collection
            await historical_prices_collection.insert_one(
                price_record.copy()
            )

            # Update live prices collection
            # Creates document if it does not exist
            await live_prices_collection.update_one(
                {"coin": coin},
                {"$set": price_record},
                upsert=True
            )

        # Success log
        logger.info(
            f"Prices stored successfully for coins: {active_coins}"
        )

        print(
            "Prices stored successfully for coins:",
            active_coins
        )

    # Handle API-related errors
    except requests.exceptions.RequestException as e:

        logger.error(
            f"API request failed: {str(e)}"
        )

        print(
            "API request failed:",
            e
        )

    # Handle unexpected errors
    except Exception as e:

        logger.error(
            f"Error fetching prices: {str(e)}"
        )

        print(
            "Error fetching prices:",
            e
        )


# --------------------------------------------------
# Main Function
# Runs continuously every 30 seconds
# --------------------------------------------------
async def main():

    while True:

        # Fetch latest prices
        await fetch_and_store_prices()

        # Wait 30 seconds
        await asyncio.sleep(30)


# --------------------------------------------------
# Program Entry Point
# Runs only when file is executed directly
# --------------------------------------------------
if __name__ == "__main__":
    asyncio.run(main())
    