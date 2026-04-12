"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  UserPlus,
  Link as LinkIcon,
  Unlink,
  Save,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────
interface Kamerad {
  id: number;
  name: string;
  vorname: string;
  dienstgrad: string | null;
  email: string | null;
  personalnummer: string | null;
  kartenId: string | null;
  aktiv: boolean;
  jackeGroesse: string | null;
  hoseGroesse: string | null;
  stiefelGroesse: string | null;
  handschuhGroesse: string | null;
  hemdGroesse: string | null;
  poloshirtGroesse: string | null;
  fleeceGroesse: string | null;
  psaRolle: string | null;
  foodRolle: string | null;
  fkRolle: string | null;
}

interface Benutzer {
  id: number;
  Benutzername: string;
  Rolle: string;
  KameradId: number | null;
  Aktiv: boolean;
}

interface AuthUser {
  Benutzername: string;
  Rolle: string;
  KameradId: number | null;
  KameradName?: string;
  app_permissions: Record<string, string>;
}

// ── Konstanten ───────────────────────────────────────────
const DIENSTGRADE = [
  "Feuerwehranwärter/in",
  "Feuerwehrmann/-frau",
  "Oberfeuerwehrmann/-frau",
  "Hauptfeuerwehrmann/-frau",
  "Löschmeister/in",
  "Oberlöschmeister/in",
  "Hauptlöschmeister/in",
  "Brandmeister/in",
  "Oberbrandmeister/in",
  "Hauptbrandmeister/in",
  "Brandinspektor/in",
  "Brandoberinspektor/in",
  "Brandamtmann/-frau",
  "Oberbrandmeister/in (Ehrenbeamter)",
  "Ehrenbrandmeister/in",
];

const PSA_ROLLEN = ["Admin", "Verwalter", "Nur lesen"];
const FOOD_ROLLEN = ["Admin", "User"];
const FK_ROLLEN = ["Admin", "Prüfer", "Mitglied"];

const EMPTY_FORM: Omit<Kamerad, "id"> = {
  name: "",
  vorname: "",
  dienstgrad: null,
  email: null,
  personalnummer: null,
  kartenId: null,
  aktiv: true,
  jackeGroesse: null,
  hoseGroesse: null,
  stiefelGroesse: null,
  handschuhGroesse: null,
  hemdGroesse: null,
  poloshirtGroesse: null,
  fleeceGroesse: null,
  psaRolle: null,
  foodRolle: null,
  fkRolle: null,
};

// ── Hauptkomponente ──────────────────────────────────────
export function MitgliederClient({
  user,
  feuerwehrName,
}: {
  user: AuthUser;
  feuerwehrName: string;
}) {
  const [kameraden, setKameraden] = useState<Kamerad[]>([]);
  const [benutzer, setBenutzer] = useState<Benutzer[]>([]);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Kamerad | null>(null);
  const [saving, setSaving] = useState(false);

  // Verknüpfter Benutzer im Formular
  const [linkedUser, setLinkedUser] = useState<Benutzer | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPin, setNewUserPin] = useState("");
  const [newUserRolle, setNewUserRolle] = useState("User");

  const load = useCallback(async () => {
    try {
      const [kRes, bRes] = await Promise.all([
        fetch("/api/kameraden"),
        fetch("/api/benutzer"),
      ]);
      if (kRes.ok) setKameraden(await kRes.json());
      if (bRes.ok) setBenutzer(await bRes.json());
    } catch {
      toast.error("Fehler beim Laden der Daten");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Gefilterte Liste
  const filtered = kameraden.filter((k) => {
    if (!showInactive && !k.aktiv) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      k.name.toLowerCase().includes(q) ||
      k.vorname.toLowerCase().includes(q) ||
      k.dienstgrad?.toLowerCase().includes(q) ||
      k.personalnummer?.toLowerCase().includes(q)
    );
  });

  // ── Form Helpers ─────────────────────────────
  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setLinkedUser(null);
    setNewUserName("");
    setNewUserPin("");
    setNewUserRolle("User");
    setShowForm(true);
  }

  function openEdit(k: Kamerad) {
    setEditId(k.id);
    setForm({ ...k });
    const linked = benutzer.find((b) => b.KameradId === k.id) || null;
    setLinkedUser(linked);
    setNewUserName(linked?.Benutzername || "");
    setNewUserPin("");
    setNewUserRolle(linked?.Rolle || "User");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
  }

  function updateForm(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value || null }));
  }

  // ── Save ─────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim() || !form.vorname.trim()) {
      toast.error("Name und Vorname sind Pflichtfelder");
      return;
    }
    setSaving(true);
    try {
      let kameradId = editId;

      if (editId) {
        // Update
        const res = await fetch(`/api/kameraden/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Kamerad konnte nicht gespeichert werden");
      } else {
        // Create
        const res = await fetch("/api/kameraden", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Kamerad konnte nicht erstellt werden");
        const created = await res.json();
        kameradId = created.id;
      }

      // Benutzer-Verknüpfung
      if (newUserName.trim() && kameradId) {
        if (linkedUser) {
          // Update bestehenden Benutzer
          const updates: Record<string, unknown> = {
            Benutzername: newUserName,
            Rolle: newUserRolle,
            KameradId: kameradId,
          };
          if (newUserPin) updates.PIN = newUserPin;
          await fetch(`/api/benutzer/${linkedUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
        } else if (newUserPin) {
          // Neuen Benutzer erstellen
          await fetch("/api/benutzer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              Benutzername: newUserName,
              PIN: newUserPin,
              Rolle: newUserRolle,
              KameradId: kameradId,
            }),
          });
        }
      }

      toast.success(editId ? "Kamerad aktualisiert" : "Kamerad erstellt");
      closeForm();
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      // Verknüpften Benutzer zuerst entknüpfen
      const linked = benutzer.find((b) => b.KameradId === deleteTarget.id);
      if (linked) {
        await fetch(`/api/benutzer/${linked.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ KameradId: null }),
        });
      }

      const res = await fetch(`/api/kameraden/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");

      toast.success(`${deleteTarget.vorname} ${deleteTarget.name} gelöscht`);
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Fehler beim Löschen");
    }
  }

  // ── Unlink Benutzer ──────────────────────────
  async function unlinkUser() {
    if (!linkedUser) return;
    await fetch(`/api/benutzer/${linkedUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ KameradId: null }),
    });
    setLinkedUser(null);
    setNewUserName("");
    setNewUserPin("");
    toast.success("Benutzer-Verknüpfung entfernt");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} feuerwehrName={feuerwehrName} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              Inaktive
            </label>
            <button
              onClick={openCreate}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Neu
            </button>
          </div>
        </div>

        {/* Tabelle (Desktop) */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Dienstgrad</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Personalnr.</th>
                <th className="text-left px-4 py-3 font-medium">Login</th>
                <th className="text-right px-4 py-3 font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((k) => {
                const linked = benutzer.find((b) => b.KameradId === k.id);
                return (
                  <tr
                    key={k.id}
                    className={`hover:bg-muted/50 ${!k.aktiv ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      {k.vorname} {k.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {k.dienstgrad || "–"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {k.email || "–"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {k.personalnummer || "–"}
                    </td>
                    <td className="px-4 py-3">
                      {linked ? (
                        <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">
                          {linked.Benutzername}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(k)}
                          className="p-1.5 rounded hover:bg-muted"
                          title="Bearbeiten"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(k)}
                          className="p-1.5 rounded hover:bg-muted text-destructive"
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filtered.map((k) => {
            const linked = benutzer.find((b) => b.KameradId === k.id);
            return (
              <div
                key={k.id}
                className={`p-4 rounded-lg border border-border bg-card ${!k.aktiv ? "opacity-50" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {k.vorname} {k.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {k.dienstgrad || "Kein Dienstgrad"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(k)}
                      className="p-1.5 rounded hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(k)}
                      className="p-1.5 rounded hover:bg-muted text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {linked && (
                  <div className="mt-2 text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded inline-block">
                    Login: {linked.Benutzername}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            {search ? "Keine Ergebnisse" : "Noch keine Kameraden angelegt"}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          {filtered.length} von {kameraden.length} Kameraden
        </p>
      </main>

      {/* ── Modal: Kamerad bearbeiten/erstellen ──── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="text-lg font-semibold">
                {editId ? "Kamerad bearbeiten" : "Neuer Kamerad"}
              </h2>
              <button
                onClick={closeForm}
                className="p-1 rounded hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Persönliche Daten */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Persönliche Daten
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InputField
                    label="Vorname *"
                    value={form.vorname}
                    onChange={(v) => updateForm("vorname", v)}
                  />
                  <InputField
                    label="Name *"
                    value={form.name}
                    onChange={(v) => updateForm("name", v)}
                  />
                  <SelectField
                    label="Dienstgrad"
                    value={form.dienstgrad || ""}
                    options={DIENSTGRADE}
                    onChange={(v) => updateForm("dienstgrad", v)}
                    allowEmpty
                  />
                  <InputField
                    label="Email"
                    type="email"
                    value={form.email || ""}
                    onChange={(v) => updateForm("email", v)}
                  />
                  <InputField
                    label="Personalnummer"
                    value={form.personalnummer || ""}
                    onChange={(v) => updateForm("personalnummer", v)}
                  />
                  <InputField
                    label="Karten-ID"
                    value={form.kartenId || ""}
                    onChange={(v) => updateForm("kartenId", v)}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.aktiv}
                      onChange={(e) => updateForm("aktiv", e.target.checked)}
                      className="rounded"
                    />
                    Aktiv
                  </label>
                </div>
              </section>

              {/* Kleidergrößen */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Kleidergrößen
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <InputField
                    label="Hose"
                    value={form.hoseGroesse || ""}
                    onChange={(v) => updateForm("hoseGroesse", v)}
                  />
                  <InputField
                    label="Jacke"
                    value={form.jackeGroesse || ""}
                    onChange={(v) => updateForm("jackeGroesse", v)}
                  />
                  <InputField
                    label="Handschuhe"
                    value={form.handschuhGroesse || ""}
                    onChange={(v) => updateForm("handschuhGroesse", v)}
                  />
                  <InputField
                    label="Stiefel"
                    value={form.stiefelGroesse || ""}
                    onChange={(v) => updateForm("stiefelGroesse", v)}
                  />
                  <InputField
                    label="Hemd"
                    value={form.hemdGroesse || ""}
                    onChange={(v) => updateForm("hemdGroesse", v)}
                  />
                  <InputField
                    label="Poloshirt"
                    value={form.poloshirtGroesse || ""}
                    onChange={(v) => updateForm("poloshirtGroesse", v)}
                  />
                  <InputField
                    label="Fleece/Softshell"
                    value={form.fleeceGroesse || ""}
                    onChange={(v) => updateForm("fleeceGroesse", v)}
                  />
                </div>
              </section>

              {/* App-Berechtigungen */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  App-Berechtigungen
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <SelectField
                    label="PSA-Verwaltung"
                    value={form.psaRolle || ""}
                    options={PSA_ROLLEN}
                    onChange={(v) => updateForm("psaRolle", v)}
                    allowEmpty
                  />
                  <SelectField
                    label="Essensbestellung"
                    value={form.foodRolle || ""}
                    options={FOOD_ROLLEN}
                    onChange={(v) => updateForm("foodRolle", v)}
                    allowEmpty
                  />
                  <SelectField
                    label="Führerscheinkontrolle"
                    value={form.fkRolle || ""}
                    options={FK_ROLLEN}
                    onChange={(v) => updateForm("fkRolle", v)}
                    allowEmpty
                  />
                </div>
              </section>

              {/* Verknüpfter Login-Account */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  {linkedUser ? (
                    <LinkIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Login-Account
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <InputField
                    label="Benutzername"
                    value={newUserName}
                    onChange={setNewUserName}
                  />
                  <InputField
                    label={linkedUser ? "Neues Passwort" : "Passwort"}
                    type="password"
                    value={newUserPin}
                    onChange={setNewUserPin}
                    placeholder={linkedUser ? "(unverändert)" : ""}
                  />
                  <SelectField
                    label="Rolle"
                    value={newUserRolle}
                    options={["Admin", "Gerätewart", "Maschinist", "User"]}
                    onChange={setNewUserRolle}
                  />
                </div>
                {linkedUser && (
                  <button
                    onClick={unlinkUser}
                    className="mt-2 text-xs text-destructive flex items-center gap-1 hover:underline"
                  >
                    <Unlink className="h-3 w-3" />
                    Verknüpfung entfernen
                  </button>
                )}
              </section>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border sticky bottom-0 bg-card">
              <button
                onClick={closeForm}
                className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                {saving ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Löschen bestätigen ─────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Kamerad löschen?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              <strong>
                {deleteTarget.vorname} {deleteTarget.name}
              </strong>{" "}
              wird unwiderruflich gelöscht. Ein ggf. verknüpfter Login-Account
              wird entknüpft.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-md border border-border text-sm hover:bg-muted"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hilfskomponenten ─────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  allowEmpty,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-md border border-input bg-background text-foreground text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring pr-8"
        >
          {allowEmpty && <option value="">– Keine –</option>}
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}
