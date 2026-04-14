import os
import sys
from pathlib import Path

os.environ.setdefault("OPENROUTER_API_KEY", "test-key-for-pytest")
os.environ.setdefault("ALLOWED_ORIGIN", "http://localhost:3000")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
