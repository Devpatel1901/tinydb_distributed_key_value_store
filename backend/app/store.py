from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from app.config import settings


class KVStore:
    """In-memory key-value dict backed by a JSON snapshot on disk."""

    def __init__(self) -> None:
        self.data: dict[str, str] = {}
        self._snapshot_path = Path(settings.data_dir) / "snapshot.json"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get(self, key: str) -> str | None:
        return self.data.get(key)

    def put(self, key: str, value: str) -> None:
        self.data[key] = value

    # ------------------------------------------------------------------
    # Persistence helpers
    # ------------------------------------------------------------------

    def save_snapshot(self, state: dict[str, Any]) -> None:
        """Persist full node state (kv_data + raft metadata) atomically."""
        os.makedirs(self._snapshot_path.parent, exist_ok=True)
        payload = {
            "kv_data": self.data,
            **state,
        }
        tmp = self._snapshot_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(payload, indent=2))
        tmp.rename(self._snapshot_path)

    def load_snapshot(self) -> dict[str, Any] | None:
        """Load snapshot from disk. Returns the full dict or None."""
        if not self._snapshot_path.exists():
            return None
        try:
            payload = json.loads(self._snapshot_path.read_text())
            self.data = payload.pop("kv_data", {})
            return payload
        except (json.JSONDecodeError, KeyError):
            return None
