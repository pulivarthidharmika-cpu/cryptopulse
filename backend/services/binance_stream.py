import asyncio
import json
from datetime import datetime, timezone

from config.settings import BINANCE_WS_URL

from kafka_service.producer import publish_price
from utils.logger import logger


# ============================================================
# BINANCE WEBSOCKET CONFIGURATION
# ============================================================

BINANCE_STREAM_URL = (
    f"{BINANCE_WS_URL}?"
    "streams=btcusdt@ticker/"
    "ethusdt@ticker/"
    "solusdt@ticker"
)


SYMBOL_TO_COIN = {
    "BTCUSDT": "bitcoin",
    "ETHUSDT": "ethereum",
    "SOLUSDT": "solana",
}


# ============================================================
# CONVERT BINANCE TICK TO CRYPTOPULSE FORMAT
# ============================================================

def build_price_record(data: dict):
    """
    Convert a Binance ticker event into the
    CryptoPulse unified price format.
    """

    symbol = data.get("s", "").upper()

    coin = SYMBOL_TO_COIN.get(symbol)

    if not coin:
        return None

    try:
        price = float(data.get("c", 0))
        volume = float(data.get("q", 0))
        change_24h = float(data.get("P", 0))
    except (TypeError, ValueError):
        return None

    if price <= 0:
        return None

    event_time = data.get("E")

    if event_time:
        timestamp = datetime.fromtimestamp(
            event_time / 1000,
            tz=timezone.utc
        ).isoformat()
    else:
        timestamp = datetime.now(
            timezone.utc
        ).isoformat()

    return {
        "coin": coin,
        "price": price,
        "volume": volume,
        "change_24h": change_24h,
        "currency": "usd",
        "timestamp": timestamp,

        "sources": {
            "binance": True,
            "coingecko": False,
            "cryptocompare": False,
        },

        "binance_symbol": symbol,
    }


# ============================================================
# BINANCE REAL-TIME STREAM
# ============================================================

async def run_binance_stream():
    """
    Connect to Binance WebSocket and continuously
    publish real-time market ticks to Kafka.
    """

    logger.info(
        "Binance WebSocket stream starting..."
    )

    while True:

        try:

            async with websockets.connect(
                BINANCE_STREAM_URL,
                ping_interval=20,
                ping_timeout=20,
            ) as websocket:

                logger.info(
                    "Binance WebSocket connected successfully"
                )

                while True:

                    message = await websocket.recv()

                    payload = json.loads(message)

                    # Combined stream format:
                    # {
                    #   "stream": "...",
                    #   "data": {...}
                    # }

                    data = payload.get(
                        "data",
                        payload
                    )

                    price_record = build_price_record(
                        data
                    )

                    if not price_record:
                        continue

                    logger.info(
                        f"Live Binance tick: "
                        f"{price_record['coin']} = "
                        f"{price_record['price']}"
                    )

                    # Send the real-time tick through
                    # the existing Kafka Producer.
                    publish_price(
                        price_record
                    )

        except asyncio.CancelledError:

            logger.info(
                "Binance WebSocket stream cancelled"
            )

            raise

        except Exception as e:

            logger.warning(
                f"Binance WebSocket connection error: "
                f"{str(e)}"
            )

            logger.info(
                "Reconnecting to Binance WebSocket "
                "in 5 seconds..."
            )

            await asyncio.sleep(5)


# ============================================================
# RUN DIRECTLY
# ============================================================

if __name__ == "__main__":

    asyncio.run(
        run_binance_stream()
    )