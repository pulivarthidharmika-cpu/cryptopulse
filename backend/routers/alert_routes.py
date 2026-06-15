from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId

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

        cursor = alerts_collection.find({})

        async for document in cursor:
            document["_id"] = str(document["_id"])
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

        result = await alerts_collection.insert_one(alert_data)

        alert_data["_id"] = str(result.inserted_id)

        logger.info("Alert created successfully")

        return {
            "status": "success",
            "message": "Alert created successfully",
            "data": alert_data
        }

    except Exception as e:
        logger.error(f"Alert creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{alert_id}")
async def update_alert(alert_id: str, alert: AlertCreate):
    try:
        updated_data = {
            "coin": alert.coin,
            "message": alert.message,
            "price": alert.price,
            "updated_at": datetime.utcnow().isoformat()
        }

        result = await alerts_collection.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": updated_data}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )

        logger.info("Alert updated successfully")

        return {
            "status": "success",
            "message": "Alert updated successfully",
            "data": updated_data
        }

    except Exception as e:
        logger.error(f"Alert update failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{alert_id}")
async def delete_alert(alert_id: str):
    try:
        result = await alerts_collection.delete_one(
            {"_id": ObjectId(alert_id)}
        )

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )

        logger.info("Alert deleted successfully")

        return {
            "status": "success",
            "message": "Alert deleted successfully"
        }

    except Exception as e:
        logger.error(f"Alert delete failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    