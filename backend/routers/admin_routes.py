# Import FastAPI Router, Dependency Injection and HTTP Exception
from fastapi import APIRouter, Depends, HTTPException

# Import Pydantic BaseModel
from pydantic import BaseModel

import re

# Import MongoDB collections
from database.database import coins_collection, users_collection

# Import Coin Model
from models.crypto_model import CoinModel

# Import Admin Authorization Dependency
from services.auth_service import get_admin_user

# Import Logger
from utils.logger import logger


# --------------------------------------------------
# Role Request Model
# Used when Admin assigns a role to a user
# --------------------------------------------------
class RoleUpdate(BaseModel):
    role: str


# --------------------------------------------------
# Admin Router
# All Admin APIs start with /admin
# --------------------------------------------------
router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# ==================================================
# USER / ROLE MANAGEMENT
# ==================================================


# --------------------------------------------------
# Get All Users
# Only Admin users can view users
# --------------------------------------------------
@router.get("/users")
async def get_users(
    current_user: dict = Depends(get_admin_user)
):

    try:

        users = await users_collection.find(
            {},
            {
                "_id": 0,
                "email": 1,
                "role": 1
            }
        ).to_list(length=1000)

        return {
            "count": len(users),
            "users": users
        }

    except Exception as e:

        logger.error(
            f"Fetching users failed: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch users"
        )


# --------------------------------------------------
# Assign / Update User Role
# Only Admin can perform this operation
# --------------------------------------------------
@router.put("/users/{email}/role")
async def update_user_role(
    email: str,
    role_data: RoleUpdate,
    current_user: dict = Depends(get_admin_user)
):

    try:

        # Clean the email received from the URL
        email = email.strip().lower()

        # Clean the role
        new_role = role_data.role.strip().lower()

        # Allowed roles
        allowed_roles = [
            "user",
            "analyst",
            "admin"
        ]

        # Validate role
        if new_role not in allowed_roles:
            raise HTTPException(
                status_code=400,
                detail="Role must be user, analyst, or admin"
            )

        # Find user using case-insensitive email matching
        user = await users_collection.find_one(
            {
                "email": {
                    "$regex": f"^{re.escape(email)}$",
                    "$options": "i"
                }
            }
        )

        # User does not exist
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Update role
        result = await users_collection.update_one(
            {
                "_id": user["_id"]
            },
            {
                "$set": {
                    "role": new_role
                }
            }
        )

        logger.info(
            f"Role of {email} changed to {new_role} "
            f"by admin {current_user['email']}"
        )

        return {
            "status": "success",
            "message": f"Role updated to '{new_role}'",
            "email": user["email"],
            "role": new_role,
            "updated_by": current_user["email"]
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"Role update failed: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to update user role"
        )

# ==================================================
# CRYPTOCURRENCY MANAGEMENT
# ==================================================


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

        coin = coin_data.coin.lower()

        existing_coin = await coins_collection.find_one(
            {"coin": coin}
        )

        if existing_coin:

            raise HTTPException(
                status_code=400,
                detail=f"{coin} already exists"
            )

        coin_document = {
            "coin": coin,
            "active": True
        }

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
            f"Coin creation failed: {str(e)}"
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
            f"Fetching coins failed: {str(e)}"
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
            f"Coin update failed: {str(e)}"
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
            f"Coin deletion failed: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )