# Import MongoDB Async Client
from motor.motor_asyncio import AsyncIOMotorClient

# Import settings from config
from config.settings import (
    MONGO_URI,
    DATABASE_NAME,
    LIVE_PRICES_COLLECTION,
    HISTORICAL_PRICES_COLLECTION,
    ALERTS_COLLECTION
)


# --------------------------------------------------
# Create MongoDB Client
# Connects FastAPI application to MongoDB
# --------------------------------------------------
client = AsyncIOMotorClient(MONGO_URI)


# --------------------------------------------------
# Select Database
# Example: cryptopulse_db
# --------------------------------------------------
database = client[DATABASE_NAME]


# --------------------------------------------------
# Collections
# --------------------------------------------------

# Stores latest crypto prices
live_prices_collection = database[LIVE_PRICES_COLLECTION]

# Stores historical crypto prices
historical_prices_collection = database[HISTORICAL_PRICES_COLLECTION]

# Stores alerts
alerts_collection = database[ALERTS_COLLECTION]

# Stores registered users
users_collection = database["users"]

# Stores supported coins managed by admin
coins_collection = database["coins"]

