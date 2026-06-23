# Import FastAPI Router and Dependency Injection
from fastapi import APIRouter, Depends

# Import Pydantic Model
from pydantic import BaseModel

# Import Coins Collection
from database.database import coins_collection

# Import Admin Authorization Dependency
from services.auth_service import get_admin_user


# --------------------------------------------------
# Admin Router
# All admin APIs will start with /admin
# --------------------------------------------------
router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# --------------------------------------------------
# Request Model
# Used for adding new cryptocurrency
# --------------------------------------------------
class CoinCreate(BaseModel):
    coin: str


# --------------------------------------------------
# Add New Cryptocurrency
# Only Admin can access this API
# --------------------------------------------------
@router.post("/add-coin")
async def add_coin(
    coin_data: CoinCreate,
    current_user: dict = Depends(get_admin_user)
):

    # Convert coin name to lowercase
    coin = coin_data.coin.lower()

    # Check if coin already exists
    existing_coin = await coins_collection.find_one(
        {"coin": coin}
    )

    if existing_coin:
        return {
            "status": "exists",
            "message": f"{coin} already exists"
        }

    # Create coin document
    coin_data_db = {
        "coin": coin,
        "active": True
    }

    # Insert into MongoDB
    await coins_collection.insert_one(coin_data_db)

    return {
        "status": "success",
        "message": f"{coin} added successfully",
        "added_by": current_user["email"]
    }


# --------------------------------------------------
# Get All Supported Coins
# --------------------------------------------------
@router.get("/coins")
async def get_coins(
    current_user: dict = Depends(get_admin_user)
):

    coins = await coins_collection.find(
        {},
        {"_id": 0}
    ).to_list(length=100)

    return {
        "count": len(coins),
        "coins": coins
    }


# --------------------------------------------------
# Delete Coin
# --------------------------------------------------
@router.delete("/delete-coin/{coin}")
async def delete_coin(
    coin: str,
    current_user: dict = Depends(get_admin_user)
):

    result = await coins_collection.delete_one(
        {"coin": coin.lower()}
    )

    if result.deleted_count == 0:
        return {
            "status": "not_found",
            "message": f"{coin} not found"
        }

    return {
        "status": "success",
        "message": f"{coin} deleted successfully",
        "deleted_by": current_user["email"]
    }

