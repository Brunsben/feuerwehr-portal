"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fkApiFetch } from "@/lib/fk-api-fetch";
import { toast } from "sonner";
import { AlertTriangle, Pencil, Save, X } from "lucide-react";

interface LicenseClass {
  id: string;
  code: string;
  name: string;
  isExpiring: boolean;
}

interface LicenseEntry {
  licenseClassId: string;
  issueDate: string;
  expiryDate: string;
  restriction188: boolean;
}

interface MemberLicense {
  id: string;
  licenseClassId: string;
  issueDate: string | null;
  expiryDate: string | null;
  restriction188: boolean;
  licenseClass: LicenseClass;
}

export default function LicenseClassEditor({
  initialLicenses,
}: {
  initialLicenses: MemberLicense[];
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [licenseClasses, setLicenseClasses] = useState<LicenseClass[]>([]);
  const [licenses, setLicenses] = useState<LicenseEntry[]>([]);
  const [currentLicenses, setCurrentLicenses] =
    useState<MemberLicense[]>(initialLicenses);

  // Load available license classes when editing starts
  useEffect(() => {
    if (!editing) return;
    fkApiFetch("/api/license-classes")
      .then((r) => r.json())
      .then(setLicenseClasses)
      .catch(() => toast.error("Fehler beim Laden der Klassen"));
  }, [editing]);

  function startEditing() {
    setLicenses(
      currentLicenses.map((ml) => ({
        licenseClassId: ml.licenseClassId,
        issueDate: ml.issueDate || "",
        expiryDate: ml.expiryDate || "",
        restriction188: ml.restriction188,
      })),
    );
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  function addLicense() {
    setLicenses((prev) => [
      ...prev,
      {
        licenseClassId: "",
        issueDate: "",
        expiryDate: "",
        restriction188: false,
      },
    ]);
  }

  function removeLicense(index: number) {
    setLicenses((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLicense(
    index: number,
    field: keyof LicenseEntry,
    value: string | boolean,
  ) {
    setLicenses((prev) =>
      prev.map((lic, i) => (i === index ? { ...lic, [field]: value } : lic)),
    );
  }

  async function handleSave() {
    const filtered = licenses.filter((l) => l.licenseClassId);
    // Check for duplicates
    const classIds = filtered.map((l) => l.licenseClassId);
    if (new Set(classIds).size !== classIds.length) {
      toast.error("Jede Führerscheinklasse kann nur einmal ausgewählt werden.");
      return;
    }

    setSaving(true);
    try {
      const res = await fkApiFetch("/api/user/license-classes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenses: filtered }),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");

      // Reload current state
      const updatedRes = await fkApiFetch("/api/user/license-classes");
      const updated = await updatedRes.json();
      setCurrentLicenses(updated);
      setEditing(false);
      toast.success("Führerscheinklassen gespeichert");
    } catch {
      toast.error("Fehler beim Speichern der Führerscheinklassen");
    } finally {
      setSaving(false);
    }
  }

  // Read-only view
  if (!editing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Meine Führerscheinklassen</CardTitle>
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="mr-2 h-4 w-4" />
              Bearbeiten
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentLicenses.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-gray-400">Keine Klassen hinterlegt.</p>
              <Button variant="outline" size="sm" onClick={startEditing}>
                Jetzt Klassen eintragen
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {currentLicenses.map((ml) => (
                <div
                  key={ml.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{ml.licenseClass.code}</Badge>
                    <span className="text-sm">{ml.licenseClass.name}</span>
                    {ml.restriction188 && (
                      <Badge className="text-xs bg-amber-100 text-amber-800">
                        SZ 188
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {ml.expiryDate
                      ? `bis ${new Date(ml.expiryDate).toLocaleDateString("de-DE")}`
                      : "Unbefristet"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Führerscheinklassen bearbeiten</CardTitle>
          <Button variant="ghost" size="sm" onClick={cancelEditing}>
            <X className="mr-2 h-4 w-4" />
            Abbrechen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Honesty notice */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Hinweis zur Ehrlichkeit</p>
              <p>
                Du bist zur wahrheitsgemäßen Angabe deiner Führerscheinklassen
                verpflichtet. Der Administrator kann deine Angaben jederzeit
                anhand des hinterlegten Führerscheinfotos überprüfen.
              </p>
            </div>
          </div>
        </div>

        {licenses.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">
            Noch keine Führerscheinklassen hinterlegt.
          </p>
        )}

        {licenses.map((lic, i) => {
          const selectedClass = licenseClasses.find(
            (c) => c.id === lic.licenseClassId,
          );
          return (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  Klasse {i + 1}
                  {selectedClass && (
                    <Badge variant="outline" className="ml-2">
                      {selectedClass.code}
                    </Badge>
                  )}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLicense(i)}
                  className="text-red-500 hover:text-red-700"
                >
                  Entfernen
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Führerscheinklasse *</Label>
                  <Select
                    value={lic.licenseClassId}
                    onValueChange={(v) => updateLicense(i, "licenseClassId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Klasse wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {licenseClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.code} – {cls.name} {cls.isExpiring ? "⏰" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Ausstellungsdatum</Label>
                  <Input
                    type="date"
                    value={lic.issueDate}
                    onChange={(e) =>
                      updateLicense(i, "issueDate", e.target.value)
                    }
                  />
                </div>
                {selectedClass?.isExpiring && (
                  <div className="space-y-1">
                    <Label className="text-xs">Ablaufdatum ⏰</Label>
                    <Input
                      type="date"
                      value={lic.expiryDate}
                      onChange={(e) =>
                        updateLicense(i, "expiryDate", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
              {(selectedClass?.code === "C" ||
                selectedClass?.code === "CE") && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={lic.restriction188}
                    onChange={(e) =>
                      updateLicense(i, "restriction188", e.target.checked)
                    }
                    className="rounded"
                  />
                  Schlüsselzahl 188 (Feuerwehr, unter 21 Jahre)
                </label>
              )}
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLicense}
          className="w-full"
        >
          + Klasse hinzufügen
        </Button>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSave}
            className="bg-red-600 hover:bg-red-700"
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Speichere..." : "Speichern"}
          </Button>
          <Button variant="outline" onClick={cancelEditing} disabled={saving}>
            Abbrechen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
