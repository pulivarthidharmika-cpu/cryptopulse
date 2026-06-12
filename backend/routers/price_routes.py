from fastapi import APIRouter, HTTPException
from database.database import live_prices_collection, historical_prices_collection
from utils.logger import logger
from config.settings import SUPPORTED_COINS

router = APIRouter(prefix="/prices", tags=["Prices"])


@router.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {
        "status": "healthy",
        "message": "CryptoPulse Backend Running"
    }


@router.get("/coins")
async def get_coins():
    logger.info("Coins endpoint called")
    return {
        "coins": SUPPORTED_COINS
    }


@router.get("/latest")
async def get_latest_prices():
    try:
        prices = []

        cursor = live_prices_collection.find({}, {"_id": 0})

        async for document in cursor:
            prices.append(document)

        logger.info("Latest prices fetched successfully")

        return {
            "count": len(prices),
            "data": prices
        }

    except Exception as e:
        logger.error(f"Latest price fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history():
    try:
        history = []

        cursor = historical_prices_collection.find({}, {"_id": 0})

        async for document in cursor:
            history.append(document)

        logger.info("Historical prices fetched successfully")

        return {
            "count": len(history),
            "data": history
        }

    except Exception as e:
        logger.error(f"History fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    