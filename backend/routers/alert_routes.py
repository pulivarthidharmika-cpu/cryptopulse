from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from database.database import alerts_collection
from utils.logger import logger

router = APIRouter(prefix="/alerts", tags=["Alerts"])


class AlertCreate(BaseModel):
    coin: str
    message: str
    price: float


@router.get("/")
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
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create")
async def create_alert(alert: AlertCreate):
    try:
        alert_data = {
            "coin": alert.coin,
            "message": alert.message,
            "price": alert.price,
            "timestamp": datetime.utcnow().isoformat()
        }

        await alerts_collection.insert_one(alert_data)

        logger.info("Alert created successfully")

        return {
            "status": "success",
            "message": "Alert created successfully",
            "data": alert_data
        }

    except Exception as e:
        logger.error(f"Alert creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    