import asyncio
from datetime import datetime

import httpx

from database.database import coins_collection
from config.settings import (
    SUPPORTED_COINS,
    CURRENCY,
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_TOPIC
)
from kafka_service.producer import publish_price
from utils.logger import logger


# --------------------------------------------------
# CoinGecko API
# --------------------------------------------------

API_URL = "https://api.coingecko.com/api/v3/simple/price"


# --------------------------------------------------
# Get Active Coins
# Reads coins from MongoDB.
# Falls back to SUPPORTED_COINS if none exist.
# --------------------------------------------------

async def get_active_coins():

    coins = await coins_collection.find(
        {"active": True},
        {"_id": 0, "coin": 1}
    ).to_list(length=100)

    if coins:
        return [
            coin["coin"].strip().lower()
            for coin in coins
        ]

    return SUPPORTED_COINS


# --------------------------------------------------
# Fetch Prices From CoinGecko
# --------------------------------------------------

async def fetch_crypto_prices():

    active_coins = await get_active_coins()

    if not active_coins:
        logger.warning("No active cryptocurrencies configured")
        return []

    params = {
        "ids": ",".join(active_coins),
        "vs_currencies": CURRENCY,
        "include_24hr_vol": "true",
        "include_market_cap": "true"
    }

    try:

        async with httpx.AsyncClient(timeout=10) as client:

            response = await client.get(
                API_URL,
                params=params
            )

            response.raise_for_status()

            data = response.json()

        timestamp = datetime.utcnow().isoformat()

        prices = []

        for coin in active_coins:

            if coin not in data:

                logger.warning(
                    f"{coin} not found in CoinGecko response"
                )

                continue

            coin_data = data[coin]

            price = coin_data.get(CURRENCY)

            if price is None:

                logger.warning(
                    f"Price unavailable for {coin}"
                )

                continue

            price_record = {

                "coin": coin,

                "price": price,

                "volume": coin_data.get(
                    f"{CURRENCY}_24h_vol",
                    0
                ),

                "market_cap": coin_data.get(
                    f"{CURRENCY}_market_cap",
                    0
                ),

                "currency": CURRENCY,

                "timestamp": timestamp
            }

            prices.append(price_record)

        logger.info(
            f"Fetched prices successfully for {len(prices)} coins"
        )

        return prices

    except httpx.HTTPError as e:

        logger.error(
            f"CoinGecko API request failed: {str(e)}"
        )

        return []

    except Exception as e:

        logger.error(
            f"Price fetching failed: {str(e)}"
        )

        return []


# --------------------------------------------------
# Fetch Prices And Send To Kafka
# --------------------------------------------------

async def fetch_and_publish_prices():

    prices = await fetch_crypto_prices()

    if not prices:

        logger.warning(
            "No prices available to publish"
        )

        return

    for price in prices:

        try:

            publish_price(price)

            logger.info(
                f"Published {price['coin']} price to Kafka"
            )

        except Exception as e:

            logger.error(
                f"Failed to publish {price['coin']}: {str(e)}"
            )

    logger.info(
        f"Published {len(prices)} prices to Kafka topic '{KAFKA_TOPIC}'"
    )


# --------------------------------------------------
# Continuous Price Fetcher
# --------------------------------------------------

async def main():

    logger.info(
        "CryptoPulse price fetcher started"
    )

    while True:

        await fetch_and_publish_prices()

        await asyncio.sleep(30)


# --------------------------------------------------
# Run Directly
# --------------------------------------------------

if __name__ == "__main__":

    asyncio.run(main())