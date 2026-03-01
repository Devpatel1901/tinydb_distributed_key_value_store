from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.models import NodeStatus, StoreReadResponse, StoreWriteRequest
from app.replication import replicate_entry
from app.state import node_state

router = APIRouter()


@router.get("/status", response_model=NodeStatus)
async def get_status():
    return node_state.status()


@router.get("/store/{key}", response_model=StoreReadResponse)
async def get_key(key: str):
    if not node_state.alive:
        raise HTTPException(status_code=503, detail="Node is down")

    value = node_state.store.get(key)
    return StoreReadResponse(key=key, value=value)


@router.put("/store/{key}")
async def put_key(key: str, body: StoreWriteRequest):
    if not node_state.alive:
        raise HTTPException(status_code=503, detail="Node is down")

    if node_state.role != "leader":
        if node_state.leader_id:
            return JSONResponse(
                status_code=307,
                content={
                    "detail": "Not the leader",
                    "leader_id": node_state.leader_id,
                },
                headers={"Location": f"http://{node_state.leader_id}:8000/store/{key}"},
            )
        raise HTTPException(status_code=503, detail="No leader elected yet")

    committed = await replicate_entry(key, body.value)
    if not committed:
        raise HTTPException(status_code=503, detail="Failed to reach majority")

    return {"key": key, "value": body.value, "committed": True}
