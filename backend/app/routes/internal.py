from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.election import handle_vote_request
from app.heartbeat import handle_heartbeat
from app.models import (
    HeartbeatRequest,
    HeartbeatResponse,
    ReplicateRequest,
    ReplicateResponse,
    VoteRequest,
    VoteResponse,
)
from app.replication import handle_replicate
from app.state import node_state

router = APIRouter(prefix="/internal")


@router.post("/vote", response_model=VoteResponse)
async def vote(req: VoteRequest):
    if not node_state.alive:
        raise HTTPException(status_code=503, detail="Node is down")
    return handle_vote_request(req)


@router.post("/heartbeat", response_model=HeartbeatResponse)
async def heartbeat(req: HeartbeatRequest):
    if not node_state.alive:
        raise HTTPException(status_code=503, detail="Node is down")
    return handle_heartbeat(req)


@router.post("/replicate", response_model=ReplicateResponse)
async def replicate(req: ReplicateRequest):
    if not node_state.alive:
        raise HTTPException(status_code=503, detail="Node is down")
    return handle_replicate(req)
