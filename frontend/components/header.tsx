"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="flex items-center justify-between border-b px-4 sm:px-6 py-3 sm:py-4">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">
          TinyDB Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
          Distributed key-value cluster visualization
        </p>
      </div>
      {mounted && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground shrink-0">
          <span className="hidden sm:inline">Light</span>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
          />
          <span className="hidden sm:inline">Dark</span>
        </div>
      )}
    </header>
  );
}
