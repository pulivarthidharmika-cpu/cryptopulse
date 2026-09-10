from dotenv import load_dotenv
import os
from pathlib import Path


# ==================================================
# PROJECT BASE DIRECTORY
# ==================================================

BASE_DIR = Path(__file__).resolve().parent.parent

ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)


# ==================================================
# MONGODB CONFIGURATION
# ==================================================

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://localhost:27017"
)

DATABASE_NAME = os.getenv(
    "DATABASE_NAME",
    "cryptopulse_db"
)


# ==================================================
# MONGODB COLLECTIONS
# ==================================================

LIVE_PRICES_COLLECTION = os.getenv(
    "LIVE_PRICES_COLLECTION",
    "live_prices"
)

HISTORICAL_PRICES_COLLECTION = os.getenv(
    "HISTORICAL_PRICES_COLLECTION",
    "historical_prices"
)

ALERTS_COLLECTION = os.getenv(
    "ALERTS_COLLECTION",
    "alerts"
)

USERS_COLLECTION = os.getenv(
    "USERS_COLLECTION",
    "users"
)

COINS_COLLECTION = os.getenv(
    "COINS_COLLECTION",
    "coins"
)


# ==================================================
# KAFKA CONFIGURATION
# ==================================================

KAFKA_BOOTSTRAP_SERVERS = os.getenv(
    "KAFKA_BOOTSTRAP_SERVERS",
    "localhost:9092"
)


# --------------------------------------------------
# Existing topic
#
# Kept temporarily so existing code does not break
# while we migrate to the required topic structure.
# --------------------------------------------------

KAFKA_TOPIC = os.getenv(
    "KAFKA_TOPIC",
    "crypto-prices"
)


# --------------------------------------------------
# Required Kafka topics from project requirements
# --------------------------------------------------

BTC_PRICE_TOPIC = os.getenv(
    "BTC_PRICE_TOPIC",
    "btc-price"
)

MARKET_ALERTS_TOPIC = os.getenv(
    "MARKET_ALERTS_TOPIC",
    "market-alerts"
)

TRADE_VOLUME_TOPIC = os.getenv(
    "TRADE_VOLUME_TOPIC",
    "trade-volume"
)


# ==================================================
# CRYPTOCURRENCY CONFIGURATION
# ==================================================

SUPPORTED_COINS = [
    coin.strip().lower()
    for coin in os.getenv(
        "SUPPORTED_COINS",
        "bitcoin,ethereum,solana"
    ).split(",")
    if coin.strip()
]


CURRENCY = os.getenv(
    "CURRENCY",
    "usd"
).lower()


# ==================================================
# EXTERNAL API CONFIGURATION
# ==================================================

# --------------------------------------------------
# CoinGecko
# --------------------------------------------------

COINGECKO_API_URL = os.getenv(
    "COINGECKO_API_URL",
    "https://api.coingecko.com/api/v3"
)


# --------------------------------------------------
# Binance
# --------------------------------------------------

BINANCE_API_URL = os.getenv(
    "BINANCE_API_URL",
    "https://api.binance.com/api/v3"
)


# --------------------------------------------------
# CryptoCompare
# --------------------------------------------------

CRYPTOCOMPARE_API_URL = os.getenv(
    "CRYPTOCOMPARE_API_URL",
    "https://min-api.cryptocompare.com/data"
)


# ==================================================
# MARKET DATA CONFIGURATION
# ==================================================

# External API polling interval.
#
# We will NOT blindly call external APIs every second.
# The streaming layer will provide real-time updates
# to the frontend.
# ==================================================

MARKET_DATA_INTERVAL_SECONDS = float(
    os.getenv(
        "MARKET_DATA_INTERVAL_SECONDS",
        "30"
    )
)


# ==================================================
# ADMIN CONFIGURATION
# ==================================================

ADMIN_EMAIL = os.getenv(
    "ADMIN_EMAIL",
    "dharmika@cryptopulse.com"
)

ADMIN_PASSWORD = os.getenv(
    "ADMIN_PASSWORD",
    "Admin@123"
)


# ==================================================
# ALERT CONFIGURATION
# ==================================================

BITCOIN_ALERT_PRICE = float(
    os.getenv(
        "BITCOIN_ALERT_PRICE",
        "70000"
    )
)


# ==================================================
# JWT CONFIGURATION
# ==================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "cryptopulse_secret_key_2026"
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "30"
    )
)