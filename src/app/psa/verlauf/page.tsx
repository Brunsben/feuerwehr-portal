"use client";

import { usePsa } from "@/lib/psa-store";
import { usePsaUser } from "../layout-client";
import { useState, useMemo } from "react";
import {
  Loader2,
  History,
  Calendar,
  Droplets,
  ArrowRightLeft,
} from "lucide-react";

type Tab = "pruefungen" | "waesche" | "ausgaben";

export default function VerlaufPage() {
  const { pruefungen, waescheList, ausgaben, kameraden, loading } = usePsa();
  const user = usePsaUser();
  const [tab, setTab] = useState<Tab>("pruefungen");
  const [filterKamerad, setFilterKamerad] = useState("");

  const tabs: { key: Tab; label: string; icon: typeof Calendar }[] = [
    { key: "pruefungen", label: "Prüfungen", icon: Calendar },
    { key: "waesche", label: "Wäschen", icon: Droplets },
    { key: "ausgaben", label: "Ausgaben", icon: ArrowRightLeft },
  ];

  const filteredPruefungen = useMemo(() => {
    let list = [...pruefungen].sort((a, b) =>
      (b.datum || "").localeCompare(a.datum || ""),
    );
    if (filterKamerad) list = list.filter((p) => p.kamerad === filterKamerad);
    return list;
  }, [pruefungen, filterKamerad]);

  const filteredWaesche = useMemo(() => {
    let list = [...waescheList].sort((a, b) =>
      (b.datum || "").localeCompare(a.datum || ""),
    );
    if (filterKamerad) list = list.filter((w) => w.kamerad === filterKamerad);
    return list;
  }, [waescheList, filterKamerad]);

  const filteredAusgaben = useMemo(() => {
    let list = [...ausgaben].sort((a, b) =>
      (b.ausgabedatum || "").localeCompare(a.ausgabedatum || ""),
    );
    if (filterKamerad) list = list.filter((a) => a.kamerad === filterKamerad);
    return list;
  }, [ausgaben, filterKamerad]);

  const kameradLabels = useMemo(
    () =>
      [
        ...new Set(
          kameraden.filter((k) => k.aktiv).map((k) => `${k.vorname} ${k.name}`),
        ),
      ].sort(),
    [kameraden],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <History className="h-6 w-6 text-blue-500" />
        Verlauf
      </h1>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Tabs */}
        <div className="flex bg-muted rounded-md p-0.5">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                  tab === t.key
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Kamerad Filter */}
        {user.canEdit && (
          <select
            value={filterKamerad}
            onChange={(e) => setFilterKamerad(e.target.value)}
            className="px-2 py-1.5 bg-background border border-border rounded-md text-sm"
          >
            <option value="">Alle Kameraden</option>
            {kameradLabels.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        )}
      </div>

      {/* Prüfungen Tab */}
      {tab === "pruefungen" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-2">Datum</th>
                <th className="p-2">Typ</th>
                <th className="p-2">Kamerad</th>
                <th className="p-2">Ergebnis</th>
                <th className="p-2">Prüfer</th>
                <th className="p-2">Nächste</th>
              </tr>
            </thead>
            <tbody>
              {filteredPruefungen.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="p-2 text-muted-foreground">{p.datum}</td>
                  <td className="p-2">{p.ausruestungstyp}</td>
                  <td className="p-2">{p.kamerad}</td>
                  <td className="p-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        p.ergebnis === "Bestanden"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {p.ergebnis}
                    </span>
                  </td>
                  <td className="p-2 text-muted-foreground">{p.pruefer}</td>
                  <td className="p-2 text-muted-foreground">
                    {p.naechstePruefung}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPruefungen.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Keine Prüfungen vorhanden.
            </p>
          )}
        </div>
      )}

      {/* Wäsche Tab */}
      {tab === "waesche" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-2">Datum</th>
                <th className="p-2">Typ</th>
                <th className="p-2">Kamerad</th>
                <th className="p-2">Notizen</th>
              </tr>
            </thead>
            <tbody>
              {filteredWaesche.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="p-2 text-muted-foreground">{w.datum}</td>
                  <td className="p-2">{w.ausruestungstyp}</td>
                  <td className="p-2">{w.kamerad}</td>
                  <td className="p-2 text-muted-foreground">{w.notizen}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredWaesche.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Keine Wäschen vorhanden.
            </p>
          )}
        </div>
      )}

      {/* Ausgaben Tab */}
      {tab === "ausgaben" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-2">Ausgabedatum</th>
                <th className="p-2">Typ</th>
                <th className="p-2">Kamerad</th>
                <th className="p-2">Rückgabe</th>
                <th className="p-2">Notizen</th>
              </tr>
            </thead>
            <tbody>
              {filteredAusgaben.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="p-2 text-muted-foreground">
                    {a.ausgabedatum}
                  </td>
                  <td className="p-2">{a.ausruestungstyp}</td>
                  <td className="p-2">{a.kamerad}</td>
                  <td className="p-2">
                    {a.rueckgabedatum ? (
                      <span className="text-green-500 text-xs">
                        {a.rueckgabedatum}
                      </span>
                    ) : (
                      <span className="text-orange-500 text-xs">offen</span>
                    )}
                  </td>
                  <td className="p-2 text-muted-foreground">{a.notizen}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAusgaben.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Keine Ausgaben vorhanden.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
