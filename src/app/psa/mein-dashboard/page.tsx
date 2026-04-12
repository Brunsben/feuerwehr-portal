"use client";

import { usePsa } from "@/lib/psa-store";
import { usePsaUser } from "../layout-client";
import { Loader2, Shield, Calendar, Droplets } from "lucide-react";
import { useMemo } from "react";

export default function MeinDashboardPage() {
  const { ausruestung, pruefungen, waescheList, ausgaben, typen, loading } =
    usePsa();
  const user = usePsaUser();

  const meineAusruestung = useMemo(
    () =>
      ausruestung.filter(
        (a) => a.kameradId === user.kamerad_id && a.status === "Ausgegeben",
      ),
    [ausruestung, user.kamerad_id],
  );

  const meinePruefungen = useMemo(
    () =>
      pruefungen
        .filter((p) => p.kameradId === user.kamerad_id)
        .sort((a, b) => (b.datum || "").localeCompare(a.datum || ""))
        .slice(0, 10),
    [pruefungen, user.kamerad_id],
  );

  const meineWaesche = useMemo(
    () =>
      waescheList
        .filter((w) => w.kameradId === user.kamerad_id)
        .sort((a, b) => (b.datum || "").localeCompare(a.datum || ""))
        .slice(0, 10),
    [waescheList, user.kamerad_id],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user.kamerad_id) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Kein Kamerad zugeordnet. Bitte wenden Sie sich an einen Administrator.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mein Dashboard</h1>

      {/* Meine Ausrüstung */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Meine Ausrüstung ({meineAusruestung.length})
        </h2>
        {meineAusruestung.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine Ausrüstung ausgegeben.
          </p>
        ) : (
          <div className="grid gap-2">
            {meineAusruestung.map((a) => (
              <div
                key={a.id}
                className="bg-card border border-border rounded-md p-3 flex items-center justify-between"
              >
                <div>
                  <span className="font-medium text-sm">
                    {a.ausruestungstyp}
                  </span>
                  {a.seriennummer && (
                    <span className="text-xs text-muted-foreground ml-2">
                      #{a.seriennummer}
                    </span>
                  )}
                  {a.groesse && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded ml-2">
                      {a.groesse}
                    </span>
                  )}
                </div>
                {a.naechstePruefung && (
                  <span
                    className={`text-xs ${
                      new Date(a.naechstePruefung) < new Date()
                        ? "text-red-500 font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    Prüfung: {a.naechstePruefung}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Letzte Prüfungen */}
      {meinePruefungen.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-500" />
            Letzte Prüfungen
          </h2>
          <div className="space-y-1">
            {meinePruefungen.map((p) => (
              <div key={p.id} className="text-sm flex items-center gap-3 py-1">
                <span className="text-muted-foreground w-24 shrink-0">
                  {p.datum}
                </span>
                <span>{p.ausruestungstyp}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    p.ergebnis === "Bestanden"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {p.ergebnis}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Letzte Wäschen */}
      {meineWaesche.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Droplets className="h-5 w-5 text-cyan-500" />
            Letzte Wäschen
          </h2>
          <div className="space-y-1">
            {meineWaesche.map((w) => (
              <div key={w.id} className="text-sm flex items-center gap-3 py-1">
                <span className="text-muted-foreground w-24 shrink-0">
                  {w.datum}
                </span>
                <span>{w.ausruestungstyp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
