from fastapi import APIRouter, HTTPException
from database.database import historical_prices_collection
from utils.logger import logger
from config.settings import SUPPORTED_COINS

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/")
async def get_analytics():
    try:
        records = []

        cursor = historical_prices_collection.find({}, {"_id": 0})

        async for document in cursor:
            records.append(document)

        analytics = {}

        for coin in SUPPORTED_COINS:
            prices = [
                item["price"]
                for item in records
                if item.get("coin") == coin
            ]

            if prices:
                analytics[coin] = {
                    "average_price": round(sum(prices) / len(prices), 2),
                    "maximum_price": max(prices),
                    "minimum_price": min(prices),
                    "total_records": len(prices)
                }
            else:
                analytics[coin] = {
                    "message": "No historical data found"
                }

        logger.info("Analytics calculated successfully")

        return {
            "status": "success",
            "analytics": analytics
        }

    except Exception as e:
        logger.error(f"Analytics calculation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    