"use client";

import { usePsa } from "@/lib/psa-store";
import { usePsaUser } from "./layout-client";
import {
  Users,
  Shield,
  ArrowRightLeft,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const PRIO_COLOR = {
  rot: "bg-red-500/10 text-red-500 border-red-500/30",
  orange: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  gelb: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
};

export default function PsaDashboardPage() {
  const { stats, warnungen, loading } = usePsa();
  const user = usePsaUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tiles = [
    {
      label: "Kameraden",
      value: stats.kameraden,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Ausrüstung",
      value: stats.ausruestung,
      icon: Shield,
      color: "text-green-500",
    },
    {
      label: "Ausgegeben",
      value: stats.ausgegeben,
      icon: ArrowRightLeft,
      color: "text-orange-500",
    },
    {
      label: "Prüfung fällig",
      value: stats.pruefungFaellig,
      icon: AlertTriangle,
      color:
        stats.pruefungFaellig > 0 ? "text-red-500" : "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">PSA-Verwaltung</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Willkommen, {user.kamerad_name || user.sub}
        </p>
      </div>

      {/* Stats Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${t.color}`} />
                <span className="text-xs text-muted-foreground">{t.label}</span>
              </div>
              <span className="text-2xl font-bold">{t.value}</span>
            </div>
          );
        })}
      </div>

      {/* Warnungen */}
      {warnungen.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Warnungen ({warnungen.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {warnungen.slice(0, 20).map((w, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-md border text-sm ${PRIO_COLOR[w.prio]}`}
              >
                {w.text}
              </div>
            ))}
            {warnungen.length > 20 && (
              <p className="text-xs text-muted-foreground text-center">
                … und {warnungen.length - 20} weitere
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
