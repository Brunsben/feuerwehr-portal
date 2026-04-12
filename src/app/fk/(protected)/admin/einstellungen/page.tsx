"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Save, RotateCcw } from "lucide-react";
import { fkApiFetch } from "@/lib/fk-api-fetch";

interface Settings {
  check_interval_months: string;
  reminder_weeks_before: string;
  reminder_weeks_before_2: string;
  license_expiry_warning_months: string;
  photo_auto_delete_days: string;
  privacy_policy_version: string;
  fire_department_name: string;
}

const defaultSettings: Settings = {
  check_interval_months: "6",
  reminder_weeks_before: "4",
  reminder_weeks_before_2: "1",
  license_expiry_warning_months: "3",
  photo_auto_delete_days: "30",
  privacy_policy_version: "1.0",
  fire_department_name: "",
};

export default function EinstellungenPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [originalSettings, setOriginalSettings] =
    useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const portalConfigP = fetch("/api/auth/config")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    Promise.all([
      fkApiFetch("/api/admin/settings").then((res) => {
        if (!res.ok) throw new Error("Fehler beim Laden");
        return res.json();
      }),
      portalConfigP,
    ])
      .then(([data, portalConfig]) => {
        const portalDefaults = portalConfig?.feuerwehrName
          ? { fire_department_name: portalConfig.feuerwehrName }
          : {};
        const merged = { ...defaultSettings, ...portalDefaults, ...data };
        setSettings(merged);
        setOriginalSettings(merged);
      })
      .catch(() => toast.error("Einstellungen konnten nicht geladen werden"))
      .finally(() => setLoading(false));
  }, []);

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(originalSettings);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fkApiFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("Fehler beim Speichern");

      const result = await res.json();
      setOriginalSettings({ ...settings });
      toast.success(
        result.updatedCount > 0
          ? `${result.updatedCount} Einstellung(en) gespeichert`
          : "Keine Änderungen",
      );
    } catch {
      toast.error("Fehler beim Speichern der Einstellungen");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setSettings({ ...originalSettings });
  }

  function updateSetting(key: keyof Settings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Einstellungen werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Einstellungen</h2>
          <p className="text-gray-500">
            App-Konfiguration für die Führerscheinkontrolle
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Zurücksetzen
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Speichere..." : "Speichern"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🚒 Allgemein</CardTitle>
          <CardDescription>
            Grundlegende Informationen zur Feuerwehr
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fire_department_name">Name der Feuerwehr</Label>
            <Input
              id="fire_department_name"
              value={settings.fire_department_name}
              onChange={(e) =>
                updateSetting("fire_department_name", e.target.value)
              }
              placeholder="z.B. Freiwillige Feuerwehr Musterstadt"
            />
            <p className="text-xs text-gray-500">
              Wird in E-Mails und Benachrichtigungen verwendet
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Kontrollen</CardTitle>
          <CardDescription>
            Intervalle und Fristen für Führerscheinkontrollen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="check_interval_months">
              Standard-Kontrollintervall
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="check_interval_months"
                type="number"
                min="1"
                max="24"
                className="w-24"
                value={settings.check_interval_months}
                onChange={(e) =>
                  updateSetting("check_interval_months", e.target.value)
                }
              />
              <span className="text-sm text-gray-600">Monate</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="reminder_weeks_before">
              1. Erinnerung vor Fälligkeit
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="reminder_weeks_before"
                type="number"
                min="1"
                max="12"
                className="w-24"
                value={settings.reminder_weeks_before}
                onChange={(e) =>
                  updateSetting("reminder_weeks_before", e.target.value)
                }
              />
              <span className="text-sm text-gray-600">Wochen</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder_weeks_before_2">
              2. Erinnerung vor Fälligkeit
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="reminder_weeks_before_2"
                type="number"
                min="1"
                max="12"
                className="w-24"
                value={settings.reminder_weeks_before_2}
                onChange={(e) =>
                  updateSetting("reminder_weeks_before_2", e.target.value)
                }
              />
              <span className="text-sm text-gray-600">Wochen</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🪪 Führerschein-Ablauf</CardTitle>
          <CardDescription>
            Warnung bei ablaufenden Führerscheinen (C/CE Klassen)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="license_expiry_warning_months">
              Vorwarnzeit Führerschein-Ablauf
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="license_expiry_warning_months"
                type="number"
                min="1"
                max="12"
                className="w-24"
                value={settings.license_expiry_warning_months}
                onChange={(e) =>
                  updateSetting("license_expiry_warning_months", e.target.value)
                }
              />
              <span className="text-sm text-gray-600">Monate</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔒 Datenschutz</CardTitle>
          <CardDescription>
            DSGVO-Einstellungen und Datenaufbewahrung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="photo_auto_delete_days">
              Fotos automatisch löschen nach
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="photo_auto_delete_days"
                type="number"
                min="7"
                max="365"
                className="w-24"
                value={settings.photo_auto_delete_days}
                onChange={(e) =>
                  updateSetting("photo_auto_delete_days", e.target.value)
                }
              />
              <span className="text-sm text-gray-600">Tagen</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="privacy_policy_version">
              Datenschutzerklärung Version
            </Label>
            <Input
              id="privacy_policy_version"
              className="w-32"
              value={settings.privacy_policy_version}
              onChange={(e) =>
                updateSetting("privacy_policy_version", e.target.value)
              }
              placeholder="z.B. 1.0"
            />
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end gap-2 rounded-lg border bg-white p-4 shadow-lg">
          <span className="flex-1 text-sm text-amber-600 flex items-center">
            ⚠️ Ungespeicherte Änderungen
          </span>
          <Button variant="outline" onClick={handleReset}>
            Zurücksetzen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Speichere..." : "Änderungen speichern"}
          </Button>
        </div>
      )}
    </div>
  );
}
