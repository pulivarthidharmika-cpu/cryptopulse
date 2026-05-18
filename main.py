from fastapi import FastAPI
from pymongo import MongoClient

app = FastAPI()

client = MongoClient("mongodb://localhost:27017/")
db = client["crypto_db"]
collection = db["prices"]

@app.get("/")
def home():
    return {"message": "CryptoPulse Running"}

@app.get("/prices")
def get_prices():

    data = list(collection.find({}, {"_id": 0}))

    return data