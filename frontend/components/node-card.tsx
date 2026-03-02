"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { killNode, restartNode } from "@/lib/api";
import { NODE_PORT_MAP } from "@/lib/constants";
import type { NodeStatus } from "@/lib/types";

interface Props {
  status: NodeStatus | undefined;
  nodeId: string;
}

function roleBadgeVariant(
  role: string,
  alive: boolean
): "default" | "secondary" | "destructive" | "outline" {
  if (!alive) return "outline";
  if (role === "leader") return "default";
  return "secondary";
}

function roleLabel(role: string, alive: boolean): string {
  if (!alive) return "Dead";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function NodeCard({ status, nodeId }: Props) {
  const [loading, setLoading] = useState(false);
  const baseUrl = NODE_PORT_MAP[nodeId];
  const alive = status?.alive !== false;

  async function handleKill() {
    setLoading(true);
    try {
      await killNode(baseUrl);
    } catch {
      /* node may already be unreachable */
    } finally {
      setLoading(false);
    }
  }

  async function handleRestart() {
    setLoading(true);
    try {
      await restartNode(baseUrl);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      className={`transition-opacity duration-300 ${alive ? "" : "opacity-50"}`}
    >
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
        <CardTitle className="text-sm font-semibold">{nodeId}</CardTitle>
        <Badge variant={roleBadgeVariant(status?.role ?? "follower", alive)}>
          {roleLabel(status?.role ?? "follower", alive)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2 p-3 pt-1">
        {status ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">Term</span>
            <span className="font-mono">{status.current_term}</span>
            <span className="text-muted-foreground">Leader</span>
            <span className="font-mono">{status.leader_id ?? "—"}</span>
            <span className="text-muted-foreground">Commit Idx</span>
            <span className="font-mono">{status.commit_index}</span>
            <span className="text-muted-foreground">Log Length</span>
            <span className="font-mono">{status.log_length}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Connecting...</p>
        )}

        <div className="flex gap-2 pt-1">
          {alive ? (
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              disabled={loading}
              onClick={handleKill}
            >
              Kill
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={loading}
              onClick={handleRestart}
            >
              Restart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
