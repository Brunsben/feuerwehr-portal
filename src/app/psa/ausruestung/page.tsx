"use client";

import { usePsa } from "@/lib/psa-store";
import { usePsaUser } from "../layout-client";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Search,
  Trash2,
  Pencil,
  CheckSquare,
  Droplets,
  Calendar,
  X,
  ScanLine,
} from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import type { Ausruestungstueck } from "@/lib/psa-types";
import {
  STATUS_OPTIONS,
  PRUEFUNG_ERGEBNIS_OPTIONS,
  WAESCHE_ERGEBNIS_OPTIONS,
  PRUEFUNG_STATUS_MAP,
  type PruefungErgebnis,
} from "@/lib/psa-types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function AusruestungPage() {
  const {
    ausruestung,
    typen,
    kameraden,
    loading,
    saveAusruestung,
    deleteAusruestung,
    patchAusruestung,
    batchAction,
  } = usePsa();
  const user = usePsaUser();

  const [search, setSearch] = useState("");
  const [filterTyp, setFilterTyp] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editItem, setEditItem] = useState<Partial<Ausruestungstueck> | null>(
    null,
  );
  const [showBatchDialog, setShowBatchDialog] = useState<
    "pruefung" | "waesche" | null
  >(null);
  const [batchForm, setBatchForm] = useState<Record<string, string>>({});
  const [scanTarget, setScanTarget] = useState<"search" | "seriennummer" | null>(
    null,
  );

  function handleScan(code: string) {
    const value = code.trim();
    if (scanTarget === "search") {
      setSearch(value);
    } else if (scanTarget === "seriennummer") {
      setEditItem((prev) => (prev ? { ...prev, seriennummer: value } : prev));
    }
    setScanTarget(null);
  }

  const kategorien = useMemo(
    () => [...new Set(typen.map((t) => t.typ).filter(Boolean))].sort(),
    [typen],
  );

  const filtered = useMemo(() => {
    let list = ausruestung;
    if (filterTyp)
      list = list.filter(
        (a) =>
          a.ausruestungstyp &&
          typen.find((t) => t.bezeichnung === a.ausruestungstyp)?.typ ===
            filterTyp,
      );
    if (filterStatus) list = list.filter((a) => a.status === filterStatus);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (a) =>
          (a.ausruestungstyp || "").toLowerCase().includes(s) ||
          (a.seriennummer || "").toLowerCase().includes(s) ||
          (a.kamerad || "").toLowerCase().includes(s) ||
          (a.groesse || "").toLowerCase().includes(s),
      );
    }
    return list;
  }, [ausruestung, typen, filterTyp, filterStatus, search]);

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  }

  async function handleSave() {
    if (!editItem) return;
    try {
      await saveAusruestung(editItem);
      setEditItem(null);
      toast.success("Gespeichert");
    } catch (e: unknown) {
      toast.error(`Fehler: ${e instanceof Error ? e.message : "Unbekannt"}`);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Ausrüstungsstück wirklich löschen?")) return;
    try {
      await deleteAusruestung(id);
      toast.success("Gelöscht");
    } catch (e: unknown) {
      toast.error(`Fehler: ${e instanceof Error ? e.message : "Unbekannt"}`);
    }
  }

  async function handleQuickStatus(id: number, status: string) {
    try {
      await patchAusruestung(id, { status });
      toast.success(`Status → ${status}`);
    } catch (e: unknown) {
      toast.error(`Fehler: ${e instanceof Error ? e.message : "Unbekannt"}`);
    }
  }

  async function handleBatch(action: "pruefung" | "waesche") {
    if (selectedIds.size === 0) return;
    try {
      const data: Record<string, string> = { datum: todayStr(), ...batchForm };
      if (action === "pruefung") {
        data.ergebnis = batchForm.ergebnis || "Bestanden";
        data.pruefer = batchForm.pruefer || user.sub;
      } else {
        data.ergebnis = batchForm.ergebnis || "OK";
      }
      const count = selectedIds.size;
      await batchAction(action, [...selectedIds], data);
      setSelectedIds(new Set());
      setShowBatchDialog(null);
      setBatchForm({});
      toast.success(
        `${action === "pruefung" ? "Prüfung" : "Wäsche"} für ${count} Stück eingetragen`,
      );
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
        <h1 className="text-2xl font-bold">Ausrüstung</h1>
        {user.canEdit && (
          <button
            onClick={() => setEditItem({ status: "Lager" })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Neu
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Suche…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setScanTarget("search")}
          title="Seriennummer/QR scannen"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background border border-border rounded-md text-sm hover:bg-muted"
        >
          <ScanLine className="h-4 w-4" />
          <span className="hidden sm:inline">Scannen</span>
        </button>
        <select
          value={filterTyp}
          onChange={(e) => setFilterTyp(e.target.value)}
          className="px-2 py-1.5 bg-background border border-border rounded-md text-sm"
        >
          <option value="">Alle Kategorien</option>
          {kategorien.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2 py-1.5 bg-background border border-border rounded-md text-sm"
        >
          <option value="">Alle Status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Batch actions */}
      {user.canEdit && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 text-sm bg-blue-500/10 border border-blue-500/30 rounded-md px-3 py-2">
          <span className="font-medium">{selectedIds.size} ausgewählt</span>
          <button
            onClick={() => {
              setBatchForm({ ergebnis: "Bestanden", pruefer: user.sub });
              setShowBatchDialog("pruefung");
            }}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
          >
            <Calendar className="h-3 w-3" />
            Prüfung
          </button>
          <button
            onClick={() => {
              setBatchForm({ ergebnis: "OK" });
              setShowBatchDialog("waesche");
            }}
            className="flex items-center gap-1 px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700"
          >
            <Droplets className="h-3 w-3" />
            Wäsche
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-muted-foreground ml-auto"
          >
            Abwählen
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              {user.canEdit && (
                <th className="p-2 w-8">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filtered.length &&
                      filtered.length > 0
                    }
                    onChange={toggleAll}
                  />
                </th>
              )}
              <th className="p-2">Typ</th>
              <th className="p-2">Seriennr.</th>
              <th className="p-2">Kamerad</th>
              <th className="p-2">Status</th>
              <th className="p-2">Größe</th>
              <th className="p-2">Nächste Prüfung</th>
              {user.canEdit && <th className="p-2 w-24">Aktionen</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const overdue =
                a.naechstePruefung && new Date(a.naechstePruefung) < new Date();
              return (
                <tr
                  key={a.id}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  {user.canEdit && (
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(a.id)}
                        onChange={() => toggleSelect(a.id)}
                      />
                    </td>
                  )}
                  <td className="p-2 font-medium">{a.ausruestungstyp}</td>
                  <td className="p-2 text-muted-foreground">
                    {a.seriennummer}
                  </td>
                  <td className="p-2">{a.kamerad || "—"}</td>
                  <td className="p-2">
                    {user.canEdit ? (
                      <select
                        value={a.status || ""}
                        onChange={(e) =>
                          handleQuickStatus(a.id, e.target.value)
                        }
                        className="text-xs px-1.5 py-0.5 bg-background border border-border rounded"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                        {a.status}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-muted-foreground">{a.groesse}</td>
                  <td
                    className={`p-2 ${overdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}
                  >
                    {a.naechstePruefung || "—"}
                  </td>
                  {user.canEdit && (
                    <td className="p-2 flex gap-1">
                      <button
                        onClick={() => setEditItem({ ...a })}
                        className="p-1 hover:bg-muted rounded"
                        title="Bearbeiten"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1 hover:bg-muted rounded text-red-500"
                        title="Löschen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Keine Ausrüstung gefunden.
          </p>
        )}
      </div>

      {/* Batch-Ergebnis-Dialog (Prüfung / Wäsche) */}
      {showBatchDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {showBatchDialog === "pruefung" ? "Prüfung" : "Wäsche"} für{" "}
                {selectedIds.size} Stück
              </h3>
              <button
                onClick={() => {
                  setShowBatchDialog(null);
                  setBatchForm({});
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-muted-foreground">Ergebnis</span>
                <select
                  value={batchForm.ergebnis || ""}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, ergebnis: e.target.value })
                  }
                  className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                >
                  {(showBatchDialog === "pruefung"
                    ? PRUEFUNG_ERGEBNIS_OPTIONS
                    : WAESCHE_ERGEBNIS_OPTIONS
                  ).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>

              {showBatchDialog === "pruefung" && (
                <>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">
                      Prüfer
                    </span>
                    <input
                      type="text"
                      value={batchForm.pruefer || ""}
                      onChange={(e) =>
                        setBatchForm({ ...batchForm, pruefer: e.target.value })
                      }
                      className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-muted-foreground">
                      Nächste Prüfung
                    </span>
                    <input
                      type="date"
                      value={batchForm.naechstePruefung || ""}
                      onChange={(e) =>
                        setBatchForm({
                          ...batchForm,
                          naechstePruefung: e.target.value,
                        })
                      }
                      className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                    />
                  </label>
                  {PRUEFUNG_STATUS_MAP[
                    (batchForm.ergebnis || "") as PruefungErgebnis
                  ] && (
                    <p className="text-xs text-orange-500">
                      Status der Stücke wird automatisch auf „
                      {
                        PRUEFUNG_STATUS_MAP[
                          batchForm.ergebnis as PruefungErgebnis
                        ]
                      }
                      " gesetzt.
                    </p>
                  )}
                </>
              )}

              {showBatchDialog === "waesche" && (
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Waschart (optional)
                  </span>
                  <input
                    type="text"
                    value={batchForm.waescheart || ""}
                    onChange={(e) =>
                      setBatchForm({ ...batchForm, waescheart: e.target.value })
                    }
                    placeholder="z. B. Grundreinigung, Imprägnierung"
                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                  />
                </label>
              )}

              <label className="block">
                <span className="text-xs text-muted-foreground">Notizen</span>
                <textarea
                  value={batchForm.notizen || ""}
                  onChange={(e) =>
                    setBatchForm({ ...batchForm, notizen: e.target.value })
                  }
                  rows={2}
                  className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                />
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowBatchDialog(null);
                  setBatchForm({});
                }}
                className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleBatch(showBatchDialog)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1.5"
              >
                <CheckSquare className="h-4 w-4" />
                Eintragen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {editItem.id ? "Bearbeiten" : "Neue Ausrüstung"}
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
                <span className="text-xs text-muted-foreground">Typ</span>
                <select
                  value={editItem.ausruestungstyp || ""}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      ausruestungstyp: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                >
                  <option value="">Bitte wählen</option>
                  {typen.map((t) => (
                    <option key={t.id} value={t.bezeichnung || ""}>
                      {t.bezeichnung}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">
                  Seriennummer
                </span>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={editItem.seriennummer || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, seriennummer: e.target.value })
                    }
                    className="flex-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setScanTarget("seriennummer")}
                    title="Seriennummer scannen"
                    className="px-2.5 py-1.5 bg-background border border-border rounded-md hover:bg-muted"
                  >
                    <ScanLine className="h-4 w-4" />
                  </button>
                </div>
              </label>
              <label className="block">
                <span className="text-xs text-muted-foreground">Kamerad</span>
                <select
                  value={editItem.kameradId?.toString() || ""}
                  onChange={(e) => {
                    const kid = e.target.value
                      ? parseInt(e.target.value)
                      : null;
                    const kam = kid
                      ? kameraden.find((k) => k.id === kid)
                      : null;
                    setEditItem({
                      ...editItem,
                      kameradId: kid,
                      kamerad: kam ? `${kam.vorname} ${kam.name}` : null,
                    });
                  }}
                  className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                >
                  <option value="">Keiner</option>
                  {kameraden
                    .filter((k) => k.aktiv)
                    .map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.vorname} {k.name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <select
                    value={editItem.status || "Lager"}
                    onChange={(e) =>
                      setEditItem({ ...editItem, status: e.target.value })
                    }
                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Größe</span>
                  <input
                    type="text"
                    value={editItem.groesse || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, groesse: e.target.value })
                    }
                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">
                    Herstellungsdatum
                  </span>
                  <input
                    type="date"
                    value={editItem.herstellungsdatum || ""}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        herstellungsdatum: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs text-muted-foreground">Notizen</span>
                <textarea
                  value={editItem.notizen || ""}
                  onChange={(e) =>
                    setEditItem({ ...editItem, notizen: e.target.value })
                  }
                  rows={2}
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

      {scanTarget && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setScanTarget(null)}
          title={
            scanTarget === "search"
              ? "Ausrüstung per Code finden"
              : "Seriennummer scannen"
          }
        />
      )}
    </div>
  );
}
