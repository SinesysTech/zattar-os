"use client";

import { useState, useEffect } from "react";
import { PortalSidebar } from "./sidebar";
import { PortalHeader } from "./header";
import { ReactNode } from "react";

interface PortalShellProps {
  children: ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("portal-theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  useEffect(() => {
    localStorage.setItem("portal-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");

  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-surface text-on-surface font-body selection:bg-primary/30"
    >
      <PortalSidebar onToggleTheme={toggleTheme} currentTheme={theme} />
      <PortalHeader />
      <main className="lg:pl-72 pt-28 px-6 lg:pr-8 pb-12 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
