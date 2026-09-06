"use client";

import { usePsa } from "@/lib/psa-store";
import { Loader2, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { GROESSE_KAT_MAP } from "@/lib/psa-types";
import { AUSBILDUNGEN_KATALOG } from "@/lib/ausbildungen";

export default function KameradenPage() {
  const { kameraden, ausruestung, ausbildungen, loading } = usePsa();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [filterAusbildung, setFilterAusbildung] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);

  const ausbByKamerad = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const a of ausbildungen) {
      const arr = m.get(a.kameradId) || [];
      arr.push(a.bezeichnung);
      m.set(a.kameradId, arr);
    }
    return m;
  }, [ausbildungen]);

  const filtered = useMemo(() => {
    let list = kameraden;
    if (!showInactive) list = list.filter((k) => k.aktiv);
    if (filterAusbildung)
      list = list.filter((k) =>
        (ausbByKamerad.get(k.id) || []).includes(filterAusbildung),
      );
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (k) =>
          k.name.toLowerCase().includes(s) ||
          k.vorname.toLowerCase().includes(s) ||
          (k.dienstgrad || "").toLowerCase().includes(s),
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [kameraden, search, showInactive, filterAusbildung, ausbByKamerad]);

  const detailKamerad = detailId
    ? kameraden.find((k) => k.id === detailId)
    : null;
  const detailAusruestung = detailId
    ? ausruestung.filter((a) => a.kameradId === detailId)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groesseEntries = Object.entries(GROESSE_KAT_MAP);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users className="h-6 w-6 text-blue-500" />
        Kameraden
      </h1>
      <p className="text-sm text-muted-foreground">
        Kameraden werden im Portal verwaltet. Hier nur Anzeige mit Größen und
        zugewiesener Ausrüstung.
      </p>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Suche…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-40 px-3 py-1.5 bg-background border border-border rounded-md text-sm"
        />
        <select
          value={filterAusbildung}
          onChange={(e) => setFilterAusbildung(e.target.value)}
          title="Nach Ausbildung filtern"
          className="px-2 py-1.5 bg-background border border-border rounded-md text-sm"
        >
          <option value="">Alle Ausbildungen</option>
          {AUSBILDUNGEN_KATALOG.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Inaktive
        </label>
      </div>

      <div className="grid gap-2">
        {filtered.map((k) => {
          const count = ausruestung.filter(
            (a) => a.kameradId === k.id && a.status === "Ausgegeben",
          ).length;
          return (
            <button
              key={k.id}
              onClick={() => setDetailId(k.id === detailId ? null : k.id)}
              className="bg-card border border-border rounded-md p-3 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">
                    {k.name}, {k.vorname}
                  </span>
                  {k.dienstgrad && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {k.dienstgrad}
                    </span>
                  )}
                  {!k.aktiv && (
                    <span className="text-xs bg-red-500/10 text-red-500 ml-2 px-1.5 py-0.5 rounded">
                      inaktiv
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {count} Stück
                </span>
              </div>
              {(ausbByKamerad.get(k.id) || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(ausbByKamerad.get(k.id) || []).map((a) => (
                    <span
                      key={a}
                      className="text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail Modal */}
      {detailKamerad && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setDetailId(null)}
        >
          <div
            className="bg-card border border-border rounded-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-4">
              {detailKamerad.vorname} {detailKamerad.name}
              {detailKamerad.dienstgrad && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({detailKamerad.dienstgrad})
                </span>
              )}
            </h3>

            {/* Größen */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Kleidergrößen</h4>
              <div className="grid grid-cols-2 gap-1 text-sm">
                {groesseEntries.map(([, { label, field }]) => (
                  <div key={field} className="flex justify-between py-0.5">
                    <span className="text-muted-foreground">{label}:</span>
                    <span>{(detailKamerad[field] as string) || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ausbildungen */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Ausbildungen</h4>
              {(ausbByKamerad.get(detailKamerad.id) || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keine Ausbildungen hinterlegt.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {(ausbByKamerad.get(detailKamerad.id) || []).map((a) => (
                    <span
                      key={a}
                      className="text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ausrüstung */}
            <div>
              <h4 className="text-sm font-medium mb-2">
                Zugewiesene Ausrüstung ({detailAusruestung.length})
              </h4>
              {detailAusruestung.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keine Ausrüstung zugewiesen.
                </p>
              ) : (
                <div className="space-y-1">
                  {detailAusruestung.map((a) => (
                    <div
                      key={a.id}
                      className="flex justify-between text-sm py-0.5"
                    >
                      <span>
                        {a.ausruestungstyp}
                        {a.seriennummer && (
                          <span className="text-muted-foreground ml-1">
                            #{a.seriennummer}
                          </span>
                        )}
                      </span>
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setDetailId(null)}
              className="mt-4 w-full px-3 py-1.5 text-sm bg-muted rounded-md hover:bg-muted/80"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
