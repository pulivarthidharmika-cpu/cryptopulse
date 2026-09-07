# Import datetime utilities
# Used for JWT token expiration
from datetime import datetime, timedelta

# Import JWT tools
from jose import JWTError, jwt

# Import password hashing library
from passlib.context import CryptContext

# Import FastAPI tools
from fastapi import Depends, HTTPException

# Import OAuth2 Password Bearer Authentication
from fastapi.security import OAuth2PasswordBearer

# Import JWT configuration
from config.settings import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)


# --------------------------------------------------
# Password Hashing Configuration
# bcrypt is used to hash passwords securely
# --------------------------------------------------
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# --------------------------------------------------
# OAuth2 Password Bearer Authentication
#
# Swagger will use /auth/login to obtain the token.
#
# Swagger sends:
# username = user's email
# password = user's password
#
# Protected APIs receive:
# Authorization: Bearer <token>
# --------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# --------------------------------------------------
# Hash Password
# Converts plain password into hashed password
# --------------------------------------------------
def hash_password(password: str):

    return pwd_context.hash(password)


# --------------------------------------------------
# Verify Password
# Checks if entered password matches stored hash
# --------------------------------------------------
def verify_password(
    plain_password: str,
    hashed_password: str
):

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# --------------------------------------------------
# Create JWT Access Token
# Generates token after successful login
# --------------------------------------------------
def create_access_token(data: dict):

    # Create copy of token payload
    to_encode = data.copy()

    # Set token expiry time
    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # Add expiry to token payload
    to_encode.update({
        "exp": expire
    })

    # Generate JWT token
    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# --------------------------------------------------
# Get Current User
# Extracts email and role from JWT token
# Used by protected APIs
# --------------------------------------------------
def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    try:

        # Decode JWT token
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # Extract email from token
        email = payload.get("sub")

        # Extract role from token
        role = payload.get("role")

        # Check token validity
        if email is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        # Return user information
        return {
            "email": email,
            "role": role
        }

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


# --------------------------------------------------
# Admin Authorization
# Allows access only to Admin users
# --------------------------------------------------
def get_admin_user(
    current_user: dict = Depends(get_current_user)
):

    # Check user role
    if current_user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    # Return current admin user
    return current_user