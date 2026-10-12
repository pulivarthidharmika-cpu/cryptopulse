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


async def init_db_indexes():
    """
    Ensure essential MongoDB indexes exist for high-performance querying
    and unique constraints.
    """
    try:
        # High-frequency historical price queries by coin and timestamp
        await historical_prices_collection.create_index(
            [("coin", 1), ("timestamp", -1)],
            background=True
        )
        await historical_prices_collection.create_index(
            [("timestamp", -1)],
            background=True
        )

        # Unique constraint on coins to prevent duplicate additions
        await coins_collection.create_index(
            [("coin", 1)],
            unique=True,
            background=True
        )

        # Unique constraint on live prices per coin
        await live_prices_collection.create_index(
            [("coin", 1)],
            unique=True,
            background=True
        )

        # Unique constraint on user email
        await users_collection.create_index(
            [("email", 1)],
            unique=True,
            background=True
        )

        # Alerts index for fast evaluation
        await alerts_collection.create_index(
            [("status", 1), ("coin", 1)],
            background=True
        )
    except Exception as e:
        # Non-fatal during test/offline environments
        pass


