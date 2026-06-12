from fastapi import APIRouter, HTTPException
from models.crypto_model import CryptoPrice, Alert
from database.database import (
    live_prices_collection,
    historical_prices_collection,
    alerts_collection
)
from utils.logger import logger
from config.settings import SUPPORTED_COINS, BITCOIN_ALERT_PRICE


router = APIRouter(tags=["Crypto"])


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


@router.get("/latest-price")
async def get_latest_prices():
    try:
        prices = []

        cursor = live_prices_collection.find({}, {"_id": 0})

        async for document in cursor:
            prices.append(document)

            if (
                document.get("coin") == "bitcoin"
                and document.get("price", 0) > BITCOIN_ALERT_PRICE
            ):
                await alerts_collection.insert_one({
                    "coin": "bitcoin",
                    "message": f"Bitcoin price crossed {BITCOIN_ALERT_PRICE} USD",
                    "price": document.get("price"),
                    "timestamp": document.get("timestamp")
                })

        logger.info("Latest prices fetched successfully")

        return {
            "count": len(prices),
            "data": prices
        }

    except Exception as e:
        logger.error(f"Latest price fetch failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching latest prices: {str(e)}"
        )


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
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching history: {str(e)}"
        )


@router.get("/alerts")
async def get_alerts():
    try:
        alerts = []

        cursor = alerts_collection.find({}, {"_id": 0})

        async for document in cursor:
            alerts.append(document)

        logger.info("Alerts fetched successfully")

        return {
            "count": len(alerts),
            "data": alerts
        }

    except Exception as e:
        logger.error(f"Alerts fetch failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching alerts: {str(e)}"
        )


@router.get("/analytics")
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
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating analytics: {str(e)}"
        )
    