"use client";

import { NodeStorePopover } from "@/components/node-store-popover";
import { NODE_PORT_MAP } from "@/lib/constants";
import type { NodeStatus } from "@/lib/types";

interface Props {
  statuses: Record<string, NodeStatus>;
}

const POSITIONS: Record<string, { x: number; y: number }> = {
  node1: { x: 300, y: 80 },
  node2: { x: 110, y: 370 },
  node3: { x: 490, y: 370 },
};

const CONNECTIONS = [
  ["node1", "node2"],
  ["node2", "node3"],
  ["node1", "node3"],
] as const;

const NODE_RADIUS = 52;

function roleColor(role: string, alive: boolean): string {
  if (!alive) return "#a1a1aa";
  switch (role) {
    case "leader":
      return "#3b82f6";
    case "follower":
      return "#10b981";
    case "candidate":
      return "#f59e0b";
    default:
      return "#a1a1aa";
  }
}

function roleFill(role: string, alive: boolean): string {
  if (!alive) return "#f4f4f5";
  switch (role) {
    case "leader":
      return "#dbeafe";
    case "follower":
      return "#d1fae5";
    case "candidate":
      return "#fef3c7";
    default:
      return "#f4f4f5";
  }
}

function roleFillDark(role: string, alive: boolean): string {
  if (!alive) return "#27272a";
  switch (role) {
    case "leader":
      return "#1e3a5f";
    case "follower":
      return "#064e3b";
    case "candidate":
      return "#78350f";
    default:
      return "#27272a";
  }
}

export function ClusterTopology({ statuses }: Props) {
  const nodeIds = ["node1", "node2", "node3"];
  const leaderId = Object.values(statuses).find(
    (s) => s.role === "leader" && s.alive
  )?.node_id;

  return (
    <svg viewBox="0 0 600 470" className="w-full h-full">
      {/* Connection lines — dotted lines outward from leader to followers */}
      {CONNECTIONS.map(([a, b]) => {
        const pa = POSITIONS[a];
        const pb = POSITIONS[b];
        const aStatus = statuses[a];
        const bStatus = statuses[b];
        const bothAlive = aStatus?.alive !== false && bStatus?.alive !== false;
        const isHeartbeat =
          bothAlive && (leaderId === a || leaderId === b);
        // Ensure line direction: leader → follower (so dash animation flows outward from leader)
        const [from, to] =
          leaderId === b ? [pb, pa] : [pa, pb];

        return (
          <line
            key={`${a}-${b}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className={isHeartbeat ? "heartbeat-line" : ""}
            stroke={bothAlive ? (isHeartbeat ? "#3b82f6" : "#94a3b8") : "#a1a1aa"}
            strokeWidth={isHeartbeat ? 2.5 : 1.5}
            opacity={bothAlive ? (isHeartbeat ? 0.6 : 0.2) : 0.1}
          />
        );
      })}

      {/* Nodes */}
      {nodeIds.map((id) => {
        const pos = POSITIONS[id];
        const status = statuses[id];
        const role = status?.role ?? "follower";
        const alive = status?.alive !== false;
        const color = roleColor(role, alive);

        return (
          <g
            key={id}
            className="transition-all duration-300"
            opacity={alive ? 1 : 0.4}
          >
            {/* Leader pulse ring */}
            {role === "leader" && alive && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS + 6}
                fill="none"
                stroke={color}
                strokeWidth={2}
                className="leader-pulse"
              />
            )}

            {/* Node circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={NODE_RADIUS}
              className="fill-[--node-fill] dark:fill-[--node-fill-dark] transition-all duration-300"
              style={
                {
                  "--node-fill": roleFill(role, alive),
                  "--node-fill-dark": roleFillDark(role, alive),
                } as React.CSSProperties
              }
              stroke={color}
              strokeWidth={alive ? 3 : 2}
              strokeDasharray={alive ? "none" : "6 4"}
            />

            {/* Node label */}
            <text
              x={pos.x}
              y={pos.y - 8}
              textAnchor="middle"
              className="svg-fg text-[15px] font-bold"
            >
              {id}
            </text>

            {/* Role label */}
            <text
              x={pos.x}
              y={pos.y + 14}
              textAnchor="middle"
              className="text-[12px] font-medium"
              fill={color}
            >
              {alive ? role : "dead"}
            </text>

            {/* Term + commit below circle */}
            {status && (
              <text
                x={pos.x}
                y={pos.y + NODE_RADIUS + 20}
                textAnchor="middle"
                className="svg-fg-dim text-[11px]"
              >
                term {status.current_term} · ci {status.commit_index}
              </text>
            )}

            {/* Clickable overlay — popover trigger (only when alive) */}
            {alive && (
              <foreignObject
                x={pos.x - NODE_RADIUS}
                y={pos.y - NODE_RADIUS}
                width={NODE_RADIUS * 2}
                height={NODE_RADIUS * 2}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <NodeStorePopover
                    nodeId={id}
                    baseUrl={NODE_PORT_MAP[id]}
                  >
                    <button
                      type="button"
                      className="w-full h-full rounded-full cursor-pointer border-0 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      aria-label={`View store for ${id}`}
                    />
                  </NodeStorePopover>
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}
