from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.settings import ADMIN_USERNAME, ADMIN_PASSWORD

# Authentication Router
router = APIRouter(prefix="/auth", tags=["Auth"])


# Login Request Model
class LoginRequest(BaseModel):
    username: str
    password: str


# User Login API
@router.post("/login")
async def login(user: LoginRequest):

    # Check Admin Credentials
    if user.username == ADMIN_USERNAME and user.password == ADMIN_PASSWORD:
        return {
            "status": "success",
            "role": "admin",
            "message": "Admin login successful"
        }

    # Check User Credentials
    if user.username == "user" and user.password == "user123":
        return {
            "status": "success",
            "role": "user",
            "message": "User login successful"
        }

    # Invalid Login Attempt
    raise HTTPException(
        status_code=401,
        detail="Invalid username or password"
    )

