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

STANDARD_COIN_META = {
    "bitcoin": {"name": "Bitcoin", "symbol": "BTC"},
    "ethereum": {"name": "Ethereum", "symbol": "ETH"},
    "solana": {"name": "Solana", "symbol": "SOL"},
}

CANONICAL_COIN_ALIASES = {
    "btc": "bitcoin",
    "bitcoin": "bitcoin",
    "eth": "ethereum",
    "ethereum": "ethereum",
    "sol": "solana",
    "solana": "solana",
}


# --------------------------------------------------
# Add New Cryptocurrency
# Only Admin users can add new coins
# --------------------------------------------------
@router.post("/coins")
@router.post("/add-coin")
async def add_coin(
    coin_data: CoinModel,
    current_user: dict = Depends(get_admin_user)
):

    try:
        raw_name = (coin_data.name or coin_data.coin or "").strip()
        raw_symbol = (coin_data.symbol or "").strip()

        if not raw_name and not raw_symbol:
            raise HTTPException(
                status_code=400,
                detail="Coin Name and Symbol are required"
            )

        name = raw_name if raw_name else raw_symbol.capitalize()
        symbol = raw_symbol.upper() if raw_symbol else raw_name[:4].upper()

        if len(name) < 2:
            raise HTTPException(
                status_code=400,
                detail="Coin name must be at least 2 characters"
            )

        if len(symbol) < 2:
            raise HTTPException(
                status_code=400,
                detail="Coin symbol must be at least 2 characters"
            )

        clean_slug = name.lower().replace(" ", "-")
        canonical_key = CANONICAL_COIN_ALIASES.get(
            clean_slug,
            CANONICAL_COIN_ALIASES.get(symbol.lower(), clean_slug)
        )

        # Check existing coin (case-insensitive across key, symbol, and name)
        existing_coin = await coins_collection.find_one({
            "$or": [
                {"coin": {"$regex": f"^{re.escape(canonical_key)}$", "$options": "i"}},
                {"coin": {"$regex": f"^{re.escape(clean_slug)}$", "$options": "i"}},
                {"symbol": {"$regex": f"^{re.escape(symbol)}$", "$options": "i"}},
                {"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}
            ]
        })

        if existing_coin:
            exist_key = existing_coin.get("coin", "").lower()
            std_meta = STANDARD_COIN_META.get(exist_key, {})
            exist_name = existing_coin.get("name") or std_meta.get("name") or exist_key.capitalize()
            exist_sym = existing_coin.get("symbol") or std_meta.get("symbol") or exist_key[:4].upper()
            raise HTTPException(
                status_code=400,
                detail=f"Cryptocurrency '{exist_name}' ({exist_sym}) already exists"
            )

        coin_document = {
            "coin": canonical_key,
            "name": name,
            "symbol": symbol,
            "active": True
        }

        await coins_collection.insert_one(coin_document)

        logger.info(
            f"Coin '{name}' ({symbol}) added by admin {current_user['email']}"
        )

        return {
            "status": "success",
            "message": f"Cryptocurrency '{name}' ({symbol}) added successfully",
            "coin": {
                "coin": canonical_key,
                "name": name,
                "symbol": symbol,
                "active": True,
                "status": "Active"
            },
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
        ).to_list(length=200)

        formatted_coins = []
        for c in coins:
            coin_key = c.get("coin", "").strip().lower()
            meta = STANDARD_COIN_META.get(coin_key, {})
            name = c.get("name") or meta.get("name") or coin_key.capitalize()
            symbol = c.get("symbol") or meta.get("symbol") or coin_key[:4].upper()
            active = c.get("active", True)
            formatted_coins.append({
                "coin": coin_key,
                "name": name,
                "symbol": symbol,
                "active": active,
                "status": "Active" if active else "Inactive"
            })

        logger.info(
            f"Coins fetched by {current_user['email']}"
        )

        return {
            "count": len(formatted_coins),
            "coins": formatted_coins
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
        clean_coin = coin.strip().lower()
        new_coin = (coin_data.name or coin_data.coin or "").strip().lower()

        result = await coins_collection.update_one(
            {
                "coin": clean_coin
            },
            {
                "$set": {
                    "coin": new_coin or clean_coin,
                    "name": coin_data.name or new_coin.capitalize(),
                    "symbol": (coin_data.symbol or "").upper()
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
@router.delete("/coins/{coin}")
@router.delete("/delete-coin/{coin}")
async def delete_coin(
    coin: str,
    current_user: dict = Depends(get_admin_user)
):

    try:
        clean_coin = coin.strip().lower()
        core_coins = ("bitcoin", "ethereum", "solana", "btc", "eth", "sol")

        if clean_coin in core_coins:
            raise HTTPException(
                status_code=400,
                detail=f"Core cryptocurrency '{coin}' cannot be deleted"
            )

        result = await coins_collection.delete_one({
            "$or": [
                {"coin": {"$regex": f"^{re.escape(clean_coin)}$", "$options": "i"}},
                {"symbol": {"$regex": f"^{re.escape(coin.strip())}$", "$options": "i"}},
                {"name": {"$regex": f"^{re.escape(coin.strip())}$", "$options": "i"}}
            ]
        })

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
            "message": f"Cryptocurrency '{coin}' deleted successfully",
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