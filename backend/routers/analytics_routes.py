# Import APIRouter to create separate route files
# Import HTTPException to return proper error responses
from fastapi import APIRouter, HTTPException

# Import MongoDB historical prices collection
from database.database import historical_prices_collection

# Import logger to store success/error logs
from utils.logger import logger

# Import supported coins list from settings.py
from config.settings import SUPPORTED_COINS

# Import statistics module to calculate standard deviation
import statistics


# Create Analytics router
# prefix="/analytics" means all APIs in this file start with /analytics
# tags=["Analytics"] groups these APIs in Swagger UI
router = APIRouter(prefix="/analytics", tags=["Analytics"])


# --------------------------------------------------
# Calculate Simple Moving Average
# SMA is used to understand the average trend of prices
# Example: last 5 prices average
# --------------------------------------------------
def calculate_sma(prices, window=5):

    # If we do not have enough price values, return None
    if len(prices) < window:
        return None

    # Take the last 'window' number of prices and calculate average
    return round(
        sum(prices[-window:]) / window,
        2
    )


# --------------------------------------------------
# Calculate Percentage Change
# Compares the latest price with the previous price
# --------------------------------------------------
def calculate_percentage_change(prices):

    # Need at least 2 prices to compare
    if len(prices) < 2:
        return None

    # Previous price means second-last price
    previous_price = prices[-2]

    # Current price means latest price
    current_price = prices[-1]

    # Avoid division by zero error
    if previous_price == 0:
        return None

    # Formula:
    # ((current - previous) / previous) * 100
    return round(
        ((current_price - previous_price) / previous_price) * 100,
        2
    )


# --------------------------------------------------
# Calculate Volatility
# Volatility shows how much the price changes
# Higher volatility means price is changing more
# --------------------------------------------------
def calculate_volatility(prices):

    # Need at least 2 prices to calculate standard deviation
    if len(prices) < 2:
        return None

    # Standard deviation is used as volatility
    return round(
        statistics.stdev(prices),
        2
    )


# --------------------------------------------------
# Detect Sudden Price Spike
# If percentage change is greater than or equal to 5%
# then it is considered a sudden spike
# --------------------------------------------------
def detect_sudden_spike(percentage_change, threshold=5):

    # If percentage change is not available, return False
    if percentage_change is None:
        return False

    # Return True if change is greater than or equal to threshold
    return percentage_change >= threshold


# --------------------------------------------------
# Detect Price Drop
# If percentage change is less than or equal to -5%
# then it is considered a price drop
# --------------------------------------------------
def detect_price_drop(percentage_change, threshold=-5):

    # If percentage change is not available, return False
    if percentage_change is None:
        return False

    # Return True if change is less than or equal to threshold
    return percentage_change <= threshold


# --------------------------------------------------
# Detect Volume Spike
# Compares latest volume with average previous volume
# If latest volume is 2 times greater than average,
# it is considered a volume spike
# --------------------------------------------------
def detect_volume_spike(volumes, threshold=2):

    # Need at least 2 volume records
    if len(volumes) < 2:
        return False

    # Calculate average volume excluding latest volume
    average_volume = sum(volumes[:-1]) / len(volumes[:-1])

    # Latest volume
    latest_volume = volumes[-1]

    # Avoid division by zero or wrong comparison
    if average_volume == 0:
        return False

    # Return True if latest volume is greater than threshold
    return latest_volume >= average_volume * threshold


# --------------------------------------------------
# Analytics API
# URL: GET /analytics/
# This API calculates price, volume, and market cap analytics
# --------------------------------------------------
@router.get("/")
async def get_analytics():
    try:
        # Empty list to store historical records from MongoDB
        records = []

        # Fetch all historical price documents from MongoDB
        # {"_id": 0} removes MongoDB ObjectId from response
        # sort("timestamp", 1) sorts records from old to new
        cursor = historical_prices_collection.find(
            {},
            {"_id": 0}
        ).sort("timestamp", 1)

        # Loop through MongoDB cursor asynchronously
        async for document in cursor:
            records.append(document)

        # Dictionary to store analytics for each coin
        analytics = {}

        # List to store latest values for summary calculations
        latest_summary = []

        # Loop through every supported coin
        for coin in SUPPORTED_COINS:

            # Filter records that belong to the current coin
            coin_records = [
                item for item in records
                if item.get("coin") == coin
            ]

            # Extract only price values
            prices = [
                item["price"]
                for item in coin_records
                if "price" in item and item["price"] is not None
            ]

            # Extract only volume values
            volumes = [
                item["volume"]
                for item in coin_records
                if "volume" in item and item["volume"] is not None
            ]

            # Extract only market cap values
            market_caps = [
                item["market_cap"]
                for item in coin_records
                if "market_cap" in item and item["market_cap"] is not None
            ]

            # If price data exists, calculate analytics
            if prices:

                # Calculate latest percentage change
                percentage_change = calculate_percentage_change(prices)

                # Get latest price
                latest_price = prices[-1]

                # Get latest volume if available
                latest_volume = volumes[-1] if volumes else None

                # Get latest market cap if available
                latest_market_cap = market_caps[-1] if market_caps else None

                # Store analytics for current coin
                analytics[coin] = {
                    # Basic price analytics
                    "average_price": round(sum(prices) / len(prices), 2),
                    "maximum_price": max(prices),
                    "minimum_price": min(prices),
                    "latest_price": latest_price,
                    "total_records": len(prices),

                    # Trend analytics
                    "simple_moving_average_5": calculate_sma(prices, 5),
                    "simple_moving_average_10": calculate_sma(prices, 10),
                    "percentage_change": percentage_change,
                    "volatility": calculate_volatility(prices),

                    # Alert-style analytics
                    "sudden_spike_detected": detect_sudden_spike(
                        percentage_change
                    ),
                    "price_drop_detected": detect_price_drop(
                        percentage_change
                    ),

                    # Volume analytics
                    "average_volume": round(
                        sum(volumes) / len(volumes),
                        2
                    ) if volumes else None,
                    "latest_volume": latest_volume,
                    "highest_volume": max(volumes) if volumes else None,
                    "volume_spike_detected": detect_volume_spike(
                        volumes
                    ) if volumes else False,

                    # Market cap analytics
                    "average_market_cap": round(
                        sum(market_caps) / len(market_caps),
                        2
                    ) if market_caps else None,
                    "latest_market_cap": latest_market_cap,
                    "highest_market_cap": max(market_caps) if market_caps else None
                }

                # Add latest values to summary list
                latest_summary.append({
                    "coin": coin,
                    "latest_price": latest_price,
                    "latest_volume": latest_volume,
                    "latest_market_cap": latest_market_cap
                })

            # If no data is found for the coin
            else:
                analytics[coin] = {
                    "message": "No historical data found"
                }

        # Find coin with highest latest volume
        highest_volume_coin = max(
            latest_summary,
            key=lambda x: x["latest_volume"] or 0
        ) if latest_summary else None

        # Find coin with highest latest market cap
        highest_market_cap_coin = max(
            latest_summary,
            key=lambda x: x["latest_market_cap"] or 0
        ) if latest_summary else None

        # Calculate total market cap of all supported coins
        total_market_cap = round(
            sum(
                item["latest_market_cap"] or 0
                for item in latest_summary
            ),
            2
        )

        # Store success message in logs/app.log
        logger.info(
            "Advanced analytics with volume and market cap calculated successfully"
        )

        # Return final analytics response
        return {
            "status": "success",
            "summary": {
                "highest_volume_coin": highest_volume_coin,
                "highest_market_cap_coin": highest_market_cap_coin,
                "total_market_cap": total_market_cap
            },
            "analytics": analytics
        }

    # Handle any unexpected errors
    except Exception as e:

        # Store error message in logs/app.log
        logger.error(f"Analytics calculation failed: {str(e)}")

        # Return 500 error response
        raise HTTPException(status_code=500, detail=str(e))
    
    