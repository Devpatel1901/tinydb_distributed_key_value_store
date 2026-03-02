"use client";

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
      {/* Connection lines */}
      {CONNECTIONS.map(([a, b]) => {
        const pa = POSITIONS[a];
        const pb = POSITIONS[b];
        const aStatus = statuses[a];
        const bStatus = statuses[b];
        const bothAlive = aStatus?.alive !== false && bStatus?.alive !== false;
        const isHeartbeat =
          bothAlive && (leaderId === a || leaderId === b);

        return (
          <line
            key={`${a}-${b}`}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            className={`${isHeartbeat ? "heartbeat-line" : ""} ${bothAlive ? "svg-stroke-fg" : ""}`}
            stroke={bothAlive ? undefined : "#a1a1aa"}
            strokeWidth={isHeartbeat ? 2.5 : 1.5}
            opacity={bothAlive ? 0.2 : 0.1}
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
          </g>
        );
      })}
    </svg>
  );
}
