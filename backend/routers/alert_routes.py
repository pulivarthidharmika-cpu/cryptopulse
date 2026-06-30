# Import required FastAPI classes
from fastapi import APIRouter, HTTPException, Depends

# Import datetime to store timestamps
from datetime import datetime

# Import ObjectId to work with MongoDB IDs
from bson import ObjectId

# Import alerts MongoDB collection
from database.database import alerts_collection

# Import Alert model
from models.alert_model import AlertModel

# Import authentication dependency
from services.auth_service import get_current_user

# Import logger
from utils.logger import logger


# --------------------------------------------------
# Create Alerts Router
# All endpoints start with /alerts
# --------------------------------------------------
router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


# --------------------------------------------------
# Get All Alerts
# Returns only alerts created by the logged-in user
# --------------------------------------------------
@router.get("/")
async def get_alerts(
    current_user: dict = Depends(get_current_user)
):
    try:

        alerts = []

        # Fetch only the current user's alerts
        cursor = alerts_collection.find(
            {
                "user_email": current_user["email"]
            }
        )

        async for document in cursor:

            # Convert MongoDB ObjectId into string
            document["_id"] = str(document["_id"])

            alerts.append(document)

        logger.info(
            f"Alerts fetched successfully for {current_user['email']}"
        )

        return {
            "count": len(alerts),
            "data": alerts
        }

    except Exception as e:

        logger.error(
            f"Alerts fetch failed: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# Create New Alert
# Only authenticated users can create alerts
# --------------------------------------------------
@router.post("/create")
async def create_alert(
    alert: AlertModel,
    current_user: dict = Depends(get_current_user)
):
    try:

        # Create alert document
        alert_data = {

            # Logged-in user
            "user_email": current_user["email"],

            # Alert information
            "coin": alert.coin.lower(),
            "target_price": alert.target_price,
            "condition": alert.condition,
            "status": alert.status,
            "message": alert.message,

            # Timestamp
            "created_at": datetime.utcnow().isoformat()
        }

        # Insert into MongoDB
        result = await alerts_collection.insert_one(alert_data)

        # Add generated MongoDB ID
        alert_data["_id"] = str(result.inserted_id)

        logger.info(
            f"Alert created successfully by {current_user['email']}"
        )

        return {
            "status": "success",
            "message": "Alert created successfully",
            "data": alert_data
        }

    except Exception as e:

        logger.error(
            f"Alert creation failed: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# Update Alert
# User can update only their own alerts
# --------------------------------------------------
@router.put("/{alert_id}")
async def update_alert(
    alert_id: str,
    alert: AlertModel,
    current_user: dict = Depends(get_current_user)
):
    try:

        # Validate MongoDB ObjectId
        if not ObjectId.is_valid(alert_id):

            raise HTTPException(
                status_code=400,
                detail="Invalid alert ID"
            )

        updated_data = {

            "coin": alert.coin.lower(),
            "target_price": alert.target_price,
            "condition": alert.condition,
            "status": alert.status,
            "message": alert.message,
            "updated_at": datetime.utcnow().isoformat()

        }

        # Update only if alert belongs to current user
        result = await alerts_collection.update_one(

            {
                "_id": ObjectId(alert_id),
                "user_email": current_user["email"]
            },

            {
                "$set": updated_data
            }

        )

        if result.matched_count == 0:

            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )

        logger.info(
            f"Alert updated by {current_user['email']}"
        )

        return {

            "status": "success",
            "message": "Alert updated successfully",
            "data": updated_data

        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Alert update failed: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# Delete Alert
# User can delete only their own alerts
# --------------------------------------------------
@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:

        # Validate MongoDB ObjectId
        if not ObjectId.is_valid(alert_id):

            raise HTTPException(
                status_code=400,
                detail="Invalid alert ID"
            )

        # Delete only if alert belongs to current user
        result = await alerts_collection.delete_one(

            {
                "_id": ObjectId(alert_id),
                "user_email": current_user["email"]
            }

        )

        if result.deleted_count == 0:

            raise HTTPException(
                status_code=404,
                detail="Alert not found"
            )

        logger.info(
            f"Alert deleted by {current_user['email']}"
        )

        return {

            "status": "success",
            "message": "Alert deleted successfully"

        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Alert deletion failed: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    