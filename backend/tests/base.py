import unittest
import asyncio
import atexit
import sys
import os
import httpx

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app

_SHARED_LOOP = None


def get_shared_loop():
    global _SHARED_LOOP
    if _SHARED_LOOP is None or _SHARED_LOOP.is_closed():
        _SHARED_LOOP = asyncio.new_event_loop()
        asyncio.set_event_loop(_SHARED_LOOP)
    return _SHARED_LOOP


def _cleanup_loop():
    global _SHARED_LOOP
    if _SHARED_LOOP and not _SHARED_LOOP.is_closed():
        _SHARED_LOOP.close()


atexit.register(_cleanup_loop)


class AsyncBaseTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.loop = get_shared_loop()
        cls.transport = httpx.ASGITransport(app=app)
        cls.client = httpx.AsyncClient(transport=cls.transport, base_url="http://test")

    def run_async(self, coro):
        return self.loop.run_until_complete(coro)
