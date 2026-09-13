import asyncio
from datetime import datetime

from database.database import (
    alerts_collection,
    live_prices_collection
)

from kafka_service.producer import publish_market_alert
from utils.logger import logger


# --------------------------------------------------
# Check Active Alerts
# --------------------------------------------------

async def check_alerts():

    logger.info("Alert Engine Started")

    print("Alert Engine Started...")

    while True:

        try:

            # ------------------------------------------
            # Get active alerts
            # ------------------------------------------

            active_alerts = await alerts_collection.find(
                {"status": "active"}
            ).to_list(length=None)

            # ------------------------------------------
            # Get latest prices
            # ------------------------------------------

            latest_prices = await live_prices_collection.find(
                {},
                {"_id": 0}
            ).to_list(length=None)

            # ------------------------------------------
            # Check every alert
            # ------------------------------------------

            for alert in active_alerts:

                coin = alert.get("coin", "").lower()

                target_price = float(
                    alert.get("target_price", 0)
                )

                condition = alert.get("condition")

                # --------------------------------------
                # Find current price for the coin
                # --------------------------------------

                coin_price_data = next(
                    (
                        price
                        for price in latest_prices
                        if price.get("coin", "").lower() == coin
                    ),
                    None
                )

                if not coin_price_data:

                    logger.warning(
                        f"No live price found for {coin}"
                    )

                    continue

                # --------------------------------------
                # Get current price
                # --------------------------------------

                current_price = coin_price_data.get("price")

                if current_price is None:

                    logger.warning(
                        f"Price unavailable for {coin}"
                    )

                    continue

                current_price = float(current_price)

                # --------------------------------------
                # Check alert condition
                # --------------------------------------

                triggered = False

                if (
                    condition == "above"
                    and current_price >= target_price
                ):
                    triggered = True

                elif (
                    condition == "below"
                    and current_price <= target_price
                ):
                    triggered = True

                # --------------------------------------
                # Trigger alert
                # --------------------------------------

                if triggered:

                    now = datetime.utcnow()

                    await alerts_collection.update_one(

                        {
                            "_id": alert["_id"],
                            "status": "active"
                        },

                        {
                            "$set": {
                                "status": "triggered",
                                "triggered_at": now,
                                "current_price": current_price
                            }
                        }
                    )

                    logger.info(
                        f"Alert triggered for {coin} "
                        f"at {current_price}"
                    )

                    print(
                        f"Alert triggered for {coin} "
                        f"at {current_price}"
                    )

                    # ----------------------------------
                    # Publish triggered alert to Kafka
                    # Topic: market-alerts
                    # ----------------------------------

                    alert_payload = {
                        "alert_id": str(alert["_id"]),
                        "coin": coin,
                        "user_id": alert.get("user_id", "system"),
                        "condition": condition,
                        "target_price": target_price,
                        "current_price": current_price,
                        "status": "triggered",
                        "triggered_at": now.isoformat(),
                        "message": (
                            f"Price Alert: {coin.upper()} is now ${current_price:,.2f} "
                            f"({condition} target ${target_price:,.2f})"
                        )
                    }

                    try:
                        publish_market_alert(alert_payload)
                        logger.info(
                            f"Published triggered alert for {coin} to Kafka topic 'market-alerts'"
                        )
                    except Exception as pe:
                        logger.warning(
                            f"Failed to publish alert for {coin} to Kafka: {str(pe)}"
                        )

            # ------------------------------------------
            # Check again after 10 seconds
            # ------------------------------------------

            await asyncio.sleep(10)

        except Exception as e:

            logger.error(
                f"Alert Engine Error: {str(e)}"
            )

            print(
                f"Alert Engine Error: {e}"
            )

            await asyncio.sleep(10)


# --------------------------------------------------
# Run Directly
# --------------------------------------------------

if __name__ == "__main__":

    asyncio.run(check_alerts())