# Import BaseModel to create request and response models
from pydantic import BaseModel, EmailStr, Field


# --------------------------------------------------
# User Signup Model
# --------------------------------------------------

class UserSignup(BaseModel):

    # User's name
    name: str = Field(
        min_length=1,
        description="User's name"
    )

    # User email
    email: EmailStr

    # Password
    password: str = Field(
        min_length=8,
        description="Password must contain at least 8 characters"
    )


# --------------------------------------------------
# Login Request Model
# --------------------------------------------------

class LoginRequest(BaseModel):

    email: EmailStr

    password: str = Field(
        min_length=8,
        description="Password must contain at least 8 characters"
    )


# --------------------------------------------------
# Forgot Password Request
# --------------------------------------------------

class ForgotPasswordRequest(BaseModel):

    email: EmailStr


# --------------------------------------------------
# Reset Password Request
# --------------------------------------------------

class ResetPasswordRequest(BaseModel):

    new_password: str = Field(
        min_length=8,
        description="New password"
    )

    confirm_password: str = Field(
        min_length=8,
        description="Confirm password"
    )


# --------------------------------------------------
# JWT Token Response
# --------------------------------------------------

class TokenResponse(BaseModel):

    # JWT Access Token
    access_token: str

    # Token type
    token_type: str = "bearer"

    # User's name
    name: str

    # User's role
    role: str


# --------------------------------------------------
# Admin - User Response Model
# --------------------------------------------------

class UserResponse(BaseModel):

    name: str
    email: EmailStr
    role: str


# --------------------------------------------------
# Admin - Role Update Model
# --------------------------------------------------

class RoleUpdate(BaseModel):

    role: str = Field(
        description="User role: user, analyst, or admin"
    )