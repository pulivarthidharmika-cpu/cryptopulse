# Import FastAPI Router, Dependency Injection and HTTP Exception
from fastapi import APIRouter, Depends, HTTPException

# Import MongoDB collection
from database.database import coins_collection

# Import Coin Model
from models.crypto_model import CoinModel

# Import Admin Authorization Dependency
from services.auth_service import get_admin_user

# Import Logger
from utils.logger import logger


# --------------------------------------------------
# Admin Router
# All Admin APIs start with /admin
# --------------------------------------------------
router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# --------------------------------------------------
# Add New Cryptocurrency
# Only Admin users can add new coins
# --------------------------------------------------
@router.post("/add-coin")
async def add_coin(
    coin_data: CoinModel,
    current_user: dict = Depends(get_admin_user)
):

    try:

        # Convert coin name to lowercase
        coin = coin_data.coin.lower()

        # Check whether coin already exists
        existing_coin = await coins_collection.find_one(
            {"coin": coin}
        )

        if existing_coin:

            raise HTTPException(
                status_code=400,
                detail=f"{coin} already exists"
            )

        # Create MongoDB document
        coin_document = {

            "coin": coin,

            # Indicates whether this coin is currently supported
            "active": True

        }

        # Insert into MongoDB
        await coins_collection.insert_one(
            coin_document
        )

        logger.info(
            f"{coin} added by admin {current_user['email']}"
        )

        return {

            "status": "success",
            "message": f"{coin} added successfully",
            "added_by": current_user["email"]

        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Coin creation failed : {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# Get All Supported Coins
# Only Admin can view all supported coins
# --------------------------------------------------
@router.get("/coins")
async def get_coins(
    current_user: dict = Depends(get_admin_user)
):

    try:

        coins = await coins_collection.find(
            {},
            {"_id": 0}
        ).to_list(length=100)

        logger.info(
            f"Coins fetched by {current_user['email']}"
        )

        return {

            "count": len(coins),
            "coins": coins

        }

    except Exception as e:

        logger.error(
            f"Fetching coins failed : {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# Update Existing Coin
# Only Admin can update a coin
# --------------------------------------------------
@router.put("/update-coin/{coin}")
async def update_coin(
    coin: str,
    coin_data: CoinModel,
    current_user: dict = Depends(get_admin_user)
):

    try:

        result = await coins_collection.update_one(

            {
                "coin": coin.lower()
            },

            {
                "$set": {

                    "coin": coin_data.coin.lower()

                }
            }

        )

        if result.matched_count == 0:

            raise HTTPException(
                status_code=404,
                detail="Coin not found"
            )

        logger.info(
            f"{coin} updated by {current_user['email']}"
        )

        return {

            "status": "success",
            "message": "Coin updated successfully"

        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Coin update failed : {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# Delete Coin
# Only Admin can delete a coin
# --------------------------------------------------
@router.delete("/delete-coin/{coin}")
async def delete_coin(
    coin: str,
    current_user: dict = Depends(get_admin_user)
):

    try:

        result = await coins_collection.delete_one(
            {
                "coin": coin.lower()
            }
        )

        if result.deleted_count == 0:

            raise HTTPException(
                status_code=404,
                detail="Coin not found"
            )

        logger.info(
            f"{coin} deleted by {current_user['email']}"
        )

        return {

            "status": "success",
            "message": f"{coin} deleted successfully",
            "deleted_by": current_user["email"]

        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Coin deletion failed : {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
