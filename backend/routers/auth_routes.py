import re
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm

from models.user_model import UserSignup, TokenResponse
from database.database import users_collection
from config.settings import ADMIN_EMAIL
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token
)


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


# --------------------------------------------------
# Signup API
# --------------------------------------------------

@router.post("/signup")
async def signup(user: UserSignup):

    clean_email = user.email.strip().lower()
    clean_name = user.name.strip()

    existing_user = await users_collection.find_one(
        {"email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}}
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    hashed_password = hash_password(
        user.password
    )

    new_user = {
        "name": clean_name,
        "email": clean_email,
        "hashed_password": hashed_password,
        "role": "pending"
    }

    await users_collection.insert_one(new_user)

    return {
        "status": "success",
        "message": (
            "User registered successfully. "
            "Waiting for role assignment."
        )
    }


# --------------------------------------------------
# Login API
# --------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):

    clean_username = form_data.username.strip()
    password = form_data.password

    # Support 'admin' alias or email address
    if clean_username.lower() == "admin":
        lookup_email = ADMIN_EMAIL.strip().lower()
    else:
        lookup_email = clean_username.lower()

    user = await users_collection.find_one(
        {"email": {"$regex": f"^{re.escape(lookup_email)}$", "$options": "i"}}
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Verify password
    if not verify_password(
        password,
        user["hashed_password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Get role
    role = user.get("role")

    # Pending users cannot login
    if role == "pending":
        raise HTTPException(
            status_code=403,
            detail=(
                "Your account is waiting for role "
                "assignment by an administrator."
            ),
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Validate role
    if role not in [
        "user",
        "analyst",
        "admin"
    ]:
        raise HTTPException(
            status_code=403,
            detail="Invalid user role.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Create JWT token
    access_token = create_access_token(
        data={
            "sub": user["email"],
            "role": role,
            "name": user.get("name", "User")
        }
    )

    # Return token + user information
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "name": user.get("name", "User"),
        "role": role
    }