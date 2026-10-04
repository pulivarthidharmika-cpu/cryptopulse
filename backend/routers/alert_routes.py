# Import required FastAPI classes
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect

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


# ============================================================
# REAL-TIME ALERT WEBSOCKET CONNECTION MANAGER
# ============================================================

class AlertWebSocketManager:

    def __init__(self):
        self.connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.append(websocket)
        logger.info(
            f"Alert WebSocket connected. "
            f"Active connections: {len(self.connections)}"
        )

    def disconnect(self, websocket: WebSocket):
        if websocket in self.connections:
            self.connections.remove(websocket)
        logger.info(
            f"Alert WebSocket disconnected. "
            f"Active connections: {len(self.connections)}"
        )

    async def broadcast(self, data: dict):
        disconnected = []
        for websocket in self.connections:
            try:
                await websocket.send_json(data)
            except Exception as e:
                logger.warning(
                    f"Alert WebSocket broadcast failed: {str(e)}"
                )
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(websocket)


alert_websocket_manager = AlertWebSocketManager()


# ============================================================
# ALERT WEBSOCKET ENDPOINT
# ============================================================

@router.websocket("/ws")
async def alert_websocket(websocket: WebSocket):
    await alert_websocket_manager.connect(websocket)

    try:
        while True:
            msg = await websocket.receive_text()
            if msg in ("ping", '{"type":"ping"}', '{"type": "ping"}'):
                try:
                    await websocket.send_text('{"type":"pong"}')
                except Exception:
                    break

    except WebSocketDisconnect:
        alert_websocket_manager.disconnect(websocket)

    except Exception as e:
        logger.warning(
            f"Alert WebSocket error: {str(e)}"
        )
        alert_websocket_manager.disconnect(websocket)


# --------------------------------------------------
# Get All Alerts
# Returns alerts created by the user (or all if admin)
# --------------------------------------------------
@router.get("/")
async def get_alerts(
    current_user: dict = Depends(get_current_user)
):
    try:
        import re
        alerts = []
        user_email = current_user.get("email", "").strip().lower()

        if current_user.get("role") == "admin":
            query = {}
        else:
            query = {
                "$or": [
                    {"user_email": {"$regex": f"^{re.escape(user_email)}$", "$options": "i"}},
                    {"user_id": {"$regex": f"^{re.escape(user_email)}$", "$options": "i"}}
                ]
            }

        cursor = alerts_collection.find(query).sort("_id", -1)

        async for document in cursor:
            document["_id"] = str(document["_id"])
            if isinstance(document.get("triggered_at"), datetime):
                document["triggered_at"] = document["triggered_at"].isoformat()
            if isinstance(document.get("created_at"), datetime):
                document["created_at"] = document["created_at"].isoformat()
            alerts.append(document)

        logger.info(
            f"Alerts fetched successfully for {current_user['email']} (count: {len(alerts)})"
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
        clean_coin = alert.coin.lower().strip()
        target_price = float(alert.target_price)
        condition = alert.condition

        from database.database import live_prices_collection
        from kafka_service.producer import publish_market_alert

        now = datetime.utcnow()
        now_iso = now.isoformat()

        # Check if condition is already satisfied by live market price
        live_doc = await live_prices_collection.find_one({"coin": clean_coin})
        current_price = float(live_doc.get("price")) if live_doc and live_doc.get("price") is not None else None

        triggered = False
        if current_price is not None:
            if condition == "above" and current_price >= target_price:
                triggered = True
            elif condition == "below" and current_price <= target_price:
                triggered = True

        status = "triggered" if triggered else "active"
        default_msg = f"Price Alert: {clean_coin.upper()} {condition} ${target_price:,.2f}"
        if triggered and current_price is not None:
            default_msg = f"Price Alert: {clean_coin.upper()} is now ${current_price:,.2f} ({condition} target ${target_price:,.2f})"

        alert_data = {
            "user_email": current_user["email"].strip().lower(),
            "coin": clean_coin,
            "target_price": target_price,
            "condition": condition,
            "status": status,
            "message": alert.message or default_msg,
            "created_at": now_iso
        }

        if triggered and current_price is not None:
            alert_data["triggered_at"] = now_iso
            alert_data["current_price"] = current_price

        # Insert into MongoDB
        result = await alerts_collection.insert_one(alert_data)
        alert_data["_id"] = str(result.inserted_id)

        # Broadcast if triggered
        if triggered and current_price is not None:
            alert_payload = {
                "alert_id": alert_data["_id"],
                "coin": clean_coin,
                "user_id": current_user["email"],
                "user_email": current_user["email"],
                "condition": condition,
                "target_price": target_price,
                "current_price": current_price,
                "status": "triggered",
                "triggered_at": now_iso,
                "message": alert_data["message"]
            }
            try:
                publish_market_alert(alert_payload)
            except Exception as pe:
                logger.warning(f"Kafka market alert publish failed: {pe}")
            try:
                await alert_websocket_manager.broadcast(alert_payload)
            except Exception as we:
                logger.warning(f"WebSocket alert broadcast failed: {we}")

        logger.info(
            f"Alert created successfully by {current_user['email']} (status: {status})"
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

        # Delete alert (allow admin to delete, or owner)
        filter_q = {"_id": ObjectId(alert_id)}
        if current_user.get("role") != "admin":
            filter_q["user_email"] = current_user["email"]

        result = await alerts_collection.delete_one(filter_q)

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
    