const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost";

export const NODES = [
  { id: "node1", url: `${API_BASE}:8001` },
  { id: "node2", url: `${API_BASE}:8002` },
  { id: "node3", url: `${API_BASE}:8003` },
] as const;

export const NODE_PORT_MAP: Record<string, string> = Object.fromEntries(
  NODES.map((n) => [n.id, n.url])
);

export const POLL_INTERVAL_MS = 1500;
