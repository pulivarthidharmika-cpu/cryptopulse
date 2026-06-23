from pydantic import BaseModel, EmailStr


# Model for user signup request
# User only needs email and password
class UserSignup(BaseModel):
    email: EmailStr
    password: str


# Model for login request
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Model for token response
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    
    
    
    