"use client";

import { usePsa } from "@/lib/psa-store";
import { usePsaUser } from "../layout-client";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, BookOpen, X } from "lucide-react";
import type { Norm } from "@/lib/psa-types";

export default function NormenPage() {
  const { normen, loading, saveNorm, deleteNorm } = usePsa();
  const user = usePsaUser();
  const [filterKat, setFilterKat] = useState("");
  const [editItem, setEditItem] = useState<Partial<Norm> | null>(null);

  const kategorien = useMemo(
    () =>
      [
        ...new Set(
          normen.map((n) => n.ausruestungstypKategorie).filter(Boolean),
        ),
      ].sort() as string[],
    [normen],
  );

  const filtered = useMemo(() => {
    let list = [...normen].sort(
      (a, b) =>
        (a.ausruestungstypKategorie || "").localeCompare(
          b.ausruestungstypKategorie || "",
        ) || (a.bezeichnung || "").localeCompare(b.bezeichnung || ""),
    );
    if (filterKat)
      list = list.filter((n) => n.ausruestungstypKategorie === filterKat);
    return list;
  }, [normen, filterKat]);

  async function handleSave() {
    if (!editItem) return;
    try {
      await saveNorm(editItem);
      setEditItem(null);
      toast.success("Gespeichert");
    } catch (e: unknown) {
      toast.error(`Fehler: ${e instanceof Error ? e.message : "Unbekannt"}`);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Norm wirklich löschen?")) return;
    try {
      await deleteNorm(id);
      toast.success("Gelöscht");
    } catch (e: unknown) {
      toast.error(`Fehler: ${e instanceof Error ? e.message : "Unbekannt"}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-500" />
          Normen
        </h1>
        {user.canEdit && (
          <button
            onClick={() => setEditItem({})}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Neu
          </button>
        )}
      </div>

      <select
        value={filterKat}
        onChange={(e) => setFilterKat(e.target.value)}
        className="px-2 py-1.5 bg-background border border-border rounded-md text-sm"
      >
        <option value="">Alle Kategorien</option>
        {kategorien.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </select>

      <div className="grid gap-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            className="bg-card border border-border rounded-md p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{n.bezeichnung}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {n.ausruestungstypKategorie && (
                    <span className="bg-muted px-1.5 py-0.5 rounded">
                      {n.ausruestungstypKategorie}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {user.canEdit && (
                  <>
                    <button
                      onClick={() => setEditItem({ ...n })}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1 hover:bg-muted rounded text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {n.beschreibung && (
              <p className="text-sm text-muted-foreground mt-2">
                {n.beschreibung}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {n.pruefintervallMonate && (
                <span>Prüfung: {n.pruefintervallMonate} Mon.</span>
              )}
              {n.maxLebensdauerJahre && (
                <span>Lebensdauer: {n.maxLebensdauerJahre} J.</span>
              )}
              {n.maxWaeschen && <span>Max. Wäschen: {n.maxWaeschen}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Normen vorhanden.
          </p>
        )}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {editItem.id ? "Norm bearbeiten" : "Neue Norm"}
              </h3>
              <button
                onClick={() => setEditItem(null)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-muted-foreground">
                  Bezeichnung
                </span>
                <input
                  type="text"
                  value={editItem.bezeichnung || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, bezeichnung: e.target.value })
                  }
                  className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Kategorie</span>
                <input
                  type="text"
                  value={editItem.ausruestungstypKategorie || ""}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      ausruestungstypKategorie: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                  placeholder="z.B. Jacke, Hose…"
                />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Prüfintervall (Mon.)
                  </span>
                  <input
                    type="number"
                    value={editItem.pruefintervallMonate ?? ""}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        pruefintervallMonate: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Lebensdauer (J.)
                  </span>
                  <input
                    type="number"
                    value={editItem.maxLebensdauerJahre ?? ""}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        maxLebensdauerJahre: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Max. Wäschen
                  </span>
                  <input
                    type="number"
                    value={editItem.maxWaeschen ?? ""}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        maxWaeschen: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-muted-foreground">
                  Beschreibung
                </span>
                <textarea
                  value={editItem.beschreibung || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, beschreibung: e.target.value })
                  }
                  rows={3}
                  className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                />
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setEditItem(null)}
                className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
