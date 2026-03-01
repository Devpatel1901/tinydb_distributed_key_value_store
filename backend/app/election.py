from __future__ import annotations

import asyncio
import logging
import random
import time

import httpx

from app.config import settings
from app.models import VoteRequest, VoteResponse
from app.state import node_state

logger = logging.getLogger("tinydb.election")


async def election_loop() -> None:
    """Background task: sleep for a random election timeout, then start an
    election if no heartbeat was received in that window."""
    while True:
        try:
            if not node_state.alive:
                await asyncio.sleep(0.5)
                continue

            timeout = random.uniform(
                settings.election_timeout_min,
                settings.election_timeout_max,
            )
            await asyncio.sleep(timeout)

            if not node_state.alive:
                continue

            # If we're already leader, no need to run an election
            if node_state.role == "leader":
                continue

            elapsed = time.time() - node_state.last_heartbeat_ts
            if elapsed < settings.election_timeout_min:
                continue

            logger.info(
                "[%s] Election timeout (%.1fs) — starting election for term %d",
                node_state.node_id,
                elapsed,
                node_state.current_term + 1,
            )
            await _run_election()
        except asyncio.CancelledError:
            break
        except Exception:
            logger.exception("Election loop error")
            await asyncio.sleep(1)


async def _run_election() -> None:
    node_state.become_candidate()
    votes_received = 1  # vote for self

    req = VoteRequest(
        term=node_state.current_term,
        candidate_id=node_state.node_id,
    )

    async with httpx.AsyncClient(timeout=1.5) as client:
        tasks = [
            _request_vote(client, peer, req) for peer in node_state.peers
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, VoteResponse):
            if result.term > node_state.current_term:
                node_state.become_follower(result.term)
                return
            if result.granted:
                votes_received += 1

    if votes_received >= node_state.majority and node_state.role == "candidate":
        logger.info(
            "[%s] Won election for term %d with %d votes",
            node_state.node_id,
            node_state.current_term,
            votes_received,
        )
        node_state.become_leader()
        # Import here to avoid circular dependency at module level
        from app.heartbeat import start_heartbeat_task
        start_heartbeat_task()
    else:
        logger.info(
            "[%s] Lost election for term %d (%d votes)",
            node_state.node_id,
            node_state.current_term,
            votes_received,
        )
        node_state.become_follower(node_state.current_term)


async def _request_vote(
    client: httpx.AsyncClient,
    peer_url: str,
    req: VoteRequest,
) -> VoteResponse:
    resp = await client.post(f"{peer_url}/internal/vote", json=req.model_dump())
    return VoteResponse(**resp.json())


def handle_vote_request(req: VoteRequest) -> VoteResponse:
    """Decide whether to grant a vote to a candidate (called by the route handler)."""
    if req.term > node_state.current_term:
        node_state.become_follower(req.term)

    grant = (
        req.term >= node_state.current_term
        and node_state.voted_for in (None, req.candidate_id)
    )

    if grant:
        node_state.voted_for = req.candidate_id
        node_state.last_heartbeat_ts = time.time()
        logger.info(
            "[%s] Granted vote to %s for term %d",
            node_state.node_id,
            req.candidate_id,
            req.term,
        )

    return VoteResponse(term=node_state.current_term, granted=grant)
