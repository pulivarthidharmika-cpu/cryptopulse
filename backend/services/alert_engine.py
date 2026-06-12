import asyncio
from datetime import datetime
from database.database import alerts_collection, live_prices_collection


async def check_alerts():
    print("Alert Engine Started...")

    while True:
        try:
            active_alerts = await alerts_collection.find(
                {"status": "active"}
            ).to_list(length=None)

            latest_prices = await live_prices_collection.find().to_list(length=None)

            for alert in active_alerts:
                coin = alert.get("coin")
                target_price = float(alert.get("target_price"))
                condition = alert.get("condition")

                coin_price_data = None

                for price in latest_prices:
                    if price.get("coin") == coin or price.get("coin_id") == coin:
                        coin_price_data = price
                        break

                if not coin_price_data:
                    print(f"No price found for {coin}")
                    continue

                current_price = float(
                    coin_price_data.get("price")
                    or coin_price_data.get("current_price")
                )

                triggered = False

                if condition == "greater_than" and current_price >= target_price:
                    triggered = True
                elif condition == "less_than" and current_price <= target_price:
                    triggered = True

                if triggered:
                    await alerts_collection.update_one(
                        {"_id": alert["_id"]},
                        {
                            "$set": {
                                "status": "triggered",
                                "triggered_at": datetime.utcnow(),
                                "current_price": current_price,
                            }
                        },
                    )

                    print(f"Alert triggered for {coin}")

            await asyncio.sleep(10)

        except Exception as e:
            print("Alert Engine Error:", e)
            await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(check_alerts())
    

    