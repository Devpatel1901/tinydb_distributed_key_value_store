# TinyDB -- A Mini Distributed Key-Value Store

A 3-node distributed key-value database implementing Raft-inspired leader election, heartbeats, and log replication.

## Quick Start

```bash
docker compose up --build
```

This launches three nodes accessible at:

| Node  | Host URL              |
|-------|-----------------------|
| node1 | http://localhost:8001 |
| node2 | http://localhost:8002 |
| node3 | http://localhost:8003 |

A leader is elected automatically within a few seconds.

## API Usage

### Check cluster status

```bash
curl http://localhost:8001/status
curl http://localhost:8002/status
curl http://localhost:8003/status
```

### Write a key (must hit the leader, or you get a redirect)

```bash
curl -X PUT http://localhost:8001/store/name \
  -H "Content-Type: application/json" \
  -d '{"value": "tinydb"}'
```

### Read a key (works on any node)

```bash
curl http://localhost:8002/store/name
```

### Simulate node failure

```bash
# Kill node1
curl -X POST http://localhost:8001/admin/kill

# A new leader is elected among node2 and node3
curl http://localhost:8002/status

# Restart node1
curl -X POST http://localhost:8001/admin/restart
```

## Architecture

- **Consensus**: Simplified Raft (leader election + log replication with majority commit)
- **Communication**: HTTP RPCs between nodes via internal endpoints
- **Persistence**: JSON snapshots written to a Docker volume per node
- **Failure simulation**: Kill/restart endpoints toggle node liveness

## Project Structure

```
backend/
  app/
    main.py          FastAPI app and lifecycle management
    config.py         Environment-based settings
    models.py         Pydantic request/response schemas
    state.py          Node state (term, role, log, etc.)
    election.py       Leader election logic
    heartbeat.py      Heartbeat sender/receiver
    replication.py    Log replication and majority commit
    store.py          KV store with JSON snapshot persistence
    routes/
      client.py       GET/PUT /store, GET /status
      internal.py     /internal/vote, /heartbeat, /replicate
      admin.py        /admin/kill, /admin/restart
docker-compose.yml    3-node cluster orchestration
```

## Stopping the Cluster

```bash
docker compose down
```

To also remove persisted data volumes:

```bash
docker compose down -v
```
