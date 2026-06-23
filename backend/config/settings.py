from dotenv import load_dotenv
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "cryptopulse_db")

LIVE_PRICES_COLLECTION = os.getenv("LIVE_PRICES_COLLECTION", "live_prices")
HISTORICAL_PRICES_COLLECTION = os.getenv("HISTORICAL_PRICES_COLLECTION", "historical_prices")
ALERTS_COLLECTION = os.getenv("ALERTS_COLLECTION", "alerts")

KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "crypto-prices")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

SUPPORTED_COINS = os.getenv(
    "SUPPORTED_COINS",
    "bitcoin,ethereum,solana"
).split(",")

CURRENCY = os.getenv("CURRENCY", "usd")

BITCOIN_ALERT_PRICE = float(
    os.getenv("BITCOIN_ALERT_PRICE", 70000)
)


SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "cryptopulse_secret_key_2026"
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)
)
