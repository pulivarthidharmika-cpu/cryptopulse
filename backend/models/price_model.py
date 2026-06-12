from pydantic import BaseModel
from datetime import datetime


class PriceModel(BaseModel):
    coin: str
    price: float
    currency: str
    timestamp: datetime
    