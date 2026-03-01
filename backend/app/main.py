from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.election import election_loop
from app.heartbeat import heartbeat_loop
from app.routes import admin, client, internal
from app.state import node_state

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-22s  %(levelname)-5s  %(message)s",
)
logger = logging.getLogger("tinydb.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: restore persisted state, launch background tasks
    node_state.restore()
    logger.info(
        "[%s] Starting — term=%d, log_len=%d, peers=%s",
        node_state.node_id,
        node_state.current_term,
        len(node_state.log),
        node_state.peers,
    )

    node_state.election_task = asyncio.create_task(election_loop())
    node_state.heartbeat_task = asyncio.create_task(heartbeat_loop())

    yield

    # Shutdown: cancel background tasks
    for task in (node_state.election_task, node_state.heartbeat_task):
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    logger.info("[%s] Shutting down", node_state.node_id)


app = FastAPI(title="TinyDB", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(client.router)
app.include_router(internal.router)
app.include_router(admin.router)
