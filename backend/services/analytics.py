from database import collection
import pandas as pd

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

print("\nAverage Prices:\n")
print(df.mean())

print("\nMaximum Prices:\n")
print(df.max())

print("\nMinimum Prices:\n")
print(df.min())