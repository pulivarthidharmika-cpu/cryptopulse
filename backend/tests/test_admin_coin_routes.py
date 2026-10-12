import unittest
import sys
import os

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from tests.base import AsyncBaseTestCase
from services.auth_service import create_access_token


class TestAdminCoinRoutes(AsyncBaseTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.admin_token = create_access_token({"sub": "admin_test@cryptopulse.io", "role": "admin"})
        cls.user_token = create_access_token({"sub": "user_test@cryptopulse.io", "role": "user"})
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}
        cls.user_headers = {"Authorization": f"Bearer {cls.user_token}"}

    def test_unauthorized_access(self):
        """Verify endpoints reject requests without authorization token."""
        response = self.run_async(self.client.get("/admin/coins"))
        self.assertEqual(response.status_code, 401)

    def test_forbidden_non_admin_access(self):
        """Verify non-admin users receive 403 Forbidden on admin endpoints."""
        response = self.run_async(
            self.client.get("/admin/coins", headers=self.user_headers)
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_get_coins(self):
        """Verify admin can retrieve configured coins."""
        response = self.run_async(
            self.client.get("/admin/coins", headers=self.admin_headers)
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("coins", data)
        self.assertIsInstance(data["coins"], list)

    def test_validation_empty_coin(self):
        """Verify empty or invalid coin payload is rejected."""
        response = self.run_async(
            self.client.post(
                "/admin/coins",
                headers=self.admin_headers,
                json={"name": "", "symbol": ""},
            )
        )
        self.assertEqual(response.status_code, 400)

    def test_duplicate_coin_rejection(self):
        """Verify attempting to add an already supported coin returns 400 conflict."""
        response = self.run_async(
            self.client.post(
                "/admin/coins",
                headers=self.admin_headers,
                json={"name": "Bitcoin", "symbol": "BTC"},
            )
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("already", response.json().get("detail", "").lower())

    def test_delete_protection_core_coins(self):
        """Verify core coins (bitcoin, ethereum, solana) cannot be deleted."""
        for core in ["bitcoin", "ethereum", "solana"]:
            response = self.run_async(
                self.client.delete(f"/admin/coins/{core}", headers=self.admin_headers)
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("cannot be deleted", response.json().get("detail", "").lower())

    def test_core_coin_toggle_protection(self):
        """Verify core coins cannot have their active status modified."""
        response = self.run_async(
            self.client.patch("/admin/coins/bitcoin/toggle", headers=self.admin_headers)
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("status cannot be modified", response.json().get("detail", "").lower())

    def test_toggle_custom_coin_active_status(self):
        """Verify admin can toggle active/disabled status for managed custom coins."""
        # 1. Add a temporary test coin
        add_resp = self.run_async(
            self.client.post(
                "/admin/coins",
                headers=self.admin_headers,
                json={"name": "TestCoin", "symbol": "TC"},
            )
        )
        self.assertIn(add_resp.status_code, [200, 201])

        # 2. Toggle status
        toggle_resp = self.run_async(
            self.client.patch("/admin/coins/testcoin/toggle", headers=self.admin_headers)
        )
        self.assertEqual(toggle_resp.status_code, 200)
        self.assertFalse(toggle_resp.json()["active"])

        # 3. Clean up test coin
        del_resp = self.run_async(
            self.client.delete("/admin/coins/testcoin", headers=self.admin_headers)
        )
        self.assertEqual(del_resp.status_code, 200)


if __name__ == "__main__":
    unittest.main()
