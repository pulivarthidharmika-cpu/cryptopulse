import requests
import time
from datetime import datetime
from database import collection

url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,dogecoin,ripple&vs_currencies=usd"

while True:

    try:

        response = requests.get(url, timeout=10)

        data = response.json()

        if "status" not in data:

            record = {
                "timestamp": datetime.now(),
                "prices": data
            }

            collection.insert_one(record)

            print("Crypto data stored successfully")
            print(data)

        else:
            print("Rate limit exceeded")

    except Exception as e:

        print("Error:", e)

    time.sleep(30)

