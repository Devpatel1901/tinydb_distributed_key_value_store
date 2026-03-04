"use client";

import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchStore } from "@/lib/api";
import type { StoreDataResponse } from "@/lib/types";

interface Props {
  nodeId: string;
  baseUrl: string;
  children: React.ReactNode;
}

export function NodeStorePopover({ nodeId, baseUrl, children }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<StoreDataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetchStore(baseUrl)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load store");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, baseUrl]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-80 max-h-[320px] flex flex-col"
        align="center"
        side="bottom"
        sideOffset={8}
      >
        <h3 className="font-semibold text-sm mb-2">Store — {nodeId}</h3>
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {!loading && !error && data && (
            <>
              {Object.keys(data.data).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Store is empty
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.data).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-md bg-muted px-2 py-1.5 font-mono text-xs break-all"
                    >
                      <span className="text-muted-foreground">{key}:</span>{" "}
                      {value}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
