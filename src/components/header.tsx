"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Sun, Moon, Shield, Users, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";

interface AuthUser {
  Benutzername: string;
  Rolle: string;
  KameradId: number | null;
  KameradName?: string;
  app_permissions: Record<string, string>;
}

export function Header({
  user,
  feuerwehrName,
}: {
  user: AuthUser;
  feuerwehrName: string;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [time, setTime] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const isAdmin = user.Rolle === "Admin";

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo + Name */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <Shield className="h-5 w-5 text-red-600" />
            <span className="hidden sm:inline">{feuerwehrName}</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin/mitglieder"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                Mitglieder
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {time}
            </span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              {user.Benutzername}
              {isAdmin && (
                <span className="ml-1 text-red-500 font-medium">Admin</span>
              )}
            </span>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Theme wechseln"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-red-500"
              title="Abmelden"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1.5 rounded-md hover:bg-muted"
            >
              {menuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <nav className="md:hidden pb-3 border-t border-border pt-2 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="text-sm px-2 py-1 rounded hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin/mitglieder"
                className="text-sm px-2 py-1 rounded hover:bg-muted flex items-center gap-1"
                onClick={() => setMenuOpen(false)}
              >
                <Users className="h-4 w-4" />
                Mitglieder
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
