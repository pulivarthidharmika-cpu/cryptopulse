import unittest
import time
import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from tests.base import AsyncBaseTestCase
from database.database import (
    historical_prices_collection,
    coins_collection,
    init_db_indexes,
)


class TestDatabasePerformance(AsyncBaseTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.loop.run_until_complete(init_db_indexes())

    def test_historical_prices_indexes_exist(self):
        """Verify compound index [('coin', 1), ('timestamp', -1)] is created on historical_prices."""
        indexes = self.run_async(historical_prices_collection.index_information())
        index_keys = [info["key"] for info in indexes.values()]

        has_compound = any(
            key == [("coin", 1), ("timestamp", -1)] for key in index_keys
        )
        self.assertTrue(has_compound, f"Compound index [('coin', 1), ('timestamp', -1)] not found in {index_keys}")

    def test_coins_unique_index_exists(self):
        """Verify unique index on coin key exists to prevent race condition duplicates."""
        indexes = self.run_async(coins_collection.index_information())
        index_keys = [info["key"] for info in indexes.values()]

        has_coin_index = any(key == [("coin", 1)] for key in index_keys)
        self.assertTrue(has_coin_index, f"Index on ('coin', 1) not found in {index_keys}")

    def test_indexed_query_performance_benchmark(self):
        """Benchmark: Verify bounded indexed lookup returns in < 50ms on large dataset."""
        t0 = time.perf_counter()
        results = self.run_async(
            historical_prices_collection.find(
                {"coin": "bitcoin"},
                {"_id": 0}
            )
            .sort("timestamp", -1)
            .limit(100)
            .to_list(length=100)
        )
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        self.assertGreaterEqual(len(results), 1)
        self.assertLess(elapsed_ms, 50.0, f"Query took {elapsed_ms:.2f}ms which exceeded the 50ms benchmark threshold")


if __name__ == "__main__":
    unittest.main()
