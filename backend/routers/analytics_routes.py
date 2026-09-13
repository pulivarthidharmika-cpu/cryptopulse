# Import APIRouter to create separate route files
# Import HTTPException to return proper error responses
from fastapi import APIRouter, HTTPException

# Import MongoDB collections
from database.database import historical_prices_collection, live_prices_collection

# Import logger to store success/error logs
from utils.logger import logger

# Import supported coins list from settings.py
from config.settings import SUPPORTED_COINS

# Python standard libraries
import statistics
from datetime import datetime


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

def calculate_gainers_and_losers(records):
    """
    Calculate top gaining and losing coins
    from the latest historical price records.
    """

    market_data = []

    for coin in SUPPORTED_COINS:

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

        records = []

        cursor = historical_prices_collection.find(
            {},
            {"_id": 0}
        ).sort("timestamp", 1)

        async for document in cursor:
            records.append(document)

        # Calculate top gainers and top losers
        # using the same historical records loaded above.
        gainers_and_losers = calculate_gainers_and_losers(
            records
        )

        analytics = {}

        latest_summary = []

        for coin in SUPPORTED_COINS:

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
    limit: int = 500
):

    try:

        coin = coin.strip().lower()

        # ------------------------------------------
        # Validate coin
        # ------------------------------------------

        if coin not in SUPPORTED_COINS:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported coin '{coin}'. "
                    f"Supported coins: "
                    f"{', '.join(SUPPORTED_COINS)}"
                )
            )

        # ------------------------------------------
        # Protect the API from extremely large
        # responses
        # ------------------------------------------

        limit = max(
            1,
            min(limit, 1000)
        )

        # ------------------------------------------
        # Fetch historical prices for selected coin
        # ------------------------------------------

        cursor = historical_prices_collection.find(
            {
                "coin": coin
            },
            {
                "_id": 0,
                "coin": 1,
                "price": 1,
                "timestamp": 1
            }
        ).sort(
            "timestamp",
            1
        )

        records = []

        async for document in cursor:

            price = document.get("price")
            timestamp = document.get("timestamp")

            if price is None or timestamp is None:
                continue

            try:

                price = float(price)

                # ----------------------------------
                # Convert timestamp into datetime
                # ----------------------------------

                if isinstance(
                    timestamp,
                    datetime
                ):

                    dt = timestamp

                else:

                    timestamp_text = str(
                        timestamp
                    )

                    # Handle ISO timestamps ending
                    # with Z
                    if timestamp_text.endswith("Z"):
                        timestamp_text = (
                            timestamp_text[:-1]
                            + "+00:00"
                        )

                    dt = datetime.fromisoformat(
                        timestamp_text
                    )

                records.append({
                    "datetime": dt,
                    "price": price
                })

            except Exception:

                logger.warning(
                    f"Invalid historical record "
                    f"ignored for {coin}"
                )

        # ------------------------------------------
        # No records
        # ------------------------------------------

        if not records:

            return {
                "status": "success",
                "coin": coin,
                "interval": "1m",
                "data": []
            }

        # ------------------------------------------
        # Build 1-minute candles
        # ------------------------------------------

        candles = {}

        for record in records:

            dt = record["datetime"]
            price = record["price"]

            # Remove seconds/microseconds so all
            # prices in the same minute belong to
            # one candle.
            candle_time = dt.replace(
                second=0,
                microsecond=0
            )

            key = candle_time.isoformat()

            if key not in candles:

                candles[key] = {

                    "timestamp":
                        int(
                            candle_time.timestamp()
                            * 1000
                        ),

                    "open": price,

                    "high": price,

                    "low": price,

                    "close": price
                }

            else:

                candle = candles[key]

                # Open remains the first price.

                candle["high"] = max(
                    candle["high"],
                    price
                )

                candle["low"] = min(
                    candle["low"],
                    price
                )

                # Close becomes the newest price.
                candle["close"] = price

        # ------------------------------------------
        # Convert dictionary to sorted list
        # ------------------------------------------

        ohlc_data = list(
            candles.values()
        )

        ohlc_data.sort(
            key=lambda x:
                x["timestamp"]
        )

        # ------------------------------------------
        # Return only the latest requested candles
        # ------------------------------------------

        ohlc_data = ohlc_data[-limit:]

        logger.info(
            f"Generated {len(ohlc_data)} "
            f"1-minute OHLC candles for {coin}"
        )

        return {

            "status": "success",

            "coin": coin,

            "interval": "1m",

            "count":
                len(ohlc_data),

            "data":
                ohlc_data
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
        symbols_map = {
            "bitcoin": "BTC",
            "ethereum": "ETH",
            "solana": "SOL",
        }

        # Fetch latest prices for supported coins
        cursor = live_prices_collection.find(
            {"coin": {"$in": SUPPORTED_COINS}},
            {"_id": 0}
        )

        live_data = {}
        async for doc in cursor:
            live_data[doc.get("coin")] = doc

        items = []
        total_market_cap = 0.0
        total_volume = 0.0

        for coin in SUPPORTED_COINS:
            doc = live_data.get(coin, {})
            price = float(doc.get("price") or 0.0)
            market_cap = float(doc.get("market_cap") or 0.0)
            volume = float(doc.get("volume") or 0.0)
            change = float(doc.get("change_24h") or 0.0)

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
                "symbol": symbols_map.get(coin, coin.upper()[:4]),
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
        cursor = live_prices_collection.find(
            {"coin": {"$in": SUPPORTED_COINS}},
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

        for coin in SUPPORTED_COINS:
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
        cursor = live_prices_collection.find(
            {"coin": {"$in": SUPPORTED_COINS}},
            {"_id": 0}
        )

        live_data = {}
        async for doc in cursor:
            live_data[doc.get("coin")] = doc

        hist_cursor = historical_prices_collection.find(
            {"coin": {"$in": SUPPORTED_COINS}},
            {"_id": 0, "coin": 1, "volume": 1, "timestamp": 1}
        ).sort("timestamp", -1).limit(150)

        hist_records = []
        async for doc in hist_cursor:
            hist_records.append(doc)

        coin_volumes = {}
        total_volume = 0.0

        for coin in SUPPORTED_COINS:
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
async def get_comparative_analytics(limit: int = 60):
    try:
        limit = max(5, min(limit, 300))
        performance = {}
        time_series_by_coin = {}

        for coin in SUPPORTED_COINS:
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
            default="bitcoin"
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
            for coin in SUPPORTED_COINS:
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