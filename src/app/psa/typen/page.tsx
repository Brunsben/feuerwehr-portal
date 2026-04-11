"use client";

import { usePsa } from "@/lib/psa-store";
import { usePsaUser } from "../layout-client";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Tag, X } from "lucide-react";
import type { Ausruestungstyp } from "@/lib/psa-types";

export default function TypenPage() {
  const { typen, normen, loading, saveTyp, deleteTyp } = usePsa();
  const user = usePsaUser();
  const [editItem, setEditItem] = useState<Partial<Ausruestungstyp> | null>(
    null,
  );

  async function handleSave() {
    if (!editItem) return;
    try {
      await saveTyp(editItem);
      setEditItem(null);
      toast.success("Gespeichert");
    } catch (e: unknown) {
      toast.error(`Fehler: ${e instanceof Error ? e.message : "Unbekannt"}`);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Typ wirklich löschen?")) return;
    try {
      await deleteTyp(id);
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
          <Tag className="h-6 w-6 text-blue-500" />
          Ausrüstungstypen
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

      <div className="grid gap-3">
        {typen.map((t) => (
          <div
            key={t.id}
            className="bg-card border border-border rounded-md p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{t.bezeichnung}</div>
                {t.typ && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {t.typ}
                  </span>
                )}
              </div>
              {user.canEdit && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditItem({ ...t })}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1 hover:bg-muted rounded text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {t.pruefintervallMonate && (
                <span>Prüfung: alle {t.pruefintervallMonate} Mon.</span>
              )}
              {t.maxLebensdauerJahre && (
                <span>Lebensdauer: {t.maxLebensdauerJahre} J.</span>
              )}
              {t.maxWaeschen && <span>Max. Wäschen: {t.maxWaeschen}</span>}
              {t.norm && <span>Norm: {t.norm}</span>}
            </div>
          </div>
        ))}
        {typen.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Typen vorhanden.
          </p>
        )}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {editItem.id ? "Typ bearbeiten" : "Neuer Typ"}
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
                <span className="text-xs text-muted-foreground">
                  Kategorie (Typ)
                </span>
                <input
                  type="text"
                  value={editItem.typ || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, typ: e.target.value })
                  }
                  className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                  placeholder="z.B. Jacke, Hose, Stiefel…"
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
                <span className="text-xs text-muted-foreground">Norm</span>
                <select
                  value={editItem.norm || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, norm: e.target.value || null })
                  }
                  className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                >
                  <option value="">Keine</option>
                  {normen.map((n) => (
                    <option key={n.id} value={n.normbezeichnung || ""}>
                      {n.normbezeichnung} – {n.bezeichnung}
                    </option>
                  ))}
                </select>
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
