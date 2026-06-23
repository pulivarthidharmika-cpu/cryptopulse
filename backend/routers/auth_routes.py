from fastapi import APIRouter, HTTPException
from models.user_model import UserSignup, LoginRequest
from database.database import users_collection
from services.auth_service import hash_password, verify_password, create_access_token


# Create auth router
router = APIRouter(prefix="/auth", tags=["Auth"])


# --------------------------------------------------
# Signup API
# Creates a new user using email and password
# --------------------------------------------------
@router.post("/signup")
async def signup(user: UserSignup):

    # Check if email already exists
    existing_user = await users_collection.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    # Hash password before storing in database
    hashed_password = hash_password(user.password)

    # Store user in MongoDB
    new_user = {
        "email": user.email,
        "hashed_password": hashed_password,
        "role": "user"
    }

    await users_collection.insert_one(new_user)

    return {
        "status": "success",
        "message": "User registered successfully"
    }


# --------------------------------------------------
# Login API
# Checks email and password, then returns JWT token
# --------------------------------------------------
@router.post("/login")
async def login(login_data: LoginRequest):

    # Find user by email
    user = await users_collection.find_one({"email": login_data.email})

    # If user not found or password is wrong
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create JWT token
    access_token = create_access_token(
        data={
            "sub": user["email"],
            "role": user.get("role", "user")
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

    
    