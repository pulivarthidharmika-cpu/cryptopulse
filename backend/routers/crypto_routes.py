from fastapi import APIRouter
from database.database import (
    live_prices_collection,
    historical_prices_collection,
    alerts_collection
)

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "Backend is running successfully"}


@router.get("/coins")
async def get_coins():
    return {"coins": ["bitcoin", "ethereum", "solana"]}


@router.get("/latest-price")
async def get_latest_prices():
    prices = []

    cursor = live_prices_collection.find({}, {"_id": 0})

    async for document in cursor:
        prices.append(document)

    return {
        "count": len(prices),
        "data": prices
    }


@router.get("/history")
async def get_history():
    history = []

    cursor = historical_prices_collection.find({}, {"_id": 0})

    async for document in cursor:
        history.append(document)

    return {
        "count": len(history),
        "data": history
    }


@router.get("/alerts")
async def get_alerts():
    alerts = []

    cursor = alerts_collection.find({}, {"_id": 0})

    async for document in cursor:
        alerts.append(document)

    return {
        "count": len(alerts),
        "data": alerts
    }
