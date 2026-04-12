"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function KitchenPage() {
  const { data, mutate } = useSWR("/api/food/status", fetcher, {
    refreshInterval: 10000,
  });

  const adjustGuests = async (menuChoice: number, delta: number) => {
    const current =
      menuChoice === 1
        ? (data?.guests?.menu1 ?? 0)
        : (data?.guests?.menu2 ?? 0);
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
    mutate();
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const menu = data.menu;
  const users = data.users || [];
  const guests = data.guests || { menu1: 0, menu2: 0 };
  const registeredUsers = users.filter(
    (u: { registered: boolean }) => u.registered,
  );
  const menu1Users = registeredUsers.filter(
    (u: { menuChoice?: number }) => u.menuChoice !== 2,
  );
  const menu2Users = registeredUsers.filter(
    (u: { menuChoice?: number }) => u.menuChoice === 2,
  );
  const totalGuests = guests.menu1 + guests.menu2;
  const total = registeredUsers.length + totalGuests;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Gesamt" value={total} color="blue" />
        <StatCard
          label="Menü 1"
          value={menu1Users.length + guests.menu1}
          color="sky"
        />
        {menu?.zweiMenuesAktiv && (
          <StatCard
            label="Menü 2"
            value={menu2Users.length + guests.menu2}
            color="green"
          />
        )}
        <StatCard label="Gäste" value={totalGuests} color="amber" />
      </div>

      {/* Menu */}
      {menu && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold">{menu.description}</h2>
          {menu.zweiMenuesAktiv && (
            <div className="flex gap-3 mt-2 text-sm">
              <span className="text-blue-500">
                Menü 1: {menu.menu1Name || "Standard"}
              </span>
              <span className="text-green-500">
                Menü 2: {menu.menu2Name || "Alternativ"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* User grid */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Angemeldete Benutzer ({registeredUsers.length})
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {registeredUsers.map(
            (u: { id: number; name: string; menuChoice?: number }) => (
              <div
                key={u.id}
                className={`p-2.5 text-sm rounded-lg text-center font-medium ${
                  u.menuChoice === 2
                    ? "bg-green-500/10 text-green-500"
                    : "bg-blue-500/10 text-blue-500"
                }`}
              >
                {u.name}
              </div>
            ),
          )}
        </div>
      </div>

      {/* Guest controls */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Gäste</h2>
        <div className="flex flex-wrap gap-6">
          <GuestCounter
            label="Menü 1"
            count={guests.menu1}
            onAdjust={(d) => adjustGuests(1, d)}
          />
          {menu?.zweiMenuesAktiv && (
            <GuestCounter
              label="Menü 2"
              count={guests.menu2}
              onAdjust={(d) => adjustGuests(2, d)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-500",
    sky: "bg-sky-500/10 text-sky-500",
    green: "bg-green-500/10 text-green-500",
    amber: "bg-amber-500/10 text-amber-500",
  };

  return (
    <div className={`rounded-xl p-4 ${colors[color] ?? colors.blue}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function GuestCounter({
  label,
  count,
  onAdjust,
}: {
  label: string;
  count: number;
  onAdjust: (d: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-16">{label}:</span>
      <button
        onClick={() => onAdjust(-1)}
        className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 text-lg font-bold transition-colors"
      >
        -
      </button>
      <span className="w-10 text-center text-xl font-semibold">{count}</span>
      <button
        onClick={() => onAdjust(1)}
        className="w-10 h-10 rounded-lg bg-muted hover:bg-muted/80 text-lg font-bold transition-colors"
      >
        +
      </button>
    </div>
  );
}
