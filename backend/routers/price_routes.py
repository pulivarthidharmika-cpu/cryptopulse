from typing import Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from database.database import live_prices_collection, historical_prices_collection, coins_collection
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
            msg = await websocket.receive_text()
            if msg in ("ping", '{"type":"ping"}', '{"type": "ping"}'):
                try:
                    await websocket.send_text('{"type":"pong"}')
                except Exception:
                    break

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
    try:
        db_coins = await coins_collection.find({"active": True}, {"_id": 0}).to_list(length=200)
        if db_coins:
            slugs = [c["coin"] for c in db_coins if c.get("coin")]
            return {
                "coins": slugs,
                "details": db_coins
            }
    except Exception as e:
        logger.warning(f"Failed to fetch active coins from database: {e}")

    return {
        "coins": SUPPORTED_COINS,
        "details": [{"coin": c, "name": c.capitalize(), "symbol": c[:4].upper(), "active": True} for c in SUPPORTED_COINS]
    }


# ============================================================
# LATEST PRICES
# ============================================================

@router.get("/latest")
async def get_latest_prices():
    try:
        active_coins = SUPPORTED_COINS
        try:
            db_coins = await coins_collection.find({"active": True}, {"_id": 0, "coin": 1}).to_list(length=200)
            if db_coins:
                active_coins = [c["coin"] for c in db_coins if c.get("coin")]
        except Exception:
            pass

        prices = []
        cursor = live_prices_collection.find(
            {"coin": {"$in": active_coins}},
            {"_id": 0}
        )

        async for document in cursor:
            price = float(document.get("price") or 0.0)
            if not document.get("high_24h") and price > 0:
                document["high_24h"] = round(price * 1.025, 2)
            if not document.get("low_24h") and price > 0:
                document["low_24h"] = round(price * 0.975, 2)
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
async def get_history(coin: Optional[str] = None, limit: int = 1000):
    """
    Fetch historical price records.
    Supports optional coin filter and limit (default 1000, max 5000)
    for fast indexed retrieval.
    """
    try:
        limit = max(10, min(limit, 5000))
        active_coins = SUPPORTED_COINS
        try:
            db_coins = await coins_collection.find({"active": True}, {"_id": 0, "coin": 1}).to_list(length=200)
            if db_coins:
                active_coins = [c["coin"] for c in db_coins if c.get("coin")]
        except Exception:
            pass

        history = []
        if coin:
            clean_coin = coin.strip().lower()
            cursor = historical_prices_collection.find(
                {"coin": clean_coin},
                {"_id": 0}
            ).sort("timestamp", -1).limit(limit)

            async for document in cursor:
                history.append(document)
            history.reverse()
        else:
            # Fetch recent records for each active coin to ensure balanced representation
            per_coin_limit = max(50, limit // len(active_coins)) if active_coins else 200
            for c in active_coins:
                cursor = historical_prices_collection.find(
                    {"coin": c},
                    {"_id": 0}
                ).sort("timestamp", -1).limit(per_coin_limit)

                coin_docs = []
                async for document in cursor:
                    coin_docs.append(document)
                coin_docs.reverse()
                history.extend(coin_docs)

        logger.info(f"Historical prices fetched successfully ({len(history)} records)")

        return {
            "count": len(history),
            "data": history
        }

    except Exception as e:
        logger.error(f"History fetch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))