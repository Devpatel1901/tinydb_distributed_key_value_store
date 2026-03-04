"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityEvent } from "@/lib/types";

interface Props {
  events: ActivityEvent[];
}

function typeIcon(type: ActivityEvent["type"]): string {
  switch (type) {
    case "election":
      return "\u2726";  // sparkle
    case "role_change":
      return "\u21C4"; // arrows
    case "death":
      return "\u2715"; // cross
    case "restart":
      return "\u21BB"; // loop
    case "write":
      return "\u270E"; // pencil
    default:
      return "\u2022"; // bullet
  }
}

function typeColor(type: ActivityEvent["type"]): string {
  switch (type) {
    case "election":
      return "text-blue-500";
    case "role_change":
      return "text-amber-500";
    case "death":
      return "text-red-500";
    case "restart":
      return "text-emerald-500";
    case "write":
      return "text-violet-500";
    default:
      return "text-muted-foreground";
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function ActivityLog({ events }: Props) {
  return (
    <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-sm font-semibold">Activity Log</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Waiting for cluster events...
          </p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((evt) => (
              <li key={evt.id} className="flex gap-2 text-xs sm:text-sm leading-snug">
                <span className={`shrink-0 ${typeColor(evt.type)}`}>
                  {typeIcon(evt.type)}
                </span>
                <span className="flex-1 min-w-0 break-words">{evt.message}</span>
                <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                  {formatTime(evt.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
