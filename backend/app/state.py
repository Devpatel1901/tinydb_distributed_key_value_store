from __future__ import annotations

import asyncio
import time

from app.config import settings
from app.models import LogEntry, NodeStatus
from app.store import KVStore


class NodeState:
    """Mutable Raft state for this node (singleton, created once at startup)."""

    def __init__(self) -> None:
        self.node_id: str = settings.node_id
        self.peers: list[str] = settings.peer_urls

        # Raft persistent state
        self.current_term: int = 0
        self.voted_for: str | None = None
        self.log: list[LogEntry] = []

        # Raft volatile state
        self.commit_index: int = -1
        self.last_applied: int = -1

        # Role management
        self.role: str = "follower"  # "follower" | "candidate" | "leader"
        self.leader_id: str | None = None

        # Failure simulation
        self.alive: bool = True

        # Timing
        self.last_heartbeat_ts: float = time.time()

        # Background task handles (managed by main.py lifespan)
        self.election_task: asyncio.Task | None = None
        self.heartbeat_task: asyncio.Task | None = None

        # KV store with persistence
        self.store = KVStore()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @property
    def majority(self) -> int:
        """Number of nodes needed for a quorum (including self)."""
        total_nodes = len(self.peers) + 1
        return total_nodes // 2 + 1

    def become_follower(self, term: int, leader_id: str | None = None) -> None:
        self.role = "follower"
        self.current_term = term
        self.voted_for = None
        self.leader_id = leader_id
        self.last_heartbeat_ts = time.time()

    def become_candidate(self) -> None:
        self.current_term += 1
        self.role = "candidate"
        self.voted_for = self.node_id
        self.leader_id = None

    def become_leader(self) -> None:
        self.role = "leader"
        self.leader_id = self.node_id

    def apply_committed_entries(self) -> None:
        """Apply all committed but not-yet-applied log entries to the KV store."""
        while self.last_applied < self.commit_index:
            self.last_applied += 1
            entry = self.log[self.last_applied]
            self.store.put(entry.key, entry.value)

    def persist(self) -> None:
        """Snapshot current raft metadata + kv data to disk."""
        self.store.save_snapshot({
            "current_term": self.current_term,
            "voted_for": self.voted_for,
            "log": [e.model_dump() for e in self.log],
            "commit_index": self.commit_index,
            "last_applied": self.last_applied,
        })

    def restore(self) -> None:
        """Load snapshot from disk if available."""
        snapshot = self.store.load_snapshot()
        if snapshot is None:
            return
        self.current_term = snapshot.get("current_term", 0)
        self.voted_for = snapshot.get("voted_for")
        self.log = [LogEntry(**e) for e in snapshot.get("log", [])]
        self.commit_index = snapshot.get("commit_index", -1)
        self.last_applied = snapshot.get("last_applied", -1)

    def status(self) -> NodeStatus:
        return NodeStatus(
            node_id=self.node_id,
            role=self.role,
            current_term=self.current_term,
            leader_id=self.leader_id,
            commit_index=self.commit_index,
            last_applied=self.last_applied,
            log_length=len(self.log),
            alive=self.alive,
        )


# Module-level singleton — imported everywhere
node_state = NodeState()
