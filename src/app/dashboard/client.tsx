"use client";

import { Header } from "@/components/header";
import { AppTileGrid } from "@/components/app-tile";

interface AuthUser {
  Benutzername: string;
  Rolle: string;
  KameradId: number | null;
  KameradName?: string;
  app_permissions: Record<string, string>;
}

export function DashboardClient({
  user,
  feuerwehrName,
}: {
  user: AuthUser;
  feuerwehrName: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} feuerwehrName={feuerwehrName} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Willkommen, {user.KameradName || user.Benutzername}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {feuerwehrName} — Digitales Portal
          </p>
        </div>
        <AppTileGrid permissions={user.app_permissions} />
      </main>
    </div>
  );
}
