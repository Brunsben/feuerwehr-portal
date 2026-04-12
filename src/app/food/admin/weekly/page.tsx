"use client";

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface DayPlan {
  id: number;
  date: string;
  description: string;
  zweiMenuesAktiv: boolean;
  menu1Name: string | null;
  menu2Name: string | null;
  registrationDeadline: string;
  deadlineEnabled: boolean;
}

export default function WeeklyPage() {
  const { data: days, mutate } = useSWR<DayPlan[]>(
    "/api/food/admin/weekly",
    fetcher,
  );
  const [newDate, setNewDate] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<DayPlan>>({});

  const handleAddDay = async () => {
    if (!newDate) return;
    await fetch("/api/food/admin/weekly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate }),
    });
    setNewDate("");
    mutate();
  };

  const handleSave = async (id: number) => {
    await fetch(`/api/food/admin/weekly/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingId(null);
    setEditForm({});
    mutate();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tag wirklich löschen?")) return;
    await fetch(`/api/food/admin/weekly/${id}`, { method: "DELETE" });
    mutate();
  };

  const startEdit = (day: DayPlan) => {
    setEditingId(day.id);
    setEditForm({
      description: day.description,
      zweiMenuesAktiv: day.zweiMenuesAktiv,
      menu1Name: day.menu1Name,
      menu2Name: day.menu2Name,
      registrationDeadline: day.registrationDeadline,
      deadlineEnabled: day.deadlineEnabled,
    });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wochenplan</h1>

      {/* Add new day */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Neuen Tag hinzufügen
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleAddDay}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Hinzufügen
          </button>
        </div>
      </div>

      {/* Day cards */}
      <div className="space-y-4">
        {days?.map((day) => (
          <div
            key={day.id}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {formatDate(day.date)}
                </h3>
                {editingId !== day.id && (
                  <p className="text-muted-foreground mt-1">
                    {day.description || "Kein Menü eingetragen"}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {editingId === day.id ? (
                  <button
                    onClick={() => handleSave(day.id)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Speichern
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(day)}
                    className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-sm font-medium rounded-lg transition-colors"
                  >
                    Bearbeiten
                  </button>
                )}
                <button
                  onClick={() => handleDelete(day.id)}
                  className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium rounded-lg transition-colors"
                >
                  Löschen
                </button>
              </div>
            </div>

            {editingId === day.id && (
              <div className="space-y-3 border-t border-border pt-4">
                <input
                  type="text"
                  value={editForm.description ?? ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Menübeschreibung"
                  className="w-full p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={editForm.zweiMenuesAktiv ?? false}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          zweiMenuesAktiv: e.target.checked,
                        })
                      }
                      className="rounded border-border"
                    />
                    Zwei Menüs
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={editForm.deadlineEnabled ?? true}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          deadlineEnabled: e.target.checked,
                        })
                      }
                      className="rounded border-border"
                    />
                    Deadline
                  </label>
                  {editForm.deadlineEnabled && (
                    <input
                      type="time"
                      value={editForm.registrationDeadline ?? "19:45"}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          registrationDeadline: e.target.value,
                        })
                      }
                      className="p-1.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                    />
                  )}
                </div>
                {editForm.zweiMenuesAktiv && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editForm.menu1Name ?? ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, menu1Name: e.target.value })
                      }
                      placeholder="Menü 1 Name"
                      className="p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={editForm.menu2Name ?? ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, menu2Name: e.target.value })
                      }
                      placeholder="Menü 2 Name"
                      className="p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {editingId !== day.id && (
              <div className="flex flex-wrap gap-2 text-xs">
                {day.zweiMenuesAktiv && (
                  <span className="bg-purple-500/10 text-purple-500 px-2 py-1 rounded">
                    2 Menüs
                  </span>
                )}
                {day.deadlineEnabled && (
                  <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded">
                    Deadline: {day.registrationDeadline}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        {days && days.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            Keine geplanten Tage. Füge einen Tag hinzu.
          </p>
        )}
      </div>
    </div>
  );
}
