import time
from datetime import datetime, timezone
from fastapi import APIRouter
from database.database import (
    database,
    live_prices_collection,
    historical_prices_collection,
    alerts_collection,
    users_collection,
)
from kafka_service.producer import get_producer_status
from kafka_service.consumer import get_consumer_status
from services.binance_stream import get_stream_status
from routers.price_routes import price_websocket_manager
from routers.alert_routes import alert_websocket_manager
from config.settings import SUPPORTED_COINS, KAFKA_BOOTSTRAP_SERVERS
from utils.logger import logger

router = APIRouter(prefix="/health", tags=["Health"])

BOOT_TIME = datetime.now(timezone.utc).isoformat()
START_PERF = time.perf_counter()


@router.get("")
@router.get("/")
async def basic_health():
    """Quick liveness probe endpoint."""
    return {
        "status": "healthy",
        "service": "CryptoPulse API",
        "uptime_seconds": round(time.perf_counter() - START_PERF, 1),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/detailed")
async def detailed_health():
    """
    Comprehensive health check inspecting:
    - MongoDB ping & document counts
    - Kafka producer connectivity & dead-letter queue metrics
    - Kafka consumer state & topic subscriptions
    - Binance live WebSocket stream telemetry
    - Real-time client WebSocket connection counts
    """
    start = time.perf_counter()
    components = {}
    is_degraded = False

    # 1. MongoDB Check
    try:
        db_start = time.perf_counter()
        await database.command("ping")
        db_latency_ms = round((time.perf_counter() - db_start) * 1000, 2)

        live_count = await live_prices_collection.count_documents({})
        hist_count = await historical_prices_collection.count_documents({})
        alerts_count = await alerts_collection.count_documents({})
        users_count = await users_collection.count_documents({})

        components["mongodb"] = {
            "status": "healthy",
            "latency_ms": db_latency_ms,
            "counts": {
                "live_prices": live_count,
                "historical_prices": hist_count,
                "alerts": alerts_count,
                "users": users_count,
            },
        }
    except Exception as e:
        is_degraded = True
        components["mongodb"] = {
            "status": "unhealthy",
            "error": str(e),
        }

    # 2. Kafka Producer Check
    try:
        prod_status = get_producer_status()
        components["kafka_producer"] = prod_status
        if prod_status.get("status") != "connected":
            is_degraded = True
    except Exception as e:
        is_degraded = True
        components["kafka_producer"] = {
            "status": "error",
            "error": str(e),
        }

    # 3. Kafka Consumer Check
    try:
        cons_status = get_consumer_status()
        components["kafka_consumer"] = cons_status
    except Exception as e:
        components["kafka_consumer"] = {
            "status": "error",
            "error": str(e),
        }

    # 4. Binance WebSocket Stream Check
    try:
        binance_status = get_stream_status()
        components["binance_stream"] = binance_status
    except Exception as e:
        components["binance_stream"] = {
            "status": "error",
            "error": str(e),
        }

    # 5. Client WebSockets
    components["client_websockets"] = {
        "price_subscribers": len(getattr(price_websocket_manager, "connections", [])),
        "alert_subscribers": len(getattr(alert_websocket_manager, "connections", [])),
    }

    total_latency_ms = round((time.perf_counter() - start) * 1000, 2)

    overall_status = "degraded" if is_degraded else "healthy"

    return {
        "status": overall_status,
        "service": "CryptoPulse API",
        "boot_time": BOOT_TIME,
        "uptime_seconds": round(time.perf_counter() - START_PERF, 1),
        "latency_ms": total_latency_ms,
        "tracked_coins": SUPPORTED_COINS,
        "components": components,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
