from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from database.database import live_prices_collection, historical_prices_collection
from utils.logger import logger
from config.settings import SUPPORTED_COINS

router = APIRouter(prefix="/prices", tags=["Prices"])


# ============================================================
# REAL-TIME WEBSOCKET CONNECTION MANAGER
# ============================================================

class PriceWebSocketManager:

    def __init__(self):
        self.connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.append(websocket)
        logger.info(
            f"Price WebSocket connected. "
            f"Active connections: {len(self.connections)}"
        )

    def disconnect(self, websocket: WebSocket):
        if websocket in self.connections:
            self.connections.remove(websocket)

        logger.info(
            f"Price WebSocket disconnected. "
            f"Active connections: {len(self.connections)}"
        )

    async def broadcast(self, data: dict):
        disconnected = []

        for websocket in self.connections:
            try:
                await websocket.send_json(data)
            except Exception as e:
                logger.warning(
                    f"Price WebSocket broadcast failed: {str(e)}"
                )
                disconnected.append(websocket)

        for websocket in disconnected:
            self.disconnect(websocket)


price_websocket_manager = PriceWebSocketManager()


# ============================================================
# PRICE WEBSOCKET
# ============================================================

@router.websocket("/ws")
async def price_websocket(websocket: WebSocket):
    await price_websocket_manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        price_websocket_manager.disconnect(websocket)

    except Exception as e:
        logger.warning(
            f"Price WebSocket error: {str(e)}"
        )
        price_websocket_manager.disconnect(websocket)


# ============================================================
# HEALTH
# ============================================================

@router.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {
        "status": "healthy",
        "message": "CryptoPulse Backend Running"
    }


# ============================================================
# COINS
# ============================================================

@router.get("/coins")
async def get_coins():
    logger.info("Coins endpoint called")
    return {
        "coins": SUPPORTED_COINS
    }


# ============================================================
# LATEST PRICES
# ============================================================

@router.get("/latest")
async def get_latest_prices():
    try:
        prices = []

        cursor = live_prices_collection.find(
            {"coin": {"$in": SUPPORTED_COINS}},
            {"_id": 0}
        )

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


# ============================================================
# HISTORICAL PRICES
# ============================================================

@router.get("/history")
async def get_history():
    try:
        history = []

        cursor = historical_prices_collection.find(
            {"coin": {"$in": SUPPORTED_COINS}},
            {"_id": 0}
        )

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