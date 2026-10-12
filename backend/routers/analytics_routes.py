# Import APIRouter to create separate route files
# Import HTTPException to return proper error responses
from typing import Optional
from fastapi import APIRouter, HTTPException

# Import MongoDB collections
from database.database import (
    historical_prices_collection,
    live_prices_collection,
    coins_collection
)

# Import logger to store success/error logs
from utils.logger import logger

# Import supported coins list from settings.py
from config.settings import SUPPORTED_COINS

# Python standard libraries
import statistics
from datetime import datetime


async def get_active_coin_slugs() -> list[str]:
    """Retrieve active coin keys from MongoDB, falling back to static config."""
    try:
        db_coins = await coins_collection.find({"active": True}, {"_id": 0, "coin": 1}).to_list(length=100)
        if db_coins:
            slugs = [c["coin"].strip().lower() for c in db_coins if c.get("coin")]
            if slugs:
                return slugs
    except Exception as e:
        logger.warning(f"Error fetching active coins for analytics: {e}")
    return SUPPORTED_COINS


async def get_active_coin_details() -> dict[str, dict]:
    """Retrieve mapping of coin key to metadata dictionary."""
    meta = {}
    try:
        db_coins = await coins_collection.find({"active": True}, {"_id": 0}).to_list(length=100)
        for c in db_coins:
            k = c.get("coin", "").strip().lower()
            if k:
                meta[k] = c
    except Exception:
        pass
    for k in SUPPORTED_COINS:
        if k not in meta:
            meta[k] = {"coin": k, "name": k.capitalize(), "symbol": k[:4].upper(), "active": True}
    return meta



# --------------------------------------------------
# Create Analytics router
# prefix="/analytics" means all APIs in this file start with /analytics
# tags=["Analytics"] groups these APIs in Swagger UI
# --------------------------------------------------

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)


# ==================================================
# SIMPLE MOVING AVERAGE
# ==================================================

def calculate_sma(prices, window=5):

    if len(prices) < window:
        return None

    return round(
        sum(prices[-window:]) / window,
        2
    )


# ==================================================
# PERCENTAGE CHANGE
# ==================================================

def calculate_percentage_change(prices):

    if len(prices) < 2:
        return None

    previous_price = prices[-2]
    current_price = prices[-1]

    if previous_price == 0:
        return None

    return round(
        ((current_price - previous_price) / previous_price) * 100,
        2
    )


# ==================================================
# VOLATILITY
# ==================================================

def calculate_volatility(prices):

    if len(prices) < 2:
        return None

    return round(
        statistics.stdev(prices),
        2
    )


# ==================================================
# SUDDEN PRICE SPIKE
# ==================================================

def detect_sudden_spike(percentage_change, threshold=5):

    if percentage_change is None:
        return False

    return percentage_change >= threshold


# ==================================================
# PRICE DROP
# ==================================================

def detect_price_drop(percentage_change, threshold=-5):

    if percentage_change is None:
        return False

    return percentage_change <= threshold


# ==================================================
# VOLUME SPIKE
# ==================================================

def detect_volume_spike(volumes, threshold=2):

    if len(volumes) < 2:
        return False

    average_volume = sum(
        volumes[:-1]
    ) / len(volumes[:-1])

    latest_volume = volumes[-1]

    if average_volume == 0:
        return False

    return latest_volume >= average_volume * threshold


# ==================================================
# TOP GAINERS / TOP LOSERS
# ==================================================

def calculate_gainers_and_losers(records, coins=None):
    """
    Calculate top gaining and losing coins
    from the latest historical price records.
    """

    market_data = []
    target_coins = coins if coins is not None else SUPPORTED_COINS

    for coin in target_coins:

        coin_records = [
            item
            for item in records
            if item.get("coin") == coin
            and item.get("price") is not None
        ]

        if len(coin_records) < 2:
            continue

        previous_price = coin_records[-2]["price"]
        current_price = coin_records[-1]["price"]

        if previous_price == 0:
            continue

        change_percentage = (
            (current_price - previous_price)
            / previous_price
        ) * 100

        market_data.append({
            "coin": coin,
            "price": current_price,
            "change_percentage": round(
                change_percentage,
                2
            )
        })

    gainers = sorted(
        market_data,
        key=lambda item: item["change_percentage"],
        reverse=True
    )

    losers = sorted(
        market_data,
        key=lambda item: item["change_percentage"]
    )

    return {
        "gainers": gainers,
        "losers": losers
    }


# ==================================================
# MAIN ANALYTICS API
# GET /analytics/
# ==================================================

@router.get("/")
async def get_analytics():

    try:
        active_coins = await get_active_coin_slugs()

        # Fast bounded query using indexed (coin, timestamp)
        records = []
        for coin in active_coins:
            cursor = historical_prices_collection.find(
                {"coin": coin},
                {"_id": 0}
            ).sort("timestamp", -1).limit(60)

            coin_docs = []
            async for doc in cursor:
                coin_docs.append(doc)
            coin_docs.reverse()
            records.extend(coin_docs)

        # Calculate top gainers and top losers
        gainers_and_losers = calculate_gainers_and_losers(
            records, coins=active_coins
        )

        analytics = {}

        latest_summary = []

        for coin in active_coins:

            coin_records = [
                item
                for item in records
                if item.get("coin") == coin
            ]

            prices = [
                item["price"]
                for item in coin_records
                if "price" in item
                and item["price"] is not None
            ]

            volumes = [
                item["volume"]
                for item in coin_records
                if "volume" in item
                and item["volume"] is not None
            ]

            market_caps = [
                item["market_cap"]
                for item in coin_records
                if "market_cap" in item
                and item["market_cap"] is not None
            ]

            if prices:

                percentage_change = (
                    calculate_percentage_change(prices)
                )

                latest_price = prices[-1]

                latest_volume = (
                    volumes[-1]
                    if volumes
                    else None
                )

                latest_market_cap = (
                    market_caps[-1]
                    if market_caps
                    else None
                )

                analytics[coin] = {

                    "average_price": round(
                        sum(prices) / len(prices),
                        2
                    ),

                    "maximum_price": max(prices),

                    "minimum_price": min(prices),

                    "latest_price": latest_price,

                    "total_records": len(prices),

                    "simple_moving_average_5":
                        calculate_sma(
                            prices,
                            5
                        ),

                    "simple_moving_average_10":
                        calculate_sma(
                            prices,
                            10
                        ),

                    "percentage_change":
                        percentage_change,

                    "volatility":
                        calculate_volatility(
                            prices
                        ),

                    "sudden_spike_detected":
                        detect_sudden_spike(
                            percentage_change
                        ),

                    "price_drop_detected":
                        detect_price_drop(
                            percentage_change
                        ),

                    "average_volume":
                        round(
                            sum(volumes) / len(volumes),
                            2
                        )
                        if volumes
                        else None,

                    "latest_volume":
                        latest_volume,

                    "highest_volume":
                        max(volumes)
                        if volumes
                        else None,

                    "volume_spike_detected":
                        detect_volume_spike(
                            volumes
                        )
                        if volumes
                        else False,

                    "average_market_cap":
                        round(
                            sum(market_caps) /
                            len(market_caps),
                            2
                        )
                        if market_caps
                        else None,

                    "latest_market_cap":
                        latest_market_cap,

                    "highest_market_cap":
                        max(market_caps)
                        if market_caps
                        else None
                }

                latest_summary.append({

                    "coin": coin,

                    "latest_price":
                        latest_price,

                    "latest_volume":
                        latest_volume,

                    "latest_market_cap":
                        latest_market_cap
                })

            else:

                analytics[coin] = {
                    "message":
                        "No historical data found"
                }

        highest_volume_coin = (
            max(
                latest_summary,
                key=lambda x:
                    x["latest_volume"] or 0
            )
            if latest_summary
            else None
        )

        highest_market_cap_coin = (
            max(
                latest_summary,
                key=lambda x:
                    x["latest_market_cap"] or 0
            )
            if latest_summary
            else None
        )

        total_market_cap = round(
            sum(
                item["latest_market_cap"] or 0
                for item in latest_summary
            ),
            2
        )

        logger.info(
            "Advanced analytics with volume and market cap "
            "calculated successfully"
        )

        return {

            "status": "success",

            "summary": {

                "highest_volume_coin":
                    highest_volume_coin,

                "highest_market_cap_coin":
                    highest_market_cap_coin,

                "total_market_cap":
                    total_market_cap
            },

            "analytics":
                analytics,

            "gainers_and_losers":
                gainers_and_losers
        }

    except Exception as e:

        logger.error(
            f"Analytics calculation failed: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# OHLC / CANDLESTICK DATA
# GET /analytics/ohlc/{coin}
#
# Creates 1-minute candles from historical prices.
#
# Open  = first price
# High  = maximum price
# Low   = minimum price
# Close = last price
# ==================================================

@router.get("/ohlc/{coin}")
async def get_ohlc(
    coin: str,
    limit: int = 500,
    interval: str = "1m"
):
    try:
        coin = coin.strip().lower()
        interval = interval.strip().lower()

        valid_intervals = ["1m", "5m", "15m", "1h"]
        if interval not in valid_intervals:
            interval = "1m"

        # ------------------------------------------
        # Validate coin
        # ------------------------------------------
        if coin not in SUPPORTED_COINS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported coin '{coin}'. "
                    f"Supported coins: {', '.join(SUPPORTED_COINS)}"
                )
            )

        limit = max(1, min(limit, 1000))

        # ------------------------------------------
        # Fetch historical prices for selected coin
        # ------------------------------------------
        cursor = historical_prices_collection.find(
            {"coin": coin},
            {"_id": 0, "coin": 1, "price": 1, "timestamp": 1}
        ).sort("timestamp", 1)

        records = []
        async for document in cursor:
            price = document.get("price")
            timestamp = document.get("timestamp")

            if price is None or timestamp is None:
                continue

            try:
                price = float(price)

                if isinstance(timestamp, datetime):
                    dt = timestamp
                else:
                    timestamp_text = str(timestamp)
                    if timestamp_text.endswith("Z"):
                        timestamp_text = timestamp_text[:-1] + "+00:00"
                    dt = datetime.fromisoformat(timestamp_text)

                records.append({
                    "datetime": dt,
                    "price": price
                })
            except Exception:
                pass

        if not records:
            return {
                "status": "success",
                "coin": coin,
                "interval": interval,
                "count": 0,
                "summary": {
                    "bullish_candles": 0,
                    "bearish_candles": 0,
                    "period_high": None,
                    "period_low": None,
                    "avg_body_size": 0.0,
                },
                "data": []
            }

        # ------------------------------------------
        # Build candles based on requested interval
        # ------------------------------------------
        candles = {}

        for record in records:
            dt = record["datetime"]
            price = record["price"]

            if interval == "5m":
                bucket_minute = (dt.minute // 5) * 5
                candle_time = dt.replace(minute=bucket_minute, second=0, microsecond=0)
            elif interval == "15m":
                bucket_minute = (dt.minute // 15) * 15
                candle_time = dt.replace(minute=bucket_minute, second=0, microsecond=0)
            elif interval == "1h":
                candle_time = dt.replace(minute=0, second=0, microsecond=0)
            else:
                # 1m default
                candle_time = dt.replace(second=0, microsecond=0)

            key = candle_time.isoformat()

            if key not in candles:
                candles[key] = {
                    "timestamp": int(candle_time.timestamp() * 1000),
                    "open": price,
                    "high": price,
                    "low": price,
                    "close": price
                }
            else:
                candle = candles[key]
                candle["high"] = max(candle["high"], price)
                candle["low"] = min(candle["low"], price)
                candle["close"] = price

        ohlc_data = list(candles.values())
        ohlc_data.sort(key=lambda x: x["timestamp"])
        ohlc_data = ohlc_data[-limit:]

        # ------------------------------------------
        # Calculate Technical Indicators (SMA-5, SMA-10)
        # & Candle Statistics
        # ------------------------------------------
        bullish_count = 0
        bearish_count = 0
        body_sizes = []

        for i, c in enumerate(ohlc_data):
            # Calculate Moving Averages on Close Prices
            slice5 = [x["close"] for x in ohlc_data[max(0, i - 4): i + 1]]
            c["sma5"] = round(sum(slice5) / len(slice5), 2)

            slice10 = [x["close"] for x in ohlc_data[max(0, i - 9): i + 1]]
            c["sma10"] = round(sum(slice10) / len(slice10), 2)

            if c["close"] >= c["open"]:
                bullish_count += 1
            else:
                bearish_count += 1

            body_sizes.append(abs(c["close"] - c["open"]))

        period_high = max((c["high"] for c in ohlc_data), default=None)
        period_low = min((c["low"] for c in ohlc_data), default=None)
        avg_body = (
            round(sum(body_sizes) / len(body_sizes), 2)
            if body_sizes
            else 0.0
        )

        logger.info(
            f"Generated {len(ohlc_data)} {interval} OHLC candles for {coin}"
        )

        return {
            "status": "success",
            "coin": coin,
            "interval": interval,
            "count": len(ohlc_data),
            "summary": {
                "bullish_candles": bullish_count,
                "bearish_candles": bearish_count,
                "period_high": period_high,
                "period_low": period_low,
                "avg_body_size": avg_body,
            },
            "data": ohlc_data
        }

    except HTTPException:
        raise

    except Exception as e:

        logger.error(
            f"OHLC calculation failed for "
            f"{coin}: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# MARKET HEATMAP DATA
# GET /analytics/heatmap
#
# Generates relative market cap sizing, 24h percentage
# changes, visual heat colors, and intensity ratings.
# ==================================================

@router.get("/heatmap")
async def get_heatmap():
    try:
        meta = await get_active_coin_details()
        active_coins = list(meta.keys())

        # Fetch latest prices for active coins
        cursor = live_prices_collection.find(
            {"coin": {"$in": active_coins}},
            {"_id": 0}
        )

        live_data = {}
        async for doc in cursor:
            live_data[doc.get("coin")] = doc

        items = []
        total_market_cap = 0.0
        total_volume = 0.0

        for coin in active_coins:
            doc = live_data.get(coin, {})
            c_meta = meta.get(coin, {})
            price = float(doc.get("price") or 0.0)
            market_cap = float(doc.get("market_cap") or 0.0)
            volume = float(doc.get("volume") or 0.0)
            change = float(doc.get("change_24h") or 0.0)
            symbol = c_meta.get("symbol") or coin[:4].upper()

            total_market_cap += market_cap
            total_volume += volume

            # Determine heat color based on percentage change
            if change >= 5.0:
                heat_color = "#15803d"  # dark green
            elif change >= 2.0:
                heat_color = "#22c55e"  # green
            elif change > 0.0:
                heat_color = "#86efac"  # light green
            elif change == 0.0:
                heat_color = "#94a3b8"  # slate / neutral
            elif change >= -2.0:
                heat_color = "#fca5a5"  # light red
            elif change >= -5.0:
                heat_color = "#ef4444"  # red
            else:
                heat_color = "#b91c1c"  # dark red

            sentiment = (
                "bullish" if change > 0 else ("bearish" if change < 0 else "neutral")
            )

            items.append({
                "coin": coin,
                "symbol": symbol,
                "price": price,
                "change_24h": round(change, 2),
                "market_cap": market_cap,
                "volume_24h": volume,
                "sentiment": sentiment,
                "heat_color": heat_color,
                "intensity": min(max(round(abs(change) / 5.0, 2), 0.1), 1.0)
            })

        # Calculate market cap percentage share for tile sizing
        for item in items:
            item["market_cap_share"] = (
                round((item["market_cap"] / total_market_cap) * 100, 2)
                if total_market_cap > 0
                else round(100.0 / len(items), 2)
            )

        # Sort items by market cap share descending
        items.sort(key=lambda x: x["market_cap"], reverse=True)

        top_performer = max(items, key=lambda x: x["change_24h"]) if items else None
        worst_performer = min(items, key=lambda x: x["change_24h"]) if items else None

        logger.info("Cryptocurrency heatmap generated successfully")

        return {
            "status": "success",
            "total_market_cap": round(total_market_cap, 2),
            "total_volume": round(total_volume, 2),
            "dominant_coin": items[0]["coin"] if items else None,
            "top_performer": top_performer,
            "worst_performer": worst_performer,
            "count": len(items),
            "data": items
        }

    except Exception as e:
        logger.error(f"Heatmap generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================================================
# MARKET INTELLIGENCE DATA
# GET /analytics/intelligence
#
# Generates BTC/ETH dominance, sentiment score,
# volume momentum, and volatility regime.
# ==================================================

@router.get("/intelligence")
async def get_market_intelligence():
    try:
        active_coins = await get_active_coin_slugs()
        cursor = live_prices_collection.find(
            {"coin": {"$in": active_coins}},
            {"_id": 0}
        )

        live_data = {}
        async for doc in cursor:
            live_data[doc.get("coin")] = doc

        total_market_cap = 0.0
        btc_market_cap = 0.0
        eth_market_cap = 0.0
        total_volume = 0.0
        changes = []

        for coin in active_coins:
            doc = live_data.get(coin, {})
            mcap = float(doc.get("market_cap") or 0.0)
            vol = float(doc.get("volume") or 0.0)
            chg = float(doc.get("change_24h") or 0.0)

            total_market_cap += mcap
            total_volume += vol
            changes.append(chg)

            if coin == "bitcoin":
                btc_market_cap = mcap
            elif coin == "ethereum":
                eth_market_cap = mcap

        btc_dominance = (
            round((btc_market_cap / total_market_cap) * 100, 2)
            if total_market_cap > 0
            else 0.0
        )
        eth_dominance = (
            round((eth_market_cap / total_market_cap) * 100, 2)
            if total_market_cap > 0
            else 0.0
        )
        alt_dominance = max(
            round(100.0 - btc_dominance - eth_dominance, 2), 0.0
        )

        avg_change = sum(changes) / len(changes) if changes else 0.0

        # Calculate dynamic Sentiment Index (0 - 100)
        base_score = 50 + (avg_change * 5.0)
        sentiment_score = int(min(max(round(base_score), 5), 95))

        if sentiment_score >= 75:
            sentiment_label = "Extreme Greed"
            sentiment_color = "#15803d"
        elif sentiment_score >= 58:
            sentiment_label = "Greed"
            sentiment_color = "#22c55e"
        elif sentiment_score >= 45:
            sentiment_label = "Neutral"
            sentiment_color = "#f59e0b"
        elif sentiment_score >= 25:
            sentiment_label = "Fear"
            sentiment_color = "#f97316"
        else:
            sentiment_label = "Extreme Fear"
            sentiment_color = "#dc2626"

        # Market breadth (gainers vs losers)
        advancing = sum(1 for c in changes if c > 0)
        declining = sum(1 for c in changes if c < 0)

        # Volatility assessment
        stdev = statistics.stdev(changes) if len(changes) > 1 else 0.0
        if stdev > 3.0:
            volatility_regime = "High Volatility"
        elif stdev > 1.0:
            volatility_regime = "Moderate Volatility"
        else:
            volatility_regime = "Low Volatility"

        logger.info("Market intelligence metrics calculated successfully")

        return {
            "status": "success",
            "dominance": {
                "bitcoin": btc_dominance,
                "ethereum": eth_dominance,
                "altcoins": alt_dominance
            },
            "sentiment": {
                "score": sentiment_score,
                "label": sentiment_label,
                "color": sentiment_color
            },
            "market_breadth": {
                "advancing": advancing,
                "declining": declining,
                "neutral": len(changes) - advancing - declining
            },
            "volatility_regime": volatility_regime,
            "average_24h_change": round(avg_change, 2),
            "total_market_cap": round(total_market_cap, 2),
            "total_volume": round(total_volume, 2)
        }

    except Exception as e:
        logger.error(f"Market intelligence calculation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================================================
# TRADING VOLUME ANALYTICS
# GET /analytics/volume
#
# Generates cross-asset volume distribution,
# volume-to-market-cap ratio, and volume spike detection.
# ==================================================

@router.get("/volume")
async def get_volume_analytics():
    try:
        active_coins = await get_active_coin_slugs()
        cursor = live_prices_collection.find(
            {"coin": {"$in": active_coins}},
            {"_id": 0}
        )

        live_data = {}
        async for doc in cursor:
            live_data[doc.get("coin")] = doc

        hist_cursor = historical_prices_collection.find(
            {"coin": {"$in": active_coins}},
            {"_id": 0, "coin": 1, "volume": 1, "timestamp": 1}
        ).sort("timestamp", -1).limit(150)

        hist_records = []
        async for doc in hist_cursor:
            hist_records.append(doc)

        coin_volumes = {}
        total_volume = 0.0

        for coin in active_coins:
            live_doc = live_data.get(coin, {})
            vol = float(live_doc.get("volume") or 0.0)
            mcap = float(live_doc.get("market_cap") or 0.0)

            total_volume += vol

            recent_vols = [
                float(h["volume"])
                for h in hist_records
                if h.get("coin") == coin and h.get("volume") is not None
            ]

            avg_vol = (
                round(sum(recent_vols) / len(recent_vols), 2)
                if recent_vols
                else vol
            )

            vol_ratio = (
                round((vol / mcap) * 100, 3)
                if mcap > 0
                else 0.0
            )

            is_spike = vol >= (avg_vol * 1.5) if avg_vol > 0 else False

            coin_volumes[coin] = {
                "coin": coin,
                "latest_volume": vol,
                "average_volume": avg_vol,
                "volume_to_market_cap_pct": vol_ratio,
                "volume_spike": is_spike,
                "liquidity_rating": (
                    "High Liquidity" if vol_ratio > 1.0 else
                    ("Moderate Liquidity" if vol_ratio > 0.3 else "Low Liquidity")
                )
            }

        volume_breakdown = []
        for coin, details in coin_volumes.items():
            share = (
                round((details["latest_volume"] / total_volume) * 100, 2)
                if total_volume > 0
                else 33.33
            )
            details["volume_share"] = share
            volume_breakdown.append(details)

        volume_breakdown.sort(key=lambda x: x["latest_volume"], reverse=True)

        volume_leader = volume_breakdown[0]["coin"] if volume_breakdown else None

        logger.info("Volume analytics calculated successfully")

        return {
            "status": "success",
            "total_volume": round(total_volume, 2),
            "volume_leader": volume_leader,
            "coins": volume_breakdown
        }

    except Exception as e:
        logger.error(f"Volume analytics calculation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================================================
# COMPARATIVE HISTORICAL PERFORMANCE
# GET /analytics/comparative
#
# Computes cross-asset normalized % return trends,
# relative volatility, and performance ranking.
# ==================================================

@router.get("/comparative")
async def get_comparative_analytics(limit: int = 60, coins: Optional[str] = None):
    try:
        limit = max(5, min(limit, 300))
        if coins:
            target_coins = [c.strip().lower() for c in coins.split(",") if c.strip()]
        else:
            target_coins = await get_active_coin_slugs()

        performance = {}
        time_series_by_coin = {}

        for coin in target_coins:
            cursor = historical_prices_collection.find(
                {"coin": coin},
                {"_id": 0, "price": 1, "timestamp": 1, "volume": 1}
            ).sort("timestamp", -1).limit(limit)

            docs = []
            async for doc in cursor:
                if doc.get("price") is not None:
                    docs.append(doc)
            docs.reverse()
            time_series_by_coin[coin] = docs

            if docs:
                prices = [float(d["price"]) for d in docs]
                start_p = prices[0]
                end_p = prices[-1]
                ret_pct = (
                    round(((end_p - start_p) / start_p) * 100, 2)
                    if start_p > 0
                    else 0.0
                )
                vol = calculate_volatility(prices)
                performance[coin] = {
                    "coin": coin,
                    "start_price": start_p,
                    "latest_price": end_p,
                    "period_return_pct": ret_pct,
                    "highest_price": max(prices),
                    "lowest_price": min(prices),
                    "volatility": vol,
                    "data_points": len(prices),
                }
            else:
                performance[coin] = {
                    "coin": coin,
                    "start_price": None,
                    "latest_price": None,
                    "period_return_pct": 0.0,
                    "highest_price": None,
                    "lowest_price": None,
                    "volatility": 0.0,
                    "data_points": 0,
                }

        max_len = max(
            (len(docs) for docs in time_series_by_coin.values()),
            default=0
        )

        base_prices = {
            coin: docs[0]["price"] if docs and float(docs[0]["price"]) > 0 else None
            for coin, docs in time_series_by_coin.items()
        }

        primary_coin = max(
            time_series_by_coin.keys(),
            key=lambda c: len(time_series_by_coin[c]),
            default=target_coins[0] if target_coins else "bitcoin"
        )
        primary_docs = time_series_by_coin.get(primary_coin, [])

        normalized_series = []
        for idx, p_doc in enumerate(primary_docs):
            ts = p_doc.get("timestamp")
            time_str = str(ts)[11:19] if ts else f"T{idx}"
            point = {
                "index": idx,
                "timestamp": ts,
                "time": time_str,
            }
            for coin in target_coins:
                docs = time_series_by_coin.get(coin, [])
                if idx < len(docs) and base_prices.get(coin):
                    curr_price = float(docs[idx]["price"])
                    base = float(base_prices[coin])
                    pct_change = round(((curr_price - base) / base) * 100, 2)
                    point[coin] = pct_change
                    point[f"{coin}_price"] = curr_price
                else:
                    point[coin] = 0.0
            normalized_series.append(point)

        ranked = sorted(
            performance.values(),
            key=lambda x: x["period_return_pct"],
            reverse=True
        )

        logger.info("Comparative analytics generated successfully")

        return {
            "status": "success",
            "timeframe_points": max_len,
            "best_performer": ranked[0]["coin"] if ranked else None,
            "performance": performance,
            "ranked": ranked,
            "normalized_series": normalized_series,
        }

    except Exception as e:
        logger.error(f"Comparative analytics failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def normalize_timestamp_val(val) -> tuple[datetime, str]:
    """Helper to convert datetime or string timestamp to (datetime_obj, canonical_iso_str)."""
    if isinstance(val, datetime):
        return val, val.isoformat()
    if isinstance(val, str):
        cleaned = val.strip().replace("Z", "")
        try:
            return datetime.fromisoformat(cleaned), cleaned
        except Exception:
            pass
        for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
            try:
                dt = datetime.strptime(cleaned, fmt)
                return dt, dt.isoformat()
            except Exception:
                pass
        try:
            dt = datetime.utcfromtimestamp(float(cleaned))
            return dt, dt.isoformat()
        except Exception:
            pass
    elif isinstance(val, (int, float)):
        try:
            dt = datetime.utcfromtimestamp(float(val))
            return dt, dt.isoformat()
        except Exception:
            pass
    now = datetime.utcnow()
    return now, now.isoformat()


# ==================================================
# DEDICATED MULTI-COIN COMPARISON API
# GET /analytics/comparison
# ==================================================

@router.get("/comparison")
async def get_comparison_data(
    coins: str,
    timeframe: str = "24h",
    limit: int = 60
):
    """
    Dedicated multi-coin comparison endpoint.
    - Requires 2 to 5 coins (comma-separated slugs).
    - Returns real-time metrics (current price, 24h change, 24h volume, market cap)
      and historical normalized % change series aligned on shared time period.
    - Gracefully handles missing metrics as None/Unavailable.
    """
    try:
        requested = [c.strip().lower() for c in coins.split(",") if c.strip()]
        unique_coins = list(dict.fromkeys(requested))

        if len(unique_coins) < 2:
            raise HTTPException(
                status_code=400,
                detail="Please select at least 2 cryptocurrencies to compare."
            )
        if len(unique_coins) > 5:
            raise HTTPException(
                status_code=400,
                detail="A maximum of 5 cryptocurrencies can be compared simultaneously."
            )

        limit = max(10, min(limit, 200))
        meta_map = await get_active_coin_details()

        # Fetch latest live market data for each selected coin
        live_cursor = live_prices_collection.find(
            {"coin": {"$in": unique_coins}},
            {"_id": 0}
        )
        live_by_coin = {}
        async for doc in live_cursor:
            live_by_coin[doc.get("coin")] = doc

        # Fetch historical series for each coin
        series_by_coin = {}
        metrics_by_coin = []
        all_timestamps = {}

        for coin in unique_coins:
            meta = meta_map.get(coin, {"name": coin.capitalize(), "symbol": coin[:4].upper()})
            live_doc = live_by_coin.get(coin, {})

            cursor = historical_prices_collection.find(
                {"coin": coin},
                {"_id": 0, "price": 1, "timestamp": 1, "volume": 1}
            ).sort("timestamp", -1).limit(limit)

            docs = []
            async for d in cursor:
                if d.get("price") is not None and d.get("timestamp") is not None:
                    dt_val, iso_val = normalize_timestamp_val(d["timestamp"])
                    d["_canonical_ts"] = iso_val
                    docs.append(d)
                    all_timestamps[iso_val] = dt_val
            docs.reverse()
            series_by_coin[coin] = docs

            curr_price = live_doc.get("price")
            if curr_price is None and docs:
                curr_price = docs[-1].get("price")

            curr_change = live_doc.get("change_24h")
            curr_volume = live_doc.get("volume")
            curr_mcap = live_doc.get("market_cap")

            # Calculate period percentage return if historical prices exist
            period_return = None
            start_price = None
            if docs:
                start_price = float(docs[0]["price"])
                end_price = float(docs[-1]["price"])
                if start_price > 0:
                    period_return = round(((end_price - start_price) / start_price) * 100, 2)

            data_ts_raw = live_doc.get("timestamp") or (docs[-1].get("timestamp") if docs else None)
            data_ts_str = str(data_ts_raw) if data_ts_raw is not None else None

            metrics_by_coin.append({
                "coin": coin,
                "name": meta.get("name") or coin.capitalize(),
                "symbol": (meta.get("symbol") or coin[:4]).upper(),
                "current_price": float(curr_price) if curr_price is not None else None,
                "change_24h": float(curr_change) if curr_change is not None else None,
                "volume_24h": float(curr_volume) if curr_volume is not None else None,
                "market_cap": float(curr_mcap) if curr_mcap is not None else None,
                "period_return_pct": period_return,
                "start_price": start_price,
                "data_points": len(docs),
                "data_timestamp": data_ts_str,
            })

        # Build chronologically aligned normalized comparison series
        sorted_timestamps = sorted(all_timestamps.keys(), key=lambda k: all_timestamps[k])
        normalized_series = []

        base_prices = {}
        for coin, docs in series_by_coin.items():
            if docs and float(docs[0]["price"]) > 0:
                base_prices[coin] = float(docs[0]["price"])

        price_lookup = {
            coin: {d["_canonical_ts"]: float(d["price"]) for d in docs}
            for coin, docs in series_by_coin.items()
        }

        last_known = {coin: base_prices.get(coin) for coin in unique_coins}

        for ts in sorted_timestamps:
            dt_obj = all_timestamps[ts]
            point = {
                "timestamp": ts,
                "time": dt_obj.strftime("%H:%M:%S"),
            }
            for coin in unique_coins:
                if ts in price_lookup[coin]:
                    price = price_lookup[coin][ts]
                    last_known[coin] = price
                else:
                    price = last_known.get(coin)

                base = base_prices.get(coin)
                if price is not None and base and base > 0:
                    pct = round(((price - base) / base) * 100, 2)
                    point[coin] = pct
                    point[f"{coin}_pct"] = pct
                    point[f"{coin}_price"] = price
                else:
                    point[coin] = None
                    point[f"{coin}_pct"] = None
                    point[f"{coin}_price"] = None

            normalized_series.append(point)

        logger.info(f"Comparison data generated for {len(unique_coins)} coins")

        return {
            "status": "success",
            "timeframe": timeframe,
            "currency": "usd",
            "coins": unique_coins,
            "compared_coins": unique_coins,
            "metrics": metrics_by_coin,
            "normalized_series": normalized_series,
            "chart_series": normalized_series,
            "timeframe_limit": limit,
            "data_points": len(normalized_series),
            "generated_at": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Coin comparison endpoint failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))