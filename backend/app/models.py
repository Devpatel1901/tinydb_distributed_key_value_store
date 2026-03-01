from __future__ import annotations

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Log entry
# ---------------------------------------------------------------------------

class LogEntry(BaseModel):
    term: int
    index: int
    key: str
    value: str


# ---------------------------------------------------------------------------
# Vote RPC
# ---------------------------------------------------------------------------

class VoteRequest(BaseModel):
    term: int
    candidate_id: str

class VoteResponse(BaseModel):
    term: int
    granted: bool


# ---------------------------------------------------------------------------
# Heartbeat RPC
# ---------------------------------------------------------------------------

class HeartbeatRequest(BaseModel):
    term: int
    leader_id: str

class HeartbeatResponse(BaseModel):
    term: int
    success: bool


# ---------------------------------------------------------------------------
# Replication RPC
# ---------------------------------------------------------------------------

class ReplicateRequest(BaseModel):
    term: int
    leader_id: str
    entry: LogEntry

class ReplicateResponse(BaseModel):
    term: int
    success: bool


# ---------------------------------------------------------------------------
# Client-facing models
# ---------------------------------------------------------------------------

class StoreWriteRequest(BaseModel):
    value: str

class StoreReadResponse(BaseModel):
    key: str
    value: str | None

class NodeStatus(BaseModel):
    node_id: str
    role: str
    current_term: int
    leader_id: str | None
    commit_index: int
    last_applied: int
    log_length: int
    alive: bool
