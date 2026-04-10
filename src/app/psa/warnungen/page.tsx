"use client";

import { usePsa } from "@/lib/psa-store";
import { Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

const PRIO_STYLE = {
  rot: { bg: "bg-red-500/10 border-red-500/30", text: "text-red-500", label: "Kritisch" },
  orange: { bg: "bg-orange-500/10 border-orange-500/30", text: "text-orange-500", label: "Warnung" },
  gelb: { bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-500", label: "Hinweis" },
};

export default function WarnungenPage() {
  const { warnungen, loading } = usePsa();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const byPrio = {
    rot: warnungen.filter((w) => w.prio === "rot"),
    orange: warnungen.filter((w) => w.prio === "orange"),
    gelb: warnungen.filter((w) => w.prio === "gelb"),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        Warnungen ({warnungen.length})
      </h1>

      {warnungen.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-green-500">Alles in Ordnung!</p>
          <p className="text-sm text-muted-foreground mt-1">Keine Warnungen vorhanden.</p>
        </div>
      )}

      {(["rot", "orange", "gelb"] as const).map((prio) => {
        const items = byPrio[prio];
        if (items.length === 0) return null;
        const style = PRIO_STYLE[prio];
        return (
          <div key={prio} className="space-y-2">
            <h2 className={`text-sm font-semibold ${style.text} flex items-center gap-2`}>
              <span className={`w-2.5 h-2.5 rounded-full ${prio === "rot" ? "bg-red-500" : prio === "orange" ? "bg-orange-500" : "bg-yellow-500"}`} />
              {style.label} ({items.length})
            </h2>
            <div className="space-y-1.5">
              {items.map((w, i) => (
                <div key={i} className={`px-3 py-2 rounded-md border text-sm ${style.bg}`}>
                  <span>{w.text}</span>
                  {w.ausruestungstueck.kamerad && (
                    <span className="text-xs ml-2 opacity-70">({w.ausruestungstueck.kamerad})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
