from pydantic import BaseModel
from datetime import datetime


class CryptoPrice(BaseModel):
    coin: str
    price: float
    currency: str
    timestamp: datetime


class Alert(BaseModel):
    coin: str
    message: str
    created_at: datetime
    