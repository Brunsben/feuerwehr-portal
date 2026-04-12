"use client";

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Tab 1: Tagesplanung ────────────────────────────────────────

function DayPlanningTab() {
  const { data: statusData, mutate: mutateStatus } = useSWR(
    "/api/food/status",
    fetcher,
  );
  const { data: presetData } = useSWR("/api/food/admin/preset-menus", fetcher);

  const [description, setDescription] = useState("");
  const [zweiMenues, setZweiMenues] = useState(false);
  const [menu1Name, setMenu1Name] = useState("");
  const [menu2Name, setMenu2Name] = useState("");
  const [deadline, setDeadline] = useState("19:45");
  const [deadlineEnabled, setDeadlineEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  const menu = statusData?.menu;
  const users = statusData?.users || [];
  const guests = statusData?.guests || { menu1: 0, menu2: 0 };
  const presets = presetData?.preset_menus || [];

  const handleSaveMenu = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await fetch("/api/food/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: today,
          description: description || menu?.description || "",
          zwei_menues_aktiv: zweiMenues,
          menu1_name: menu1Name,
          menu2_name: menu2Name,
          registration_deadline: deadline,
          deadline_enabled: deadlineEnabled,
        }),
      });
      mutateStatus();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = async (userId: number) => {
    await fetch("/api/food/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, menu_choice: 1 }),
    });
    mutateStatus();
  };

  const adjustGuests = async (menuChoice: number, delta: number) => {
    const current = menuChoice === 1 ? guests.menu1 : guests.menu2;
    const today = new Date().toISOString().split("T")[0];
    await fetch("/api/food/admin/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: today,
        menu_choice: menuChoice,
        count: Math.max(0, current + delta),
      }),
    });
    mutateStatus();
  };

  return (
    <div className="space-y-6">
      {/* Menu form */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Tagesmenü</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Beschreibung
            </label>
            <input
              type="text"
              list="preset-menus"
              value={description || menu?.description || ""}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="z.B. Schnitzel mit Pommes"
            />
            {presets.length > 0 && (
              <datalist id="preset-menus">
                {presets.map((p: { id: number; name: string }) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={zweiMenues}
                onChange={(e) => setZweiMenues(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
            <span className="text-sm text-muted-foreground">Zwei Menüs</span>
          </div>

          {zweiMenues && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Menü 1
                </label>
                <input
                  type="text"
                  value={menu1Name}
                  onChange={(e) => setMenu1Name(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Menü 2
                </label>
                <input
                  type="text"
                  value={menu2Name}
                  onChange={(e) => setMenu2Name(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={deadlineEnabled}
                  onChange={(e) => setDeadlineEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
              <span className="text-sm text-muted-foreground">Deadline</span>
            </div>
            {deadlineEnabled && (
              <input
                type="time"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="p-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            )}
          </div>

          <button
            onClick={handleSaveMenu}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? "Speichern..." : "Menü speichern"}
          </button>
        </div>
      </div>

      {/* Guest management */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Gäste</h2>
        <div className="flex gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Menü 1:</span>
            <button
              onClick={() => adjustGuests(1, -1)}
              className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 font-bold transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center font-semibold">
              {guests.menu1}
            </span>
            <button
              onClick={() => adjustGuests(1, 1)}
              className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 font-bold transition-colors"
            >
              +
            </button>
          </div>
          {(zweiMenues || menu?.zweiMenuesAktiv) && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Menü 2:</span>
              <button
                onClick={() => adjustGuests(2, -1)}
                className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 font-bold transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center font-semibold">
                {guests.menu2}
              </span>
              <button
                onClick={() => adjustGuests(2, 1)}
                className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 font-bold transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User grid */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Benutzer ({users.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {users.map(
            (u: {
              id: number;
              name: string;
              registered: boolean;
              menuChoice?: number;
            }) => (
              <button
                key={u.id}
                onClick={() => toggleUser(u.id)}
                className={`p-2 text-sm rounded-lg text-left transition-colors ${
                  u.registered
                    ? u.menuChoice === 2
                      ? "bg-green-500/10 text-green-500 ring-1 ring-green-500/30"
                      : "bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {u.name}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: User-Verwaltung ──────────────────────────────────────

function UserManagementTab() {
  const { data: usersData, mutate: mutateUsers } = useSWR(
    "/api/food/admin/users",
    fetcher,
  );
  const { data: presetData, mutate: mutatePresets } = useSWR(
    "/api/food/admin/preset-menus",
    fetcher,
  );

  const [newName, setNewName] = useState("");
  const [newPersonalNr, setNewPersonalNr] = useState("");
  const [newCardId, setNewCardId] = useState("");
  const [newPreset, setNewPreset] = useState("");
  const [syncing, setSyncing] = useState(false);

  const users = usersData?.users || [];
  const presets = presetData?.preset_menus || [];

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/food/admin/sync", { method: "POST" });
      mutateUsers();
    } catch {
      /* ignore */
    } finally {
      setSyncing(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    await fetch("/api/food/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        personal_number: newPersonalNr || null,
        card_id: newCardId || null,
      }),
    });
    setNewName("");
    setNewPersonalNr("");
    setNewCardId("");
    mutateUsers();
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Benutzer wirklich löschen?")) return;
    await fetch(`/api/food/admin/users/${id}`, { method: "DELETE" });
    mutateUsers();
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await fetch("/api/food/admin/users/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv_data: text }),
    });
    mutateUsers();
    e.target.value = "";
  };

  const handleAddPreset = async () => {
    if (!newPreset.trim()) return;
    await fetch("/api/food/admin/preset-menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPreset }),
    });
    setNewPreset("");
    mutatePresets();
  };

  const handleDeletePreset = async (id: number) => {
    await fetch(`/api/food/admin/preset-menus?id=${id}`, {
      method: "DELETE",
    });
    mutatePresets();
  };

  return (
    <div className="space-y-6">
      {/* Sync + Import */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {syncing ? "Synchronisiere..." : "Portal-Sync"}
          </button>
          <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors cursor-pointer">
            CSV Import
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          <a
            href="/api/food/admin/example-csv"
            className="px-4 py-2 bg-muted text-muted-foreground hover:text-foreground font-medium rounded-lg transition-colors"
          >
            Beispiel-CSV
          </a>
        </div>
      </div>

      {/* Add user */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Benutzer hinzufügen</h2>
        <form onSubmit={handleAddUser} className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            required
            className="flex-1 min-w-[150px] p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="text"
            value={newPersonalNr}
            onChange={(e) => setNewPersonalNr(e.target.value)}
            placeholder="Personalnr. (optional)"
            className="w-40 p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="text"
            value={newCardId}
            onChange={(e) => setNewCardId(e.target.value)}
            placeholder="Karten-ID (optional)"
            className="w-44 p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Hinzufügen
          </button>
        </form>
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                  Personal-Nr.
                </th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                  Karten-ID
                </th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(
                (u: {
                  id: number;
                  name: string;
                  personalNumber: string | null;
                  cardId: string | null;
                }) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="p-3 text-sm">{u.name}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {u.personalNumber || "–"}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {u.cardId || "–"}
                    </td>
                    <td className="p-3 text-sm text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-500 hover:underline"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preset menus */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Menü-Vorlagen</h2>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={newPreset}
            onChange={(e) => setNewPreset(e.target.value)}
            placeholder="Neue Vorlage..."
            className="flex-1 p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleAddPreset()}
          />
          <button
            onClick={handleAddPreset}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p: { id: number; name: string }) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg text-sm"
            >
              {p.name}
              <button
                onClick={() => handleDeletePreset(p.id)}
                className="ml-1 text-muted-foreground hover:text-red-500"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────

export default function FoodAdminPage() {
  const [tab, setTab] = useState<"day" | "users">("day");

  return (
    <div>
      <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("day")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "day"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Tagesplanung
        </button>
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "users"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          User-Verwaltung
        </button>
      </div>

      {tab === "day" ? <DayPlanningTab /> : <UserManagementTab />}
    </div>
  );
}
