from fastapi import APIRouter
from pydantic import BaseModel
from config.settings import SUPPORTED_COINS

router = APIRouter(prefix="/admin", tags=["Admin"])


class CoinCreate(BaseModel):
    coin: str


@router.post("/add-coin")
async def add_coin(coin_data: CoinCreate):
    coin = coin_data.coin.lower()

    if coin in SUPPORTED_COINS:
        return {
            "status": "exists",
            "message": f"{coin} already exists"
        }

    SUPPORTED_COINS.append(coin)

    return {
        "status": "success",
        "message": f"{coin} added successfully",
        "coins": SUPPORTED_COINS
    }
