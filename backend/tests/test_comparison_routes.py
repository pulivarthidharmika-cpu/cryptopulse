import unittest
import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from tests.base import AsyncBaseTestCase


class TestComparisonRoutes(AsyncBaseTestCase):
    def test_comparison_min_coins_validation(self):
        """Verify requesting comparison with less than 2 coins is rejected with 400."""
        # 1 coin
        resp1 = self.run_async(self.client.get("/analytics/comparison?coins=bitcoin"))
        self.assertEqual(resp1.status_code, 400)
        self.assertIn("at least 2", resp1.json().get("detail", "").lower())

        # 0 coins
        resp0 = self.run_async(self.client.get("/analytics/comparison?coins="))
        self.assertEqual(resp0.status_code, 400)

    def test_comparison_max_coins_validation(self):
        """Verify requesting comparison with more than 5 coins is rejected with 400."""
        six_coins = "bitcoin,ethereum,solana,cardano,ripple,dogecoin"
        resp = self.run_async(self.client.get(f"/analytics/comparison?coins={six_coins}"))
        self.assertEqual(resp.status_code, 400)
        self.assertIn("maximum of 5", resp.json().get("detail", "").lower())

    def test_comparison_valid_response_structure(self):
        """Verify valid 2-coin comparison returns metrics and normalized chart series."""
        resp = self.run_async(
            self.client.get("/analytics/comparison?coins=bitcoin,ethereum&limit=50")
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertIn("coins", data)
        self.assertIn("metrics", data)
        self.assertIn("normalized_series", data)

        self.assertEqual(data["coins"], ["bitcoin", "ethereum"])
        self.assertEqual(len(data["metrics"]), 2)

        for m in data["metrics"]:
            self.assertIn("coin", m)
            self.assertIn("symbol", m)
            self.assertIn("current_price", m)
            self.assertIn("change_24h", m)
            self.assertIn("volume_24h", m)
            self.assertIn("market_cap", m)
            self.assertIn("period_return_pct", m)

        # Check normalized start point
        if len(data["normalized_series"]) > 0:
            first_point = data["normalized_series"][0]
            self.assertIn("time", first_point)
            self.assertEqual(first_point["bitcoin"], 0.0)
            self.assertEqual(first_point["ethereum"], 0.0)

    def test_comparison_unknown_coins_graceful(self):
        """Verify querying non-existent coins handles empty data gracefully without crashing."""
        resp = self.run_async(
            self.client.get("/analytics/comparison?coins=unknown_coin_a,unknown_coin_b")
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        for m in data["metrics"]:
            self.assertIsNone(m["period_return_pct"])

    def test_comparison_mixed_timestamps_support(self):
        """Verify comparison handles coins with mixed timestamp formats (datetime and ISO strings) without TypeError."""
        resp = self.run_async(
            self.client.get("/analytics/comparison?coins=bitcoin,ethereum,binance&limit=50")
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["coins"], ["bitcoin", "ethereum", "binance"])
        self.assertEqual(len(data["metrics"]), 3)
        if len(data["normalized_series"]) > 0:
            first = data["normalized_series"][0]
            # Ensure time is clean HH:MM:SS format rather than raw microsecond decimals
            self.assertRegex(first["time"], r"^\d{2}:\d{2}:\d{2}$")

    def test_comparison_extended_and_max_limits(self):
        """Verify comparison succeeds for extended (300) and max (1000) limits without offset-naive/aware error."""
        # Test 300 pts (Extended)
        resp300 = self.run_async(
            self.client.get("/analytics/comparison?coins=bitcoin,ethereum,binance&limit=300")
        )
        self.assertEqual(resp300.status_code, 200)
        data300 = resp300.json()
        self.assertEqual(data300["status"], "success")
        self.assertEqual(data300["timeframe_limit"], 300)

        # Test 1000 pts (Max)
        resp1000 = self.run_async(
            self.client.get("/analytics/comparison?coins=bitcoin,ethereum,binance&limit=1000")
        )
        self.assertEqual(resp1000.status_code, 200)
        data1000 = resp1000.json()
        self.assertEqual(data1000["status"], "success")
        self.assertEqual(data1000["timeframe_limit"], 1000)


if __name__ == "__main__":
    unittest.main()

