import asyncio
from datetime import datetime

import httpx

from database.database import coins_collection
from config.settings import (
    SUPPORTED_COINS,
    CURRENCY,
    KAFKA_TOPIC,
    COINGECKO_API_URL,
    BINANCE_API_URL,
    CRYPTOCOMPARE_API_URL,
    MARKET_DATA_INTERVAL_SECONDS,
)
from kafka_service.producer import publish_price
from kafka_service.consumer import store_price
from utils.logger import logger


# ============================================================
# API ENDPOINTS
# ============================================================

COINGECKO_PRICE_URL = f"{COINGECKO_API_URL}/simple/price"
BINANCE_TICKER_URL = f"{BINANCE_API_URL}/ticker/24hr"
CRYPTOCOMPARE_PRICE_URL = f"{CRYPTOCOMPARE_API_URL}/pricemultifull"


# ============================================================
# COIN MAPPING
# ============================================================

# MongoDB / CoinGecko names -> Binance symbols
BINANCE_SYMBOLS = {
    "bitcoin": "BTCUSDT",
    "ethereum": "ETHUSDT",
    "solana": "SOLUSDT",
}

# MongoDB / CoinGecko names -> CryptoCompare symbols
CRYPTOCOMPARE_SYMBOLS = {
    "bitcoin": "BTC",
    "ethereum": "ETH",
    "solana": "SOL",
}


# ============================================================
# GET ACTIVE COINS
# ============================================================

async def get_active_coins():

    coins = await coins_collection.find(
        {"active": True},
        {"_id": 0, "coin": 1}
    ).to_list(length=100)

    if coins:
        return [
            coin["coin"].strip().lower()
            for coin in coins
            if coin.get("coin")
        ]

    return SUPPORTED_COINS


# ============================================================
# FETCH COINGECKO DATA
# ============================================================

async def fetch_coingecko_prices(client, active_coins):

    params = {
        "ids": ",".join(active_coins),
        "vs_currencies": CURRENCY,
        "include_24hr_vol": "true",
        "include_market_cap": "true",
        "include_24hr_change": "true",
    }

    try:

        response = await client.get(
            COINGECKO_PRICE_URL,
            params=params
        )

        response.raise_for_status()

        data = response.json()

        logger.info(
            f"CoinGecko returned data for {len(data)} coins"
        )

        return data

    except Exception as e:

        logger.warning(
            f"CoinGecko API request failed: {str(e)}"
        )

        return {}


# ============================================================
# FETCH BINANCE DATA
# ============================================================

async def fetch_binance_prices(client, active_coins):

    results = {}

    for coin in active_coins:

        symbol = BINANCE_SYMBOLS.get(coin)

        if not symbol:
            continue

        try:

            response = await client.get(
                BINANCE_TICKER_URL,
                params={"symbol": symbol}
            )

            response.raise_for_status()

            data = response.json()

            results[coin] = data

        except Exception as e:

            logger.warning(
                f"Binance request failed for {coin}: {str(e)}"
            )

    logger.info(
        f"Binance returned data for {len(results)} coins"
    )

    return results


# ============================================================
# FETCH CRYPTOCOMPARE DATA
# ============================================================

async def fetch_cryptocompare_prices(client, active_coins):

    symbols = [
        CRYPTOCOMPARE_SYMBOLS[coin]
        for coin in active_coins
        if coin in CRYPTOCOMPARE_SYMBOLS
    ]

    if not symbols:
        return {}

    params = {
        "fsyms": ",".join(symbols),
        "tsyms": CURRENCY.upper(),
    }

    try:

        response = await client.get(
            CRYPTOCOMPARE_PRICE_URL,
            params=params
        )

        response.raise_for_status()

        data = response.json()

        logger.info(
            f"CryptoCompare returned data for {len(symbols)} coins"
        )

        return data.get("RAW", {})

    except Exception as e:

        logger.warning(
            f"CryptoCompare API request failed: {str(e)}"
        )

        return {}


# ============================================================
# BUILD UNIFIED PRICE RECORD
# ============================================================

def build_price_records(
    active_coins,
    coingecko_data,
    binance_data,
    cryptocompare_data
):

    timestamp = datetime.utcnow().isoformat()

    prices = []

    for coin in active_coins:

        cg = coingecko_data.get(coin, {})

        price = cg.get(CURRENCY)

        # ----------------------------------------------------
        # Prefer Binance real-time price when available
        # ----------------------------------------------------

        binance = binance_data.get(coin, {})

        if binance.get("lastPrice") is not None:

            try:
                price = float(binance["lastPrice"])
            except (TypeError, ValueError):
                pass

        # ----------------------------------------------------
        # Skip coin if no price is available
        # ----------------------------------------------------

        if price is None:

            logger.warning(
                f"No price available for {coin}"
            )

            continue

        # ----------------------------------------------------
        # Volume
        # ----------------------------------------------------

        volume = cg.get(
            f"{CURRENCY}_24h_vol",
            0
        )

        if binance.get("quoteVolume") is not None:

            try:
                volume = float(binance["quoteVolume"])
            except (TypeError, ValueError):
                pass

        # ----------------------------------------------------
        # Market cap
        # CoinGecko provides this.
        # ----------------------------------------------------

        market_cap = cg.get(
            f"{CURRENCY}_market_cap",
            0
        )

        # ----------------------------------------------------
        # 24 hour change
        # ----------------------------------------------------

        change_24h = cg.get(
            f"{CURRENCY}_24h_change",
            0
        )

        if binance.get("priceChangePercent") is not None:

            try:
                change_24h = float(
                    binance["priceChangePercent"]
                )
            except (TypeError, ValueError):
                pass

        # ----------------------------------------------------
        # CryptoCompare enrichment
        # ----------------------------------------------------

        cc_symbol = CRYPTOCOMPARE_SYMBOLS.get(coin)

        cryptocompare = {}

        if cc_symbol:

            cryptocompare = cryptocompare_data.get(
                cc_symbol,
                {}
            ).get(
                CURRENCY.upper(),
                {}
            )

        price_record = {

            "coin": coin,

            "price": float(price),

            "volume": float(volume or 0),

            "market_cap": float(market_cap or 0),

            "change_24h": float(change_24h or 0),

            "currency": CURRENCY,

            "timestamp": timestamp,

            # Source information is useful for debugging
            # and demonstrating multi-API integration.
            "sources": {
                "coingecko": bool(cg),
                "binance": bool(binance),
                "cryptocompare": bool(cryptocompare),
            },

            # Additional Binance information
            "binance_symbol": binance.get("symbol"),

            # Additional CryptoCompare information
            "cryptocompare_price": cryptocompare.get(
                "PRICE"
            ),
        }

        prices.append(price_record)

    return prices


# ============================================================
# FETCH PRICES FROM ALL APIs
# ============================================================

async def fetch_crypto_prices():

    active_coins = await get_active_coins()

    if not active_coins:

        logger.warning(
            "No active cryptocurrencies configured"
        )

        return []

    try:

        async with httpx.AsyncClient(timeout=10) as client:

            # Run the three API requests concurrently.
            coingecko_data, binance_data, cryptocompare_data = (
                await asyncio.gather(
                    fetch_coingecko_prices(
                        client,
                        active_coins
                    ),

                    fetch_binance_prices(
                        client,
                        active_coins
                    ),

                    fetch_cryptocompare_prices(
                        client,
                        active_coins
                    ),
                )
            )

        prices = build_price_records(
            active_coins,
            coingecko_data,
            binance_data,
            cryptocompare_data
        )

        logger.info(
            f"Unified market data created for {len(prices)} coins"
        )

        return prices

    except Exception as e:

        logger.error(
            f"Multi-API price fetching failed: {str(e)}"
        )

        return []


# ============================================================
# FETCH + STORE + KAFKA
# ============================================================

async def fetch_and_publish_prices():

    prices = await fetch_crypto_prices()

    if not prices:

        logger.warning(
            "No prices available to publish"
        )

        return

    for price in prices:

        # ----------------------------------------------------
        # 1. Store directly in MongoDB
        # ----------------------------------------------------

        try:

            await store_price(price)

        except Exception as e:

            logger.error(
                f"Failed to store "
                f"{price['coin']} in MongoDB: {str(e)}"
            )

        # ----------------------------------------------------
        # 2. Publish to Kafka
        # ----------------------------------------------------

        try:

            publish_price(price)

        except Exception as e:

            logger.warning(
                f"Failed to publish "
                f"{price['coin']} to Kafka: {str(e)}"
            )

    logger.info(
        f"Fetched & stored {len(prices)} prices "
        f"in MongoDB "
        f"(Kafka topic: '{KAFKA_TOPIC}')"
    )


# ============================================================
# CONTINUOUS PRICE FETCHER
# ============================================================

async def main():

    logger.info(
        "CryptoPulse multi-API price fetcher started"
    )

    logger.info(
        "APIs enabled: CoinGecko + Binance + CryptoCompare"
    )

    while True:

        await fetch_and_publish_prices()

        await asyncio.sleep(
            MARKET_DATA_INTERVAL_SECONDS
        )


# ============================================================
# RUN DIRECTLY
# ============================================================

if __name__ == "__main__":

    asyncio.run(main())