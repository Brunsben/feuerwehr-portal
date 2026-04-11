"use client";

import { usePsa } from "@/lib/psa-store";
import { Loader2, FileText } from "lucide-react";
import { useState, useMemo } from "react";

export default function ChangelogPage() {
  const { changelog, loading } = usePsa();
  const [filterAktion, setFilterAktion] = useState("");

  const aktionen = useMemo(
    () =>
      [
        ...new Set(changelog.map((c) => c.aktion).filter(Boolean)),
      ].sort() as string[],
    [changelog],
  );

  const filtered = useMemo(() => {
    let list = [...changelog].sort((a, b) =>
      (b.zeitpunkt || "").localeCompare(a.zeitpunkt || ""),
    );
    if (filterAktion) list = list.filter((c) => c.aktion === filterAktion);
    return list;
  }, [changelog, filterAktion]);

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
        <FileText className="h-6 w-6 text-blue-500" />
        Changelog
      </h1>

      <select
        value={filterAktion}
        onChange={(e) => setFilterAktion(e.target.value)}
        className="px-2 py-1.5 bg-background border border-border rounded-md text-sm"
      >
        <option value="">Alle Aktionen</option>
        {aktionen.map((a) => (
          <option key={a}>{a}</option>
        ))}
      </select>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-2">Zeitpunkt</th>
              <th className="p-2">Tabelle</th>
              <th className="p-2">Aktion</th>
              <th className="p-2">Details</th>
              <th className="p-2">Benutzer</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border/50 hover:bg-muted/30"
              >
                <td className="p-2 text-muted-foreground text-xs whitespace-nowrap">
                  {c.zeitpunkt
                    ? new Date(c.zeitpunkt).toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="p-2">{c.tabelle}</td>
                <td className="p-2">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      c.aktion === "Erstellt"
                        ? "bg-green-500/10 text-green-500"
                        : c.aktion === "Gelöscht"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-blue-500/10 text-blue-500"
                    }`}
                  >
                    {c.aktion}
                  </span>
                </td>
                <td className="p-2 text-muted-foreground max-w-xs truncate">
                  {c.details}
                </td>
                <td className="p-2 text-muted-foreground">{c.benutzer}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Einträge vorhanden.
          </p>
        )}
      </div>
    </div>
  );
}
