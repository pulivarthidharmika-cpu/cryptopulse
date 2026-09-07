from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm

from models.user_model import UserSignup, TokenResponse
from database.database import users_collection
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

    existing_user = await users_collection.find_one(
        {"email": user.email}
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    hashed_password = hash_password(user.password)

    new_user = {
        "email": user.email,
        "hashed_password": hashed_password,
        "role": "pending"
    }

    await users_collection.insert_one(new_user)

    return {
        "status": "success",
        "message": "User registered successfully. Waiting for role assignment."
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

    email = form_data.username
    password = form_data.password

    user = await users_collection.find_one(
        {"email": email}
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        password,
        user["hashed_password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    role = user.get("role")

    if role == "pending":
        raise HTTPException(
            status_code=403,
            detail="Your account is waiting for role assignment by an administrator."
        )

    if role not in ["user", "analyst", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Invalid user role."
        )

    access_token = create_access_token(
        data={
            "sub": user["email"],
            "role": role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }