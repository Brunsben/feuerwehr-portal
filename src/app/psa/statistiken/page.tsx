"use client";

import { usePsa } from "@/lib/psa-store";
import { usePsaUser } from "../layout-client";
import { Loader2, BarChart3 } from "lucide-react";
import { useMemo } from "react";

export default function StatistikenPage() {
  const { ausruestung, typen, kameraden, waescheList, pruefungen, loading } =
    usePsa();
  const user = usePsaUser();

  // Status-Verteilung
  const statusVerteilung = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of ausruestung) {
      const s = a.status || "Unbekannt";
      map.set(s, (map.get(s) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [ausruestung]);

  // Ausrüstung pro Typ-Kategorie
  const typVerteilung = useMemo(() => {
    const typMap = new Map(typen.map((t) => [t.bezeichnung, t.typ]));
    const map = new Map<string, number>();
    for (const a of ausruestung) {
      const kat =
        (a.ausruestungstyp ? typMap.get(a.ausruestungstyp) : null) ||
        "Unbekannt";
      map.set(kat, (map.get(kat) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [ausruestung, typen]);

  // Prüfungen pro Monat (letzte 12 Monate)
  const pruefungenProMonat = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pruefungen) {
      if (p.datum) {
        const monat = p.datum.slice(0, 7); // YYYY-MM
        map.set(monat, (map.get(monat) || 0) + 1);
      }
    }
    return [...map.entries()].sort().slice(-12);
  }, [pruefungen]);

  // Wäschen pro Monat (letzte 12 Monate)
  const waescheProMonat = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of waescheList) {
      if (w.datum) {
        const monat = w.datum.slice(0, 7);
        map.set(monat, (map.get(monat) || 0) + 1);
      }
    }
    return [...map.entries()].sort().slice(-12);
  }, [waescheList]);

  // Ausrüstung pro Kamerad
  const proKamerad = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of ausruestung) {
      if (a.kamerad && a.status === "Ausgegeben") {
        map.set(a.kamerad, (map.get(a.kamerad) || 0) + 1);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  }, [ausruestung]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxStatus = Math.max(...statusVerteilung.map(([, v]) => v), 1);
  const maxTyp = Math.max(...typVerteilung.map(([, v]) => v), 1);
  const maxPruef = Math.max(...pruefungenProMonat.map(([, v]) => v), 1);
  const maxWaesche = Math.max(...waescheProMonat.map(([, v]) => v), 1);
  const maxKamerad = Math.max(...proKamerad.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-blue-500" />
        Statistiken
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status-Verteilung */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Status-Verteilung</h3>
          <div className="space-y-2">
            {statusVerteilung.map(([label, count]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
                  {label}
                </span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Typ-Kategorien */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">
            Ausrüstung nach Kategorie
          </h3>
          <div className="space-y-2">
            {typVerteilung.map(([label, count]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">
                  {label}
                </span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${(count / maxTyp) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Prüfungen pro Monat */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Prüfungen pro Monat</h3>
          <div className="flex items-end gap-1 h-32">
            {pruefungenProMonat.map(([monat, count]) => (
              <div
                key={monat}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-[10px] font-medium">{count}</span>
                <div
                  className="w-full bg-green-500 rounded-t"
                  style={{
                    height: `${(count / maxPruef) * 100}%`,
                    minHeight: 2,
                  }}
                />
                <span className="text-[9px] text-muted-foreground">
                  {monat.slice(5)}
                </span>
              </div>
            ))}
          </div>
          {pruefungenProMonat.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Keine Daten
            </p>
          )}
        </div>

        {/* Wäschen pro Monat */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Wäschen pro Monat</h3>
          <div className="flex items-end gap-1 h-32">
            {waescheProMonat.map(([monat, count]) => (
              <div
                key={monat}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-[10px] font-medium">{count}</span>
                <div
                  className="w-full bg-cyan-500 rounded-t"
                  style={{
                    height: `${(count / maxWaesche) * 100}%`,
                    minHeight: 2,
                  }}
                />
                <span className="text-[9px] text-muted-foreground">
                  {monat.slice(5)}
                </span>
              </div>
            ))}
          </div>
          {waescheProMonat.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Keine Daten
            </p>
          )}
        </div>

        {/* Top Kameraden */}
        <div className="bg-card border border-border rounded-lg p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">
            Ausrüstung pro Kamerad (Top 15)
          </h3>
          <div className="space-y-2">
            {proKamerad.map(([label, count]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-40 shrink-0 truncate">
                  {label}
                </span>
                <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(count / maxKamerad) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
          {proKamerad.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Keine ausgegebene Ausrüstung
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
