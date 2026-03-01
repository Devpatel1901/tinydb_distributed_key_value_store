from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter

from app.election import election_loop
from app.heartbeat import heartbeat_loop
from app.state import node_state

logger = logging.getLogger("tinydb.admin")

router = APIRouter(prefix="/admin")


@router.post("/kill")
async def kill_node():
    if not node_state.alive:
        return {"status": "already dead", "node_id": node_state.node_id}

    node_state.alive = False

    if node_state.election_task and not node_state.election_task.done():
        node_state.election_task.cancel()
    if node_state.heartbeat_task and not node_state.heartbeat_task.done():
        node_state.heartbeat_task.cancel()

    logger.info("[%s] Node killed", node_state.node_id)
    return {"status": "killed", "node_id": node_state.node_id}


@router.post("/restart")
async def restart_node():
    if node_state.alive:
        return {"status": "already alive", "node_id": node_state.node_id}

    node_state.alive = True
    node_state.become_follower(node_state.current_term)

    node_state.election_task = asyncio.create_task(election_loop())
    node_state.heartbeat_task = asyncio.create_task(heartbeat_loop())

    logger.info("[%s] Node restarted", node_state.node_id)
    return {"status": "restarted", "node_id": node_state.node_id}
