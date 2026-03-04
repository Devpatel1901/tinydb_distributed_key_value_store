"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getKey, putKey } from "@/lib/api";
import { NODE_PORT_MAP, NODES } from "@/lib/constants";
import type { ActivityEvent, NodeStatus } from "@/lib/types";

interface Props {
  statuses: Record<string, NodeStatus>;
  onEvent: (message: string, type: ActivityEvent["type"]) => void;
}

export function KVPanel({ statuses, onEvent }: Props) {
  const [putKeyInput, setPutKeyInput] = useState("");
  const [putValueInput, setPutValueInput] = useState("");
  const [getKeyInput, setGetKeyInput] = useState("");
  const [getResult, setGetResult] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const leaderEntry = Object.entries(statuses).find(
    ([, s]) => s.role === "leader" && s.alive
  );
  const leaderUrl = leaderEntry ? NODE_PORT_MAP[leaderEntry[0]] : null;

  const firstAliveUrl = NODES.map((n) => ({
    ...n,
    status: statuses[n.id],
  })).find((n) => n.status?.alive)?.url;

  async function handlePut() {
    if (!putKeyInput.trim() || !putValueInput.trim()) return;
    if (!leaderUrl) {
      setMessage({ text: "No leader available", ok: false });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await putKey(leaderUrl, putKeyInput.trim(), putValueInput.trim());
      setMessage({ text: `"${putKeyInput}" written successfully`, ok: true });
      onEvent(
        `PUT ${putKeyInput} = "${putValueInput}" committed`,
        "write"
      );
      setPutKeyInput("");
      setPutValueInput("");
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Write failed",
        ok: false,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGet() {
    if (!getKeyInput.trim()) return;
    if (!firstAliveUrl) {
      setMessage({ text: "No nodes available", ok: false });
      return;
    }
    setLoading(true);
    setGetResult(null);
    setMessage(null);
    try {
      const data = await getKey(firstAliveUrl, getKeyInput.trim());
      setGetResult(data.value ?? "(not found)");
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Read failed",
        ok: false,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          KV Store Operations
        </CardTitle>
        {!leaderUrl && (
          <p className="text-xs text-destructive">
            No leader elected -- writes disabled
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PUT */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            PUT
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="key"
              value={putKeyInput}
              onChange={(e) => setPutKeyInput(e.target.value)}
              className="flex-1 min-w-0"
            />
            <Input
              placeholder="value"
              value={putValueInput}
              onChange={(e) => setPutValueInput(e.target.value)}
              className="flex-1 min-w-0"
            />
            <Button
              size="sm"
              disabled={loading || !leaderUrl}
              onClick={handlePut}
              className="shrink-0"
            >
              PUT
            </Button>
          </div>
        </div>

        {/* GET */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            GET
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="key"
              value={getKeyInput}
              onChange={(e) => setGetKeyInput(e.target.value)}
              className="flex-1 min-w-0"
            />
            <Button size="sm" disabled={loading} onClick={handleGet} className="shrink-0">
              GET
            </Button>
          </div>
          {getResult !== null && (
            <div className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
              {getResult}
            </div>
          )}
        </div>

        {/* Feedback */}
        {message && (
          <p
            className={`text-xs ${message.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}
          >
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
