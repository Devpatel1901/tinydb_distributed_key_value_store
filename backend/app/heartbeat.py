from __future__ import annotations

import asyncio
import logging
import time

import httpx

from app.config import settings
from app.models import HeartbeatRequest, HeartbeatResponse
from app.replication import catch_up_peer
from app.state import node_state

logger = logging.getLogger("tinydb.heartbeat")


async def heartbeat_loop() -> None:
    """Background task: leader sends heartbeats to all peers every interval."""
    while True:
        try:
            if not node_state.alive or node_state.role != "leader":
                await asyncio.sleep(0.3)
                continue

            req = HeartbeatRequest(
                term=node_state.current_term,
                leader_id=node_state.node_id,
            )

            async with httpx.AsyncClient(timeout=1.0) as client:
                tasks = [
                    _send_heartbeat(client, peer, req)
                    for peer in node_state.peers
                ]
                results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, Exception):
                    continue
                peer_url, data = result
                if data is None or not data.success:
                    continue
                if node_state.role != "leader":
                    continue
                peer_log_length = data.log_length
                if (
                    peer_log_length < len(node_state.log)
                    and peer_log_length <= node_state.commit_index
                ):
                    asyncio.create_task(catch_up_peer(peer_url, peer_log_length))

            await asyncio.sleep(settings.heartbeat_interval)
        except asyncio.CancelledError:
            break
        except Exception:
            logger.exception("Heartbeat loop error")
            await asyncio.sleep(1)


async def _send_heartbeat(
    client: httpx.AsyncClient,
    peer_url: str,
    req: HeartbeatRequest,
) -> tuple[str, HeartbeatResponse | None]:
    try:
        resp = await client.post(
            f"{peer_url}/internal/heartbeat", json=req.model_dump()
        )
        data = HeartbeatResponse(**resp.json())
        if data.term > node_state.current_term:
            logger.info(
                "[%s] Discovered higher term %d from peer — stepping down",
                node_state.node_id,
                data.term,
            )
            node_state.become_follower(data.term)
        return (peer_url, data)
    except httpx.HTTPError:
        logger.debug("Heartbeat to %s failed", peer_url)
        return (peer_url, None)


def handle_heartbeat(req: HeartbeatRequest) -> HeartbeatResponse:
    """Process an incoming heartbeat (called by the route handler)."""
    if req.term < node_state.current_term:
        return HeartbeatResponse(term=node_state.current_term, success=False)

    if req.term > node_state.current_term or node_state.role != "follower":
        node_state.become_follower(req.term, leader_id=req.leader_id)
    else:
        node_state.leader_id = req.leader_id
        node_state.last_heartbeat_ts = time.time()

    return HeartbeatResponse(
        term=node_state.current_term,
        success=True,
        log_length=len(node_state.log),
        commit_index=node_state.commit_index,
    )


def start_heartbeat_task() -> None:
    """Cancel any existing heartbeat task and start a fresh one.
    Called when this node wins an election."""
    if node_state.heartbeat_task and not node_state.heartbeat_task.done():
        node_state.heartbeat_task.cancel()
    node_state.heartbeat_task = asyncio.create_task(heartbeat_loop())
