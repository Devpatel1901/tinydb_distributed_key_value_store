const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost";

// Render: use per-node URLs when set; otherwise single host + ports
const NODE1_URL =
  process.env.NEXT_PUBLIC_NODE1_URL || `${API_BASE}:8001`;
const NODE2_URL =
  process.env.NEXT_PUBLIC_NODE2_URL || `${API_BASE}:8002`;
const NODE3_URL =
  process.env.NEXT_PUBLIC_NODE3_URL || `${API_BASE}:8003`;

export const NODES = [
  { id: "node1", url: NODE1_URL },
  { id: "node2", url: NODE2_URL },
  { id: "node3", url: NODE3_URL },
] as const;

export const NODE_PORT_MAP: Record<string, string> = Object.fromEntries(
  NODES.map((n) => [n.id, n.url])
);

export const POLL_INTERVAL_MS = 1500;
