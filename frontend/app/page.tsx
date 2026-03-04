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
    <div className="min-h-screen lg:h-screen flex flex-col lg:overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Left: Cluster topology — full width on mobile, 50% on lg+ */}
        <div className="lg:w-1/2 flex items-center justify-center border-b lg:border-b-0 lg:border-r p-4 lg:p-6 min-h-[280px] sm:min-h-[320px] lg:min-h-0 lg:flex-1">
          <ClusterTopology statuses={statuses} />
        </div>

        {/* Right: Controls & info — grows on mobile (main scrolls), fixed on desktop */}
        <div className="flex-1 flex flex-col min-h-0 p-4 gap-4 lg:overflow-hidden">
          {/* Node cards — 1 col mobile, 3 cols tablet+ */}
          <section className="shrink-0">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Nodes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {NODES.map((n) => (
                <NodeCard
                  key={n.id}
                  nodeId={n.id}
                  status={statuses[n.id]}
                />
              ))}
            </div>
          </section>

          {/* KV operations + Activity log — stack on mobile, side by side on md+ */}
          <section className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-2 gap-3">
            <div className="flex flex-col min-h-0 shrink-0 md:shrink">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 shrink-0">
                Operations
              </h2>
              <KVPanel statuses={statuses} onEvent={addEvent} />
            </div>
            <div className="flex flex-col flex-1 min-h-[200px]">
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
