from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    node_id: str = "node1"
    peers: str = ""  # comma-separated URLs, e.g. "http://node2:8000,http://node3:8000"
    port: int = 8000
    data_dir: str = "/data"

    # Election timeout bounds (seconds)
    election_timeout_min: float = 3.0
    election_timeout_max: float = 5.0

    # Heartbeat interval (seconds)
    heartbeat_interval: float = 1.0

    # Replication timeout (seconds)
    replication_timeout: float = 2.0

    @property
    def peer_urls(self) -> list[str]:
        if not self.peers:
            return []
        return [p.strip() for p in self.peers.split(",") if p.strip()]

    model_config = {"env_prefix": ""}


settings = Settings()
