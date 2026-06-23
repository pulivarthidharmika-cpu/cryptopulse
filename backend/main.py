# Import FastAPI framework
from fastapi import FastAPI

# Import CORS middleware to allow frontend-backend communication
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from routers.price_routes import router as price_router
from routers.analytics_routes import router as analytics_router
from routers.alert_routes import router as alert_router
from routers.auth_routes import router as auth_router
from routers.admin_routes import router as admin_router

# Import logger
from utils.logger import logger


# Create FastAPI application
app = FastAPI(
    title="CryptoPulse API",
    description="Backend API for Live Crypto Monitoring",
    version="1.0.0",
    contact={
        "name": "CryptoPulse Team"
    }
)


# ---------------------------------------------------
# CORS Configuration
# Allows frontend applications to access backend APIs
# ---------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],      # Allow GET, POST, PUT, DELETE, etc.
    allow_headers=["*"]       # Allow all headers
)


# ---------------------------------------------------
# Startup Event
# Runs automatically when FastAPI server starts
# ---------------------------------------------------
@app.on_event("startup")
async def startup_event():
    logger.info("CryptoPulse API Started")


# ---------------------------------------------------
# Home Endpoint
# Shows project information
# URL: /
# ---------------------------------------------------
@app.get("/")
async def home():
    return {
        "message": "CryptoPulse Running",
        "database": "cryptopulse_db",
        "collections": [
            "live_prices",
            "historical_prices",
            "alerts"
        ]
    }


# ---------------------------------------------------
# Health Check Endpoint
# Used to verify API status
# URL: /health
# ---------------------------------------------------
@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called")

    return {
        "status": "healthy",
        "message": "CryptoPulse API is running"
    }


# ---------------------------------------------------
# Register Routers
# Connect modular route files to FastAPI application
# ---------------------------------------------------

# Price APIs
app.include_router(price_router)

# Analytics APIs
app.include_router(analytics_router)

# Alert APIs
app.include_router(alert_router)

# Authentication APIs
app.include_router(auth_router)

# Admin APIs
app.include_router(admin_router)

