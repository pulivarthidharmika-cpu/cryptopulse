from fastapi import FastAPI
from pymongo import MongoClient

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient("mongodb://localhost:27017/")
db = client["cryptopulse_db"]
collection = db["crypto_prices"]

@app.get("/")
def home():
    return {"message": "CryptoPulse Running"}

@app.get("/prices")
def get_prices():
    data = list(collection.find({}, {"_id": 0}))
    return data

@app.get("/history")
def get_history():
    records = list(collection.find({}, {"_id": 0}))

    return records
