from database import collection
import pandas as pd
import matplotlib.pyplot as plt

data = list(collection.find({}, {"_id": 0}))

records = []

for item in data:

    prices = item["prices"]

    records.append({
        "bitcoin": prices.get("bitcoin", {}).get("usd"),
        "ethereum": prices.get("ethereum", {}).get("usd"),
        "solana": prices.get("solana", {}).get("usd")
    })

df = pd.DataFrame(records)

plt.figure(figsize=(10, 5))

plt.plot(df["bitcoin"], label="Bitcoin")
plt.plot(df["ethereum"], label="Ethereum")
plt.plot(df["solana"], label="Solana")

plt.title("Crypto Price Trends")
plt.xlabel("Records")
plt.ylabel("Price in USD")

plt.legend()

plt.show()