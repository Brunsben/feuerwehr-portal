"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fkApiFetch } from "@/lib/fk-api-fetch";

export default function FkChangePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      setLoading(false);
      return;
    }

    try {
      const res = await fkApiFetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Ändern des Passworts.");
      } else {
        window.location.href = "/fk/datenschutz-einwilligung";
      }
    } catch (err) {
      console.error("Passwort ändern Fehler:", err);
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
            🔑
          </div>
          <CardTitle className="text-2xl">Passwort ändern</CardTitle>
          <CardDescription>
            Bitte wähle ein neues, sicheres Passwort (mind. 8 Zeichen).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Neues Passwort</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                placeholder="Mindestens 8 Zeichen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                placeholder="Passwort wiederholen"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? "Wird gespeichert..." : "Passwort ändern"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
