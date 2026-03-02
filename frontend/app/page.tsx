"use client";

import { ActivityLog } from "@/components/activity-log";
import { ClusterTopology } from "@/components/cluster-topology";
import { Header } from "@/components/header";
import { KVPanel } from "@/components/kv-panel";
import { NodeCard } from "@/components/node-card";
import { useClusterStatus } from "@/hooks/use-cluster-status";
import { NODES } from "@/lib/constants";

export default function DashboardPage() {
  const { statuses, events, addEvent } = useClusterStatus();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 flex min-h-0">
        {/* Left: Cluster topology visualization */}
        <div className="w-1/2 flex items-center justify-center border-r p-6">
          <ClusterTopology statuses={statuses} />
        </div>

        {/* Right: Controls & info — flex column, no outer scroll */}
        <div className="w-1/2 flex flex-col min-h-0 p-4 gap-4 overflow-hidden">
          {/* Node cards — fixed height row */}
          <section className="shrink-0">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Nodes
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {NODES.map((n) => (
                <NodeCard
                  key={n.id}
                  nodeId={n.id}
                  status={statuses[n.id]}
                />
              ))}
            </div>
          </section>

          {/* KV operations + Activity log — fills remaining space */}
          <section className="flex-1 min-h-0 grid grid-cols-2 gap-3">
            <div className="flex flex-col min-h-0">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 shrink-0">
                Operations
              </h2>
              <KVPanel statuses={statuses} onEvent={addEvent} />
            </div>
            <div className="flex flex-col min-h-0">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 shrink-0">
                Events
              </h2>
              <ActivityLog events={events} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
