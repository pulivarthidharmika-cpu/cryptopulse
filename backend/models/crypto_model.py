from typing import Optional
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

    # Cryptocurrency identifier or name
    coin: Optional[str] = None
    name: Optional[str] = None
    symbol: Optional[str] = None
