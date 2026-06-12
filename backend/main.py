from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.price_routes import router as price_router
from routers.analytics_routes import router as analytics_router
from routers.alert_routes import router as alert_router
from routers.auth_routes import router as auth_router
from routers.admin_routes import router as admin_router

app = FastAPI(
    title="CryptoPulse API",
    description="Backend API for Live Crypto Monitoring",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# Register Routers
app.include_router(price_router)
app.include_router(analytics_router)
app.include_router(alert_router)
app.include_router(auth_router)
app.include_router(admin_router)

