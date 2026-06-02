from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://localhost:27017"

client = AsyncIOMotorClient(MONGO_URL)

db = client["cryptopulse_db"]

live_prices_collection = db["live_prices"]
historical_prices_collection = db["historical_prices"]
alerts_collection = db["alerts"]
