from fastapi import APIRouter, HTTPException

# Import request and response models
from models.user_model import (
    UserSignup,
    LoginRequest,
    TokenResponse
)

# Import MongoDB users collection
from database.database import users_collection

# Import authentication helper functions
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token
)

# --------------------------------------------------
# Create Authentication Router
# All endpoints in this file will start with /auth
# Example:
# POST /auth/signup
# POST /auth/login
# --------------------------------------------------
router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


# --------------------------------------------------
# Signup API
# Registers a new user
# --------------------------------------------------
@router.post("/signup")
async def signup(user: UserSignup):

    # Check if a user with the same email already exists
    existing_user = await users_collection.find_one(
        {"email": user.email}
    )

    # If email already exists, stop registration
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    # Hash the user's password before storing it
    hashed_password = hash_password(user.password)

    # Create user document
    new_user = {
        "email": user.email,
        "hashed_password": hashed_password,
        "role": "user"      # Default role for every new user
    }

    # Insert the user into MongoDB
    await users_collection.insert_one(new_user)

    # Return success response
    return {
        "status": "success",
        "message": "User registered successfully"
    }


# --------------------------------------------------
# Login API
# Authenticates the user and returns a JWT token
# --------------------------------------------------
@router.post(
    "/login",
    response_model=TokenResponse
)
async def login(login_data: LoginRequest):

    # Search for the user using the email
    user = await users_collection.find_one(
        {"email": login_data.email}
    )

    # If user doesn't exist OR password is incorrect
    if not user or not verify_password(
        login_data.password,
        user["hashed_password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Generate JWT access token
    access_token = create_access_token(
        data={
            # Subject (user identifier)
            "sub": user["email"],

            # User role (used for authorization)
            "role": user.get("role", "user")
        }
    )

    # Return JWT token to the client
    # FastAPI validates this response using TokenResponse
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
