# Import APIRouter to create separate route files
# Import HTTPException to return proper error responses
from fastapi import APIRouter, HTTPException

# Import MongoDB historical prices collection
from database.database import historical_prices_collection

# Import logger to store success/error logs
from utils.logger import logger

# Import supported coins list from settings.py
from config.settings import SUPPORTED_COINS

# Python standard libraries
import statistics
from datetime import datetime


# --------------------------------------------------
# Create Analytics router
# prefix="/analytics" means all APIs in this file start with /analytics
# tags=["Analytics"] groups these APIs in Swagger UI
# --------------------------------------------------

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# ==================================================
# SIMPLE MOVING AVERAGE
# ==================================================

def calculate_sma(prices, window=5):

    if len(prices) < window:
        return None

    return round(
        sum(prices[-window:]) / window,
        2
    )


# ==================================================
# PERCENTAGE CHANGE
# ==================================================

def calculate_percentage_change(prices):

    if len(prices) < 2:
        return None

    previous_price = prices[-2]
    current_price = prices[-1]

    if previous_price == 0:
        return None

    return round(
        ((current_price - previous_price) / previous_price) * 100,
        2
    )


# ==================================================
# VOLATILITY
# ==================================================

def calculate_volatility(prices):

    if len(prices) < 2:
        return None

    return round(
        statistics.stdev(prices),
        2
    )


# ==================================================
# SUDDEN PRICE SPIKE
# ==================================================

def detect_sudden_spike(percentage_change, threshold=5):

    if percentage_change is None:
        return False

    return percentage_change >= threshold


# ==================================================
# PRICE DROP
# ==================================================

def detect_price_drop(percentage_change, threshold=-5):

    if percentage_change is None:
        return False

    return percentage_change <= threshold


# ==================================================
# VOLUME SPIKE
# ==================================================

def detect_volume_spike(volumes, threshold=2):

    if len(volumes) < 2:
        return False

    average_volume = sum(
        volumes[:-1]
    ) / len(volumes[:-1])

    latest_volume = volumes[-1]

    if average_volume == 0:
        return False

    return latest_volume >= average_volume * threshold


# ==================================================
# MAIN ANALYTICS API
# GET /analytics/
# ==================================================

@router.get("/")
async def get_analytics():

    try:

        records = []

        cursor = historical_prices_collection.find(
            {},
            {"_id": 0}
        ).sort("timestamp", 1)

        async for document in cursor:
            records.append(document)

        analytics = {}

        latest_summary = []

        for coin in SUPPORTED_COINS:

            coin_records = [
                item
                for item in records
                if item.get("coin") == coin
            ]

            prices = [
                item["price"]
                for item in coin_records
                if "price" in item
                and item["price"] is not None
            ]

            volumes = [
                item["volume"]
                for item in coin_records
                if "volume" in item
                and item["volume"] is not None
            ]

            market_caps = [
                item["market_cap"]
                for item in coin_records
                if "market_cap" in item
                and item["market_cap"] is not None
            ]

            if prices:

                percentage_change = (
                    calculate_percentage_change(prices)
                )

                latest_price = prices[-1]

                latest_volume = (
                    volumes[-1]
                    if volumes
                    else None
                )

                latest_market_cap = (
                    market_caps[-1]
                    if market_caps
                    else None
                )

                analytics[coin] = {

                    "average_price": round(
                        sum(prices) / len(prices),
                        2
                    ),

                    "maximum_price": max(prices),

                    "minimum_price": min(prices),

                    "latest_price": latest_price,

                    "total_records": len(prices),

                    "simple_moving_average_5":
                        calculate_sma(
                            prices,
                            5
                        ),

                    "simple_moving_average_10":
                        calculate_sma(
                            prices,
                            10
                        ),

                    "percentage_change":
                        percentage_change,

                    "volatility":
                        calculate_volatility(
                            prices
                        ),

                    "sudden_spike_detected":
                        detect_sudden_spike(
                            percentage_change
                        ),

                    "price_drop_detected":
                        detect_price_drop(
                            percentage_change
                        ),

                    "average_volume":
                        round(
                            sum(volumes) / len(volumes),
                            2
                        )
                        if volumes
                        else None,

                    "latest_volume":
                        latest_volume,

                    "highest_volume":
                        max(volumes)
                        if volumes
                        else None,

                    "volume_spike_detected":
                        detect_volume_spike(
                            volumes
                        )
                        if volumes
                        else False,

                    "average_market_cap":
                        round(
                            sum(market_caps) /
                            len(market_caps),
                            2
                        )
                        if market_caps
                        else None,

                    "latest_market_cap":
                        latest_market_cap,

                    "highest_market_cap":
                        max(market_caps)
                        if market_caps
                        else None
                }

                latest_summary.append({

                    "coin": coin,

                    "latest_price":
                        latest_price,

                    "latest_volume":
                        latest_volume,

                    "latest_market_cap":
                        latest_market_cap
                })

            else:

                analytics[coin] = {
                    "message":
                        "No historical data found"
                }

        highest_volume_coin = (
            max(
                latest_summary,
                key=lambda x:
                    x["latest_volume"] or 0
            )
            if latest_summary
            else None
        )

        highest_market_cap_coin = (
            max(
                latest_summary,
                key=lambda x:
                    x["latest_market_cap"] or 0
            )
            if latest_summary
            else None
        )

        total_market_cap = round(
            sum(
                item["latest_market_cap"] or 0
                for item in latest_summary
            ),
            2
        )

        logger.info(
            "Advanced analytics with volume and market cap "
            "calculated successfully"
        )

        return {

            "status": "success",

            "summary": {

                "highest_volume_coin":
                    highest_volume_coin,

                "highest_market_cap_coin":
                    highest_market_cap_coin,

                "total_market_cap":
                    total_market_cap
            },

            "analytics":
                analytics
        }

    except Exception as e:

        logger.error(
            f"Analytics calculation failed: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# OHLC / CANDLESTICK DATA
# GET /analytics/ohlc/{coin}
#
# Creates 1-minute candles from historical prices.
#
# Open  = first price
# High  = maximum price
# Low   = minimum price
# Close = last price
# ==================================================

@router.get("/ohlc/{coin}")
async def get_ohlc(
    coin: str,
    limit: int = 500
):

    try:

        coin = coin.strip().lower()

        # ------------------------------------------
        # Validate coin
        # ------------------------------------------

        if coin not in SUPPORTED_COINS:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported coin '{coin}'. "
                    f"Supported coins: "
                    f"{', '.join(SUPPORTED_COINS)}"
                )
            )

        # ------------------------------------------
        # Protect the API from extremely large
        # responses
        # ------------------------------------------

        limit = max(
            1,
            min(limit, 1000)
        )

        # ------------------------------------------
        # Fetch historical prices for selected coin
        # ------------------------------------------

        cursor = historical_prices_collection.find(
            {
                "coin": coin
            },
            {
                "_id": 0,
                "coin": 1,
                "price": 1,
                "timestamp": 1
            }
        ).sort(
            "timestamp",
            1
        )

        records = []

        async for document in cursor:

            price = document.get("price")
            timestamp = document.get("timestamp")

            if price is None or timestamp is None:
                continue

            try:

                price = float(price)

                # ----------------------------------
                # Convert timestamp into datetime
                # ----------------------------------

                if isinstance(
                    timestamp,
                    datetime
                ):

                    dt = timestamp

                else:

                    timestamp_text = str(
                        timestamp
                    )

                    # Handle ISO timestamps ending
                    # with Z
                    if timestamp_text.endswith("Z"):
                        timestamp_text = (
                            timestamp_text[:-1]
                            + "+00:00"
                        )

                    dt = datetime.fromisoformat(
                        timestamp_text
                    )

                records.append({
                    "datetime": dt,
                    "price": price
                })

            except Exception:

                logger.warning(
                    f"Invalid historical record "
                    f"ignored for {coin}"
                )

        # ------------------------------------------
        # No records
        # ------------------------------------------

        if not records:

            return {
                "status": "success",
                "coin": coin,
                "interval": "1m",
                "data": []
            }

        # ------------------------------------------
        # Build 1-minute candles
        # ------------------------------------------

        candles = {}

        for record in records:

            dt = record["datetime"]
            price = record["price"]

            # Remove seconds/microseconds so all
            # prices in the same minute belong to
            # one candle.
            candle_time = dt.replace(
                second=0,
                microsecond=0
            )

            key = candle_time.isoformat()

            if key not in candles:

                candles[key] = {

                    "timestamp":
                        int(
                            candle_time.timestamp()
                            * 1000
                        ),

                    "open": price,

                    "high": price,

                    "low": price,

                    "close": price
                }

            else:

                candle = candles[key]

                # Open remains the first price.

                candle["high"] = max(
                    candle["high"],
                    price
                )

                candle["low"] = min(
                    candle["low"],
                    price
                )

                # Close becomes the newest price.
                candle["close"] = price

        # ------------------------------------------
        # Convert dictionary to sorted list
        # ------------------------------------------

        ohlc_data = list(
            candles.values()
        )

        ohlc_data.sort(
            key=lambda x:
                x["timestamp"]
        )

        # ------------------------------------------
        # Return only the latest requested candles
        # ------------------------------------------

        ohlc_data = ohlc_data[-limit:]

        logger.info(
            f"Generated {len(ohlc_data)} "
            f"1-minute OHLC candles for {coin}"
        )

        return {

            "status": "success",

            "coin": coin,

            "interval": "1m",

            "count":
                len(ohlc_data),

            "data":
                ohlc_data
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"OHLC calculation failed for "
            f"{coin}: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )