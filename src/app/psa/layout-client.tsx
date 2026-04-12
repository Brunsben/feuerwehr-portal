"use client";

import { useState, createContext, useContext, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { PsaProvider } from "@/lib/psa-store";
import {
  LayoutDashboard,
  User,
  Shield,
  Users,
  History,
  Tag,
  BookOpen,
  AlertTriangle,
  BarChart3,
  FileText,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";

// ── User context ───────────────────────────────────────────────────────────

export interface PsaUserInfo {
  sub: string;
  psa_rolle: string;
  kamerad_id: number | null;
  kamerad_name?: string;
  canEdit: boolean;
  isAdmin: boolean;
}

const PsaUserContext = createContext<PsaUserInfo | null>(null);
export function usePsaUser() {
  const ctx = useContext(PsaUserContext);
  if (!ctx) throw new Error("usePsaUser must be within PsaLayoutClient");
  return ctx;
}

// ── Nav items ──────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  requireEdit?: boolean;
  requireAdmin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/psa", icon: LayoutDashboard },
  { label: "Mein Dashboard", href: "/psa/mein-dashboard", icon: User },
  {
    label: "Ausrüstung",
    href: "/psa/ausruestung",
    icon: Shield,
    requireEdit: true,
  },
  {
    label: "Kameraden",
    href: "/psa/kameraden",
    icon: Users,
    requireEdit: true,
  },
  { label: "Verlauf", href: "/psa/verlauf", icon: History, requireEdit: true },
  { label: "Typen", href: "/psa/typen", icon: Tag, requireEdit: true },
  { label: "Normen", href: "/psa/normen", icon: BookOpen, requireEdit: true },
  {
    label: "Warnungen",
    href: "/psa/warnungen",
    icon: AlertTriangle,
    requireEdit: true,
  },
  {
    label: "Statistiken",
    href: "/psa/statistiken",
    icon: BarChart3,
    requireEdit: true,
  },
  {
    label: "Changelog",
    href: "/psa/changelog",
    icon: FileText,
    requireAdmin: true,
  },
];

// ── Layout component ───────────────────────────────────────────────────────

export function PsaLayoutClient({
  user,
  feuerwehrName,
  children,
}: {
  user: PsaUserInfo;
  feuerwehrName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.requireAdmin && !user.isAdmin) return false;
    if (item.requireEdit && !user.canEdit) return false;
    return true;
  });

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <PsaUserContext.Provider value={user}>
      <PsaProvider>
        <div className="min-h-screen bg-background flex">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:flex lg:flex-col lg:w-56 bg-card border-r border-border">
            <div className="p-4 border-b border-border">
              <Link
                href="/dashboard"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
              >
                <ArrowLeft className="h-3 w-3" />
                Portal
              </Link>
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                PSA-Verwaltung
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {feuerwehrName}
              </p>
            </div>
            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      active
                        ? "bg-blue-500/10 text-blue-500 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-border space-y-2">
              <div className="text-xs text-muted-foreground">
                {user.sub}
                <span className="ml-1 text-blue-500 font-medium">
                  {user.psa_rolle}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-1.5 rounded-md hover:bg-muted"
                  title="Theme wechseln"
                >
                  {theme === "dark" ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-red-500"
                  title="Abmelden"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile top bar */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="lg:hidden sticky top-0 z-50 bg-card border-b border-border px-4 h-12 flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-md hover:bg-muted"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="font-semibold text-sm flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-blue-500" />
                PSA
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-red-500"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </header>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border lg:hidden flex flex-col">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-semibold text-foreground text-sm">
                      PSA-Verwaltung
                    </h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1 rounded-md hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                    {visibleNav.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                            active
                              ? "bg-blue-500/10 text-blue-500 font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="p-3 border-t border-border">
                    <Link
                      href="/dashboard"
                      onClick={() => setSidebarOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Zurück zum Portal
                    </Link>
                  </div>
                </aside>
              </>
            )}

            {/* Page Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </PsaProvider>
    </PsaUserContext.Provider>
  );
}
