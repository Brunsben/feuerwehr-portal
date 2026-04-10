"use client";

import { useEffect, useState } from "react";

interface AppConfig {
  name: string;
  path: string;
  icon: string;
  color: string;
  healthUrl: string;
  requiredPermission?: string;
}

const APPS: AppConfig[] = [
  {
    name: "PSA-Verwaltung",
    path: "/psa/",
    icon: "🦺",
    color: "bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60",
    healthUrl: "/psa/health",
    requiredPermission: "psa",
  },
  {
    name: "Essensbestellung",
    path: "/food/",
    icon: "🍽️",
    color: "bg-green-500/10 border-green-500/30 hover:border-green-500/60",
    healthUrl: "/food/health",
    requiredPermission: "food",
  },
  {
    name: "Führerscheinkontrolle",
    path: "/fk/",
    icon: "🚒",
    color: "bg-orange-500/10 border-orange-500/30 hover:border-orange-500/60",
    healthUrl: "/fk/api/health",
    requiredPermission: "fk",
  },
];

export function AppTileGrid({
  permissions,
}: {
  permissions: Record<string, string>;
}) {
  const [health, setHealth] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    async function checkHealth() {
      const results: Record<string, boolean | null> = {};
      await Promise.all(
        APPS.map(async (app) => {
          try {
            const r = await fetch(app.healthUrl, {
              signal: AbortSignal.timeout(5000),
            });
            results[app.name] = r.ok;
          } catch {
            results[app.name] = false;
          }
        }),
      );
      setHealth(results);
    }

    checkHealth();
    const id = setInterval(checkHealth, 60000);
    return () => clearInterval(id);
  }, []);

  const visibleApps = APPS.filter(
    (app) => !app.requiredPermission || permissions[app.requiredPermission],
  );

  if (visibleApps.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        Keine Apps verfügbar. Wende dich an einen Administrator.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleApps.map((app) => (
        <a
          key={app.name}
          href={app.path}
          className={`
            relative p-6 rounded-lg border-2 transition-all
            ${app.color}
          `}
        >
          {/* Health indicator */}
          <div className="absolute top-3 right-3">
            {health[app.name] === null || health[app.name] === undefined ? (
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30 block animate-pulse" />
            ) : health[app.name] ? (
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 block" />
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 block" />
            )}
          </div>
          <div className="text-3xl mb-3">{app.icon}</div>
          <div className="font-medium text-foreground">{app.name}</div>
          {permissions[app.requiredPermission!] && (
            <div className="text-xs text-muted-foreground mt-1">
              {permissions[app.requiredPermission!]}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
