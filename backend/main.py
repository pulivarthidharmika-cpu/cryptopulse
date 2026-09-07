import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.price_routes import router as price_router
from routers.analytics_routes import router as analytics_router
from routers.alert_routes import router as alert_router
from routers.auth_routes import router as auth_router
from routers.admin_routes import router as admin_router

from services.api_fetcher import fetch_and_publish_prices
from services.alert_engine import check_alerts
from kafka_service.consumer import consume_messages

from utils.logger import logger


# --------------------------------------------------
# FastAPI Application
# --------------------------------------------------

app = FastAPI(
    title="CryptoPulse API",
    description="Backend API for Live Crypto Monitoring",
    version="1.0.0",
    contact={
        "name": "CryptoPulse Team"
    }
)


# --------------------------------------------------
# CORS Configuration
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# --------------------------------------------------
# Background Tasks
# --------------------------------------------------

async def price_fetcher_loop():

    logger.info("Price Fetcher background task started")

    while True:

        try:

            await fetch_and_publish_prices()

        except Exception as e:

            logger.error(
                f"Price Fetcher error: {str(e)}"
            )

        await asyncio.sleep(30)


# --------------------------------------------------
# Startup Event
# --------------------------------------------------

@app.on_event("startup")
async def startup_event():

    logger.info("CryptoPulse API Started")

    # ----------------------------------------------
    # Start Price Fetcher
    # ----------------------------------------------

    asyncio.create_task(
        price_fetcher_loop()
    )

    # ----------------------------------------------
    # Start Kafka Consumer
    # ----------------------------------------------

    asyncio.create_task(
        consume_messages()
    )

    # ----------------------------------------------
    # Start Alert Engine
    # ----------------------------------------------

    asyncio.create_task(
        check_alerts()
    )

    logger.info(
        "Background services started successfully"
    )


# --------------------------------------------------
# Home Endpoint
# --------------------------------------------------

@app.get("/")
async def home():

    return {

        "message": "CryptoPulse Running",

        "database": "cryptopulse_db",

        "collections": [
            "live_prices",
            "historical_prices",
            "alerts"
        ]

    }


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/health")
async def health_check():

    logger.info(
        "Health check endpoint called"
    )

    return {

        "status": "healthy",

        "message": "CryptoPulse API is running"

    }


# --------------------------------------------------
# Register Routers
# --------------------------------------------------

app.include_router(
    price_router
)

app.include_router(
    analytics_router
)

app.include_router(
    alert_router
)

app.include_router(
    auth_router
)

app.include_router(
    admin_router
)