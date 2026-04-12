"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X, GripVertical } from "lucide-react";
import { fkApiFetch } from "@/lib/fk-api-fetch";

interface LicenseClass {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isExpiring: boolean;
  defaultCheckIntervalMonths: number;
  defaultValidityYears: number | null;
  sortOrder: number;
}

type FormData = Omit<LicenseClass, "id"> & { id?: string };

const emptyForm: FormData = {
  code: "",
  name: "",
  description: "",
  isExpiring: false,
  defaultCheckIntervalMonths: 6,
  defaultValidityYears: null,
  sortOrder: 0,
};

export default function FuehrerscheinklassenPage() {
  const [classes, setClasses] = useState<LicenseClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  function loadClasses() {
    fkApiFetch("/api/admin/license-classes")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setClasses)
      .catch(() =>
        toast.error("Führerscheinklassen konnten nicht geladen werden"),
      )
      .finally(() => setLoading(false));
  }

  function startEdit(cls: LicenseClass) {
    setEditingId(cls.id);
    setShowNew(false);
    setForm({
      code: cls.code,
      name: cls.name,
      description: cls.description || "",
      isExpiring: cls.isExpiring,
      defaultCheckIntervalMonths: cls.defaultCheckIntervalMonths,
      defaultValidityYears: cls.defaultValidityYears,
      sortOrder: cls.sortOrder,
    });
  }

  function startNew() {
    setEditingId(null);
    setShowNew(true);
    const maxSort = classes.reduce((max, c) => Math.max(max, c.sortOrder), 0);
    setForm({ ...emptyForm, sortOrder: maxSort + 1 });
  }

  function cancelEdit() {
    setEditingId(null);
    setShowNew(false);
    setForm({ ...emptyForm });
  }

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code und Name sind Pflichtfelder");
      return;
    }

    setSaving(true);
    try {
      const isEdit = editingId !== null;
      const url = isEdit
        ? `/api/admin/license-classes/${editingId}`
        : "/api/admin/license-classes";
      const method = isEdit ? "PUT" : "POST";

      const res = await fkApiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description?.trim() || null,
          isExpiring: form.isExpiring,
          defaultCheckIntervalMonths: form.defaultCheckIntervalMonths,
          defaultValidityYears: form.isExpiring
            ? form.defaultValidityYears
            : null,
          sortOrder: form.sortOrder,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Speichern");
      }

      toast.success(isEdit ? "Klasse aktualisiert" : "Klasse angelegt");
      cancelEdit();
      loadClasses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fkApiFetch(`/api/admin/license-classes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Löschen");
      }
      toast.success("Klasse gelöscht");
      setConfirmDelete(null);
      loadClasses();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Löschen");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Lade Führerscheinklassen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Führerscheinklassen</h2>
          <p className="text-gray-500">{classes.length} Klassen konfiguriert</p>
        </div>
        <Button onClick={startNew} disabled={showNew}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Klasse
        </Button>
      </div>

      {showNew && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-lg">Neue Führerscheinklasse</CardTitle>
          </CardHeader>
          <CardContent>
            <ClassForm
              form={form}
              setForm={setForm}
              onSave={handleSave}
              onCancel={cancelEdit}
              saving={saving}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {classes.map((cls) => (
          <Card key={cls.id}>
            {editingId === cls.id ? (
              <>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Bearbeiten: {cls.code}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ClassForm
                    form={form}
                    setForm={setForm}
                    onSave={handleSave}
                    onCancel={cancelEdit}
                    saving={saving}
                  />
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center gap-4 py-4">
                <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{cls.name}</span>
                    <Badge variant="outline">{cls.code}</Badge>
                    {cls.isExpiring && (
                      <Badge
                        variant="secondary"
                        className="text-amber-600 dark:text-amber-400"
                      >
                        ⏰ befristet
                        {cls.defaultValidityYears &&
                          ` (${cls.defaultValidityYears}J)`}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      Prüfintervall: {cls.defaultCheckIntervalMonths} Mon.
                    </Badge>
                  </div>
                  {cls.description && (
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {cls.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(cls)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {confirmDelete === cls.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(cls.id)}
                      >
                        Ja, löschen
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDelete(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(cls.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {classes.length === 0 && !showNew && (
        <div className="text-center py-12 text-gray-400">
          Noch keine Führerscheinklassen angelegt.
        </div>
      )}
    </div>
  );
}

function ClassForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
}: {
  form: FormData;
  setForm: (f: FormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Code *</Label>
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="z.B. B, CE, C1E"
            maxLength={10}
          />
        </div>
        <div className="space-y-2">
          <Label>Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="z.B. Klasse B"
          />
        </div>
        <div className="space-y-2">
          <Label>Sortierung</Label>
          <Input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) =>
              setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Beschreibung</Label>
        <Input
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Optionale Beschreibung"
        />
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isExpiring}
              onChange={(e) =>
                setForm({ ...form, isExpiring: e.target.checked })
              }
              className="rounded"
            />
            Befristete Klasse (z.B. C/CE)
          </label>
          <p className="text-xs text-gray-500">
            Bei befristeten Klassen wird ein Ablaufdatum erfasst
          </p>
        </div>

        <div className="space-y-2">
          <Label>Prüfintervall (Monate)</Label>
          <Input
            type="number"
            min={0}
            max={24}
            value={form.defaultCheckIntervalMonths}
            onChange={(e) =>
              setForm({
                ...form,
                defaultCheckIntervalMonths: parseInt(e.target.value) || 6,
              })
            }
          />
          <p className="text-xs text-gray-500">0 = keine Prüfung nötig</p>
        </div>

        {form.isExpiring && (
          <div className="space-y-2">
            <Label>Gültigkeit (Jahre)</Label>
            <Input
              type="number"
              min={1}
              max={15}
              value={form.defaultValidityYears ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  defaultValidityYears: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              placeholder="z.B. 5"
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={onSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Speichern..." : "Speichern"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
