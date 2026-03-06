from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    node_id: str = "node1"
    peers: str = ""  # comma-separated URLs, e.g. "http://node2:8000,http://node3:8000"
    port: int = 8000
    data_dir: str = "/data"

    # Render: PEER_NODE1_HOSTPORT, PEER_NODE2_HOSTPORT, PEER_NODE3_HOSTPORT (host:port via fromService)
    peer_node1_hostport: str | None = None
    peer_node2_hostport: str | None = None
    peer_node3_hostport: str | None = None

    # Election timeout bounds (seconds)
    election_timeout_min: float = 3.0
    election_timeout_max: float = 5.0

    # Heartbeat interval (seconds)
    heartbeat_interval: float = 1.0

    # Replication timeout (seconds)
    replication_timeout: float = 2.0

    @property
    def peer_urls(self) -> list[str]:
        if self.peers:
            return [p.strip() for p in self.peers.split(",") if p.strip()]
        # Build from PEER_NODE*_HOSTPORT (Render), excluding self
        hostports = {
            "node1": self.peer_node1_hostport,
            "node2": self.peer_node2_hostport,
            "node3": self.peer_node3_hostport,
        }
        result = []
        for nid, hp in hostports.items():
            if nid != self.node_id and hp:
                result.append(f"http://{hp.strip()}")
        return result

    model_config = {"env_prefix": ""}


settings = Settings()
