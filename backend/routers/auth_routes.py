from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config.settings import ADMIN_USERNAME, ADMIN_PASSWORD

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(user: LoginRequest):
    if user.username == ADMIN_USERNAME and user.password == ADMIN_PASSWORD:
        return {
            "status": "success",
            "role": "admin",
            "message": "Admin login successful"
        }

    if user.username == "user" and user.password == "user123":
        return {
            "status": "success",
            "role": "user",
            "message": "User login successful"
        }

    raise HTTPException(
        status_code=401,
        detail="Invalid username or password"
    )
