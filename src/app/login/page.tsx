"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [feuerwehrName, setFeuerwehrName] = useState("Feuerwehr");

  useEffect(() => {
    // Config und Init-Status parallel laden
    Promise.all([
      fetch("/api/auth/config")
        .then((r) => r.json())
        .then((d) => setFeuerwehrName(d.feuerwehrName || "Feuerwehr"))
        .catch(() => {}),
      fetch("/api/auth/check-init", { method: "POST" })
        .then((r) => r.json())
        .then((isInit) => {
          setInitialized(isInit);
          if (!isInit) setIsSetup(true);
        })
        .catch(() => setInitialized(true)),
    ]);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSetup ? "/api/auth/setup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benutzername: username, pin: password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Anmeldung fehlgeschlagen");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Verbindung zum Server fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  if (initialized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-foreground">
            {feuerwehrName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSetup ? "Erst-Einrichtung" : "Anmeldung"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Benutzername
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Benutzername"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1"
            >
              {isSetup ? "Neues Passwort" : "Passwort"}
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isSetup ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading
              ? "Wird geladen..."
              : isSetup
                ? "Admin erstellen"
                : "Anmelden"}
          </button>
        </form>

        {isSetup && (
          <p className="mt-4 text-xs text-muted-foreground text-center">
            Erstelle den ersten Administrator-Account für das Portal.
          </p>
        )}
      </div>
    </div>
  );
}
