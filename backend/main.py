import sys
from pathlib import Path

# Ensure backend directory is in sys.path for relative imports
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import coins_collection, users_collection
from config.settings import SUPPORTED_COINS, ADMIN_EMAIL, ADMIN_PASSWORD
from services.auth_service import hash_password

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
    },
    swagger_ui_parameters={
        "persistAuthorization": True
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
    # Seed Supported Coins in MongoDB
    # ----------------------------------------------
    try:
        for coin in SUPPORTED_COINS:
            await coins_collection.update_one(
                {"coin": coin},
                {"$setOnInsert": {"coin": coin, "active": True}},
                upsert=True
            )
        logger.info("Default supported coins verified in MongoDB")
    except Exception as e:
        logger.warning(f"Could not seed default coins: {str(e)}")

    # ----------------------------------------------
    # Verify / Seed Admin User in MongoDB
    # ----------------------------------------------
    try:
        admin_email = ADMIN_EMAIL.strip().lower()
        existing_admin = await users_collection.find_one({"email": admin_email})
        if not existing_admin:
            await users_collection.insert_one({
                "name": "Dharmika",
                "email": admin_email,
                "hashed_password": hash_password(ADMIN_PASSWORD),
                "role": "admin"
            })
            logger.info(f"Default admin user initialized in MongoDB: {admin_email}")
        else:
            logger.info(f"Admin user verified in MongoDB: {admin_email}")
    except Exception as e:
        logger.warning(f"Could not verify admin user: {str(e)}")

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


# --------------------------------------------------
# Run with Uvicorn
# --------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)