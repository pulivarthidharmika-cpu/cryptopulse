"""
CryptoPulse Root ASGI Entrypoint
Allows running 'uvicorn main:app --reload' from the repository root directory.
"""
import sys
from pathlib import Path

# Add backend directory to Python sys.path
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Import FastAPI app from backend
from backend.main import app  # noqa: E402

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
