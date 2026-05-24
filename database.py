from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")

db = client["cryptopulse_db"]

collection = db["crypto_prices"]

print("MongoDB Connected Successfully")