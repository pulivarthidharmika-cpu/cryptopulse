# Import BaseModel for creating models
from pydantic import BaseModel
from datetime import datetime


# --------------------------------------------------
# Cryptocurrency Price Model
# Used when storing live cryptocurrency prices
# --------------------------------------------------
class CryptoPrice(BaseModel):

    coin: str

    price: float

    currency: str

    timestamp: datetime


# --------------------------------------------------
# Cryptocurrency Model
# Used by Admin APIs
# --------------------------------------------------
class CoinModel(BaseModel):

    # Cryptocurrency name
    coin: str
