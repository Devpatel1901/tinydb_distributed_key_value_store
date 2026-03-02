import type { NodeStatus, StoreReadResponse, StoreWriteResponse } from "./types";

export async function fetchStatus(baseUrl: string): Promise<NodeStatus> {
  const res = await fetch(`${baseUrl}/status`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Status fetch failed: ${res.status}`);
  return res.json();
}

export async function getKey(
  baseUrl: string,
  key: string
): Promise<StoreReadResponse> {
  const res = await fetch(`${baseUrl}/store/${encodeURIComponent(key)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GET failed: ${res.status}`);
  return res.json();
}

export async function putKey(
  baseUrl: string,
  key: string,
  value: string
): Promise<StoreWriteResponse> {
  const res = await fetch(`${baseUrl}/store/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
    redirect: "follow",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `PUT failed: ${res.status}`);
  }
  return res.json();
}

export async function killNode(baseUrl: string): Promise<void> {
  const res = await fetch(`${baseUrl}/admin/kill`, { method: "POST" });
  if (!res.ok) throw new Error(`Kill failed: ${res.status}`);
}

export async function restartNode(baseUrl: string): Promise<void> {
  const res = await fetch(`${baseUrl}/admin/restart`, { method: "POST" });
  if (!res.ok) throw new Error(`Restart failed: ${res.status}`);
}
