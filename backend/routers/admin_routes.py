from fastapi import APIRouter
from pydantic import BaseModel
from config.settings import SUPPORTED_COINS

# Admin Router
router = APIRouter(prefix="/admin", tags=["Admin"])


# Request Model for Adding New Coin
class CoinCreate(BaseModel):
    coin: str


# Add New Cryptocurrency
@router.post("/add-coin")
async def add_coin(coin_data: CoinCreate):

    # Convert Coin Name to Lowercase
    coin = coin_data.coin.lower()

    # Check if Coin Already Exists
    if coin in SUPPORTED_COINS:
        return {
            "status": "exists",
            "message": f"{coin} already exists"
        }

    # Add Coin to Supported Coins List
    SUPPORTED_COINS.append(coin)

    # Return Success Response
    return {
        "status": "success",
        "message": f"{coin} added successfully",
        "coins": SUPPORTED_COINS
    }
