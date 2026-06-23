# Import required FastAPI classes
from fastapi import APIRouter, HTTPException

# Import BaseModel to create request body models
from pydantic import BaseModel

# Import datetime to store alert created/updated time
from datetime import datetime

# Import ObjectId to work with MongoDB document IDs
from bson import ObjectId

# Import alerts MongoDB collection
from database.database import alerts_collection

# Import logger to store logs in app.log
from utils.logger import logger


# Create Alerts router
router = APIRouter(prefix="/alerts", tags=["Alerts"])


# Request model for creating and updating alerts
class AlertCreate(BaseModel):
    coin: str
    message: str
    price: float


# Get all alerts
@router.get("/")
async def get_alerts():
    try:
        alerts = []

        # Fetch all alert documents from MongoDB
        cursor = alerts_collection.find({})

        # Loop through each document
        async for document in cursor:
            # Convert MongoDB ObjectId to string
            document["_id"] = str(document["_id"])

            # Add document to alerts list
            alerts.append(document)

        logger.info("Alerts fetched successfully")

        return {
            "count": len(alerts),
            "data": alerts
        }

    except Exception as e:
        logger.error(f"Alerts fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Create new alert
@router.post("/create")
async def create_alert(alert: AlertCreate):
    try:
        # Create alert document
        alert_data = {
            "coin": alert.coin.lower(),
            "message": alert.message,
            "price": alert.price,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Insert alert into MongoDB
        result = await alerts_collection.insert_one(alert_data)

        # Add generated MongoDB ID to response
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


# Update existing alert
@router.put("/{alert_id}")
async def update_alert(alert_id: str, alert: AlertCreate):
    try:
        # Check if alert_id is valid MongoDB ObjectId
        if not ObjectId.is_valid(alert_id):
            raise HTTPException(status_code=400, detail="Invalid alert ID")

        # Prepare updated alert data
        updated_data = {
            "coin": alert.coin.lower(),
            "message": alert.message,
            "price": alert.price,
            "updated_at": datetime.utcnow().isoformat()
        }

        # Update alert in MongoDB
        result = await alerts_collection.update_one(
            {"_id": ObjectId(alert_id)},
            {"$set": updated_data}
        )

        # If no document matched the ID
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")

        logger.info("Alert updated successfully")

        return {
            "status": "success",
            "message": "Alert updated successfully",
            "data": updated_data
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Alert update failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Delete alert
@router.delete("/{alert_id}")
async def delete_alert(alert_id: str):
    try:
        # Check if alert_id is valid MongoDB ObjectId
        if not ObjectId.is_valid(alert_id):
            raise HTTPException(status_code=400, detail="Invalid alert ID")

        # Delete alert from MongoDB
        result = await alerts_collection.delete_one(
            {"_id": ObjectId(alert_id)}
        )

        # If no alert was deleted
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Alert not found")

        logger.info("Alert deleted successfully")

        return {
            "status": "success",
            "message": "Alert deleted successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Alert delete failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    
    
    