from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import (
    MONGO_URI,
    DATABASE_NAME,
    LIVE_PRICES_COLLECTION,
    HISTORICAL_PRICES_COLLECTION,
    ALERTS_COLLECTION
)

client = AsyncIOMotorClient(MONGO_URI)

database = client[DATABASE_NAME]

live_prices_collection = database[LIVE_PRICES_COLLECTION]
historical_prices_collection = database[HISTORICAL_PRICES_COLLECTION]
alerts_collection = database[ALERTS_COLLECTION]
