"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchStatus } from "@/lib/api";
import { NODES, POLL_INTERVAL_MS } from "@/lib/constants";
import type { ActivityEvent, NodeStatus } from "@/lib/types";

let eventCounter = 0;
function nextEventId() {
  return `evt-${++eventCounter}-${Date.now()}`;
}

export function useClusterStatus() {
  const [statuses, setStatuses] = useState<Record<string, NodeStatus>>({});
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const prevRef = useRef<Record<string, NodeStatus>>({});

  const addEvent = useCallback(
    (message: string, type: ActivityEvent["type"]) => {
      setEvents((prev) => [
        { id: nextEventId(), timestamp: Date.now(), message, type },
        ...prev.slice(0, 99),
      ]);
    },
    []
  );

  const poll = useCallback(async () => {
    const results = await Promise.allSettled(
      NODES.map((n) => fetchStatus(n.url))
    );

    const next: Record<string, NodeStatus> = {};
    const prev = prevRef.current;

    results.forEach((result, i) => {
      const nodeId = NODES[i].id;
      if (result.status === "fulfilled") {
        next[nodeId] = result.value;
      } else if (prev[nodeId]) {
        next[nodeId] = { ...prev[nodeId], alive: false };
      }
    });

    // Detect state changes and generate events
    for (const nodeId of Object.keys(next)) {
      const cur = next[nodeId];
      const old = prev[nodeId];

      if (!old) {
        addEvent(`${nodeId} appeared as ${cur.role} (term ${cur.current_term})`, "info");
        continue;
      }

      if (old.alive && !cur.alive) {
        addEvent(`${nodeId} went down`, "death");
      } else if (!old.alive && cur.alive) {
        addEvent(`${nodeId} restarted as ${cur.role}`, "restart");
      }

      if (old.role !== cur.role && cur.alive) {
        if (cur.role === "leader") {
          addEvent(`${nodeId} became leader (term ${cur.current_term})`, "election");
        } else if (cur.role === "candidate") {
          addEvent(`${nodeId} started election (term ${cur.current_term})`, "election");
        } else {
          addEvent(`${nodeId} became follower (term ${cur.current_term})`, "role_change");
        }
      }

      if (old.current_term !== cur.current_term && old.role === cur.role && cur.alive) {
        addEvent(`${nodeId} term changed to ${cur.current_term}`, "info");
      }
    }

    prevRef.current = next;
    setStatuses(next);
  }, [addEvent]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  return { statuses, events, addEvent };
}
