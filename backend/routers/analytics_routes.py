from fastapi import APIRouter, HTTPException
from database.database import historical_prices_collection
from utils.logger import logger
from config.settings import SUPPORTED_COINS
import statistics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def calculate_sma(prices, window=5):
    if len(prices) < window:
        return None
    return round(sum(prices[-window:]) / window, 2)


def calculate_percentage_change(prices):
    if len(prices) < 2:
        return None

    previous_price = prices[-2]
    current_price = prices[-1]

    if previous_price == 0:
        return None

    return round(((current_price - previous_price) / previous_price) * 100, 2)


def calculate_volatility(prices):
    if len(prices) < 2:
        return None
    return round(statistics.stdev(prices), 2)


def detect_sudden_spike(percentage_change, threshold=5):
    if percentage_change is None:
        return False
    return percentage_change >= threshold


def detect_price_drop(percentage_change, threshold=-5):
    if percentage_change is None:
        return False
    return percentage_change <= threshold


def detect_volume_spike(volumes, threshold=2):
    if len(volumes) < 2:
        return False

    average_volume = sum(volumes[:-1]) / len(volumes[:-1])
    latest_volume = volumes[-1]

    if average_volume == 0:
        return False

    return latest_volume >= average_volume * threshold


@router.get("/")
async def get_analytics():
    try:
        records = []

        cursor = historical_prices_collection.find({}, {"_id": 0}).sort("timestamp", 1)

        async for document in cursor:
            records.append(document)

        analytics = {}

        for coin in SUPPORTED_COINS:
            coin_records = [
                item for item in records
                if item.get("coin") == coin
            ]

            prices = [
                item["price"]
                for item in coin_records
                if "price" in item
            ]

            volumes = [
                item["volume"]
                for item in coin_records
                if "volume" in item
            ]

            if prices:
                percentage_change = calculate_percentage_change(prices)

                analytics[coin] = {
                    "average_price": round(sum(prices) / len(prices), 2),
                    "maximum_price": max(prices),
                    "minimum_price": min(prices),
                    "total_records": len(prices),

                    "simple_moving_average_5": calculate_sma(prices, 5),
                    "simple_moving_average_10": calculate_sma(prices, 10),
                    "percentage_change": percentage_change,
                    "volatility": calculate_volatility(prices),

                    "sudden_spike_detected": detect_sudden_spike(percentage_change),
                    "price_drop_detected": detect_price_drop(percentage_change),

                    "average_volume": round(sum(volumes) / len(volumes), 2) if volumes else None,
                    "latest_volume": volumes[-1] if volumes else None,
                    "volume_spike_detected": detect_volume_spike(volumes) if volumes else False
                }
            else:
                analytics[coin] = {
                    "message": "No historical data found"
                }

        logger.info("Advanced analytics with volume calculated successfully")

        return {
            "status": "success",
            "analytics": analytics
        }

    except Exception as e:
        logger.error(f"Analytics calculation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        