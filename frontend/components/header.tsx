"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">TinyDB Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Distributed key-value cluster visualization
        </p>
      </div>
      {mounted && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Light</span>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
          />
          <span>Dark</span>
        </div>
      )}
    </header>
  );
}
