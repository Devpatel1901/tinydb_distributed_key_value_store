from __future__ import annotations

import asyncio
import logging

import httpx

from app.config import settings
from app.models import LogEntry, ReplicateRequest, ReplicateResponse
from app.state import node_state

logger = logging.getLogger("tinydb.replication")


async def replicate_entry(key: str, value: str) -> bool:
    """Append a new log entry and replicate to peers.

    Returns True if the write was committed (majority ACK), False otherwise.
    """
    entry = LogEntry(
        term=node_state.current_term,
        index=len(node_state.log),
        key=key,
        value=value,
    )
    node_state.log.append(entry)

    req = ReplicateRequest(
        term=node_state.current_term,
        leader_id=node_state.node_id,
        entry=entry,
    )

    acks = 1  # leader counts itself

    async with httpx.AsyncClient(timeout=settings.replication_timeout) as client:
        tasks = [
            _send_replicate(client, peer, req) for peer in node_state.peers
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, ReplicateResponse):
            if result.term > node_state.current_term:
                node_state.become_follower(result.term)
                return False
            if result.success:
                acks += 1

    if acks >= node_state.majority:
        node_state.commit_index = entry.index
        node_state.apply_committed_entries()
        node_state.persist()
        logger.info(
            "[%s] Committed entry index=%d key=%s (%d ACKs)",
            node_state.node_id,
            entry.index,
            key,
            acks,
        )
        return True

    logger.warning(
        "[%s] Failed to reach majority for key=%s (%d/%d ACKs)",
        node_state.node_id,
        key,
        acks,
        node_state.majority,
    )
    return False


async def _send_replicate(
    client: httpx.AsyncClient,
    peer_url: str,
    req: ReplicateRequest,
) -> ReplicateResponse:
    resp = await client.post(
        f"{peer_url}/internal/replicate", json=req.model_dump()
    )
    return ReplicateResponse(**resp.json())


def handle_replicate(req: ReplicateRequest) -> ReplicateResponse:
    """Process an incoming replication request (called by the route handler)."""
    if req.term < node_state.current_term:
        return ReplicateResponse(term=node_state.current_term, success=False)

    if req.term > node_state.current_term:
        node_state.become_follower(req.term, leader_id=req.leader_id)

    entry = req.entry

    # Append if we don't already have this index
    if entry.index == len(node_state.log):
        node_state.log.append(entry)
    elif entry.index < len(node_state.log):
        node_state.log[entry.index] = entry
        # Truncate any entries after this index (simplified conflict resolution)
        node_state.log = node_state.log[: entry.index + 1]

    # Commit up to leader's entry
    if entry.index > node_state.commit_index:
        node_state.commit_index = entry.index
        node_state.apply_committed_entries()
        node_state.persist()

    return ReplicateResponse(term=node_state.current_term, success=True)
