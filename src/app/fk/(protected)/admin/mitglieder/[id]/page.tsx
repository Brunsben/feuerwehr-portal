"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, Shield, User } from "lucide-react";
import { fkApiFetch } from "@/lib/fk-api-fetch";

interface LicenseClass {
  id: string;
  code: string;
  name: string;
  isExpiring: boolean;
  defaultCheckIntervalMonths: number;
}

interface LicenseEntry {
  licenseClassId: string;
  issueDate: string;
  expiryDate: string;
  checkIntervalMonths: number;
  restriction188: boolean;
}

interface MemberData {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  consentGiven: boolean;
  createdAt: string;
  memberLicenses: {
    id: string;
    licenseClassId: string;
    issueDate: string | null;
    expiryDate: string | null;
    checkIntervalMonths: number;
    restriction188: boolean;
    licenseClass: LicenseClass;
  }[];
  licenseChecks: {
    id: string;
    checkDate: string;
    checkType: string;
    result: string;
    nextCheckDue: string | null;
    notes: string | null;
  }[];
}

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [member, setMember] = useState<MemberData | null>(null);
  const [licenseClasses, setLicenseClasses] = useState<LicenseClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("member");
  const [isActive, setIsActive] = useState(true);
  const [licenses, setLicenses] = useState<LicenseEntry[]>([]);

  useEffect(() => {
    Promise.all([
      fkApiFetch(`/api/admin/members/${id}`).then((r) => {
        if (!r.ok) throw new Error("Mitglied nicht gefunden");
        return r.json();
      }),
      fkApiFetch("/api/license-classes").then((r) => r.json()),
    ])
      .then(([memberData, classes]) => {
        setMember(memberData);
        setLicenseClasses(classes);

        setName(memberData.name || "");
        setEmail(memberData.email || "");
        setDateOfBirth(memberData.dateOfBirth || "");
        setPhone(memberData.phone || "");
        setRole(memberData.role || "member");
        setIsActive(memberData.isActive ?? true);
        setLicenses(
          memberData.memberLicenses.map(
            (ml: MemberData["memberLicenses"][0]) => ({
              licenseClassId: ml.licenseClassId,
              issueDate: ml.issueDate || "",
              expiryDate: ml.expiryDate || "",
              checkIntervalMonths: ml.checkIntervalMonths || 6,
              restriction188: ml.restriction188 || false,
            }),
          ),
        );
      })
      .catch(() => {
        toast.error("Mitglied konnte nicht geladen werden");
        router.push("/fk/admin/mitglieder");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  function addLicense() {
    setLicenses([
      ...licenses,
      {
        licenseClassId: "",
        issueDate: "",
        expiryDate: "",
        checkIntervalMonths: 6,
        restriction188: false,
      },
    ]);
  }

  function removeLicense(index: number) {
    setLicenses(licenses.filter((_, i) => i !== index));
  }

  function updateLicense(
    index: number,
    field: keyof LicenseEntry,
    value: string | number | boolean,
  ) {
    const updated = [...licenses];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;

    if (field === "licenseClassId") {
      const cls = licenseClasses.find((c) => c.id === value);
      if (cls) {
        updated[index].checkIntervalMonths = cls.defaultCheckIntervalMonths;
      }
    }

    setLicenses(updated);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fkApiFetch(`/api/admin/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          dateOfBirth: dateOfBirth || null,
          phone: phone || null,
          role,
          isActive,
          licenses: licenses.filter((l) => l.licenseClassId),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Speichern");
      }

      toast.success("Mitglied aktualisiert");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      const res = await fkApiFetch(`/api/admin/members/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Fehler beim Deaktivieren");

      toast.success("Mitglied deaktiviert");
      router.push("/fk/admin/mitglieder");
    } catch {
      toast.error("Fehler beim Deaktivieren");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Lade Mitglied...</div>
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/fk/admin/mitglieder")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            {member.role === "admin" ? (
              <Shield className="h-6 w-6 text-red-600" />
            ) : (
              <User className="h-6 w-6 text-gray-600" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{member.name}</h2>
            <p className="text-sm text-gray-500">
              Mitglied seit{" "}
              {new Date(member.createdAt).toLocaleDateString("de-DE")}
              {member.consentGiven && (
                <Badge
                  variant="outline"
                  className="ml-2 text-xs text-green-600"
                >
                  DSGVO ✓
                </Badge>
              )}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Stammdaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Name, E-Mail und Rolle werden zentral im Portal verwaltet.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 opacity-70"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 opacity-70"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Geburtsdatum</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0171 12345678"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rolle</Label>
                <Input
                  value={role === "admin" ? "Admin" : "Mitglied"}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800 opacity-70"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={isActive ? "active" : "inactive"}
                  onValueChange={(v) => setIsActive(v === "active")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">✅ Aktiv</SelectItem>
                    <SelectItem value="inactive">❌ Deaktiviert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Führerscheinklassen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                        onValueChange={(v) =>
                          updateLicense(i, "licenseClassId", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Klasse wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {licenseClasses.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} {cls.isExpiring && "⏰"}
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
                    <div className="space-y-1">
                      <Label className="text-xs">Prüfintervall (Monate)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={24}
                        value={lic.checkIntervalMonths}
                        onChange={(e) =>
                          updateLicense(
                            i,
                            "checkIntervalMonths",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>
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
          </CardContent>
        </Card>

        {member.licenseChecks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Kontrollhistorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {member.licenseChecks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {new Date(check.checkDate).toLocaleDateString("de-DE")}
                      </span>
                      <span className="ml-2 text-gray-500">
                        {check.checkType === "in_person"
                          ? "👁️ Sichtkontrolle"
                          : "📷 Foto-Upload"}
                      </span>
                      {check.notes && (
                        <span className="ml-2 text-gray-400">
                          — {check.notes}
                        </span>
                      )}
                    </div>
                    <Badge
                      className={
                        check.result === "approved"
                          ? "bg-green-100 text-green-800"
                          : check.result === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                      }
                    >
                      {check.result === "approved"
                        ? "✅ Bestätigt"
                        : check.result === "rejected"
                          ? "❌ Abgelehnt"
                          : "⏳ Ausstehend"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            className="bg-red-600 hover:bg-red-700"
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Speichere..." : "Änderungen speichern"}
          </Button>

          <div className="flex-1" />

          <Button
            type="button"
            variant={confirmDelete ? "destructive" : "outline"}
            onClick={handleDelete}
            disabled={deleting}
            className={!confirmDelete ? "text-red-500 hover:text-red-700" : ""}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {confirmDelete
              ? deleting
                ? "Wird deaktiviert..."
                : "Wirklich deaktivieren?"
              : "Deaktivieren"}
          </Button>
        </div>
      </form>
    </div>
  );
}
