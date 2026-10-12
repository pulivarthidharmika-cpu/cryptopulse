import unittest
import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from tests.base import AsyncBaseTestCase


class TestPriceRoutes(AsyncBaseTestCase):
    def test_get_active_coins(self):
        """Verify /prices/coins returns list of active supported cryptocurrencies."""
        response = self.run_async(self.client.get("/prices/coins"))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("coins", data)
        self.assertIsInstance(data["coins"], list)
        self.assertGreaterEqual(len(data["coins"]), 1)

        coin_keys = [c["coin"] if isinstance(c, dict) else c for c in data["coins"]]
        self.assertIn("bitcoin", coin_keys)

    def test_get_latest_prices(self):
        """Verify /prices/latest returns cryptocurrency prices list."""
        response = self.run_async(self.client.get("/prices/latest"))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIsInstance(data["data"], list)

    def test_get_price_history_bounded(self):
        """Verify /prices/history respects coin filter and limit parameters."""
        response = self.run_async(self.client.get("/prices/history?coin=bitcoin&limit=50"))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertIsInstance(data["data"], list)
        self.assertLessEqual(len(data["data"]), 50)

        for record in data["data"]:
            self.assertEqual(record["coin"], "bitcoin")
            self.assertIn("price", record)
            self.assertIn("timestamp", record)

    def test_get_price_history_default_limit(self):
        """Verify /prices/history default limit prevents unbounded payload dumping."""
        response = self.run_async(self.client.get("/prices/history?coin=bitcoin"))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("data", data)
        self.assertLessEqual(len(data["data"]), 1000)


if __name__ == "__main__":
    unittest.main()
