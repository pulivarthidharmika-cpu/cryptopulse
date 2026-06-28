# Import BaseModel to create request and response models
from pydantic import BaseModel, EmailStr, Field


# --------------------------------------------------
# User Signup Model
# Used when a new user registers
# --------------------------------------------------
class UserSignup(BaseModel):

    # User email (must be valid)
    email: EmailStr

    # Password must contain at least 8 characters
    password: str = Field(
        min_length=8,
        description="Password must contain at least 8 characters"
    )


# --------------------------------------------------
# Login Request Model
# Used when an existing user logs in
# --------------------------------------------------
class LoginRequest(BaseModel):

    # Registered email
    email: EmailStr

    # User password
    password: str = Field(
        min_length=8,
        description="Password must contain at least 8 characters"
    )


# --------------------------------------------------
# Forgot Password Request
# User submits their email
# --------------------------------------------------
class ForgotPasswordRequest(BaseModel):

    email: EmailStr


# --------------------------------------------------
# Reset Password Request
# Used after verifying the user
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
# Returned after successful login
# --------------------------------------------------
class TokenResponse(BaseModel):

    # JWT Access Token
    access_token: str

    # Token type
    token_type: str = "bearer"
    
    