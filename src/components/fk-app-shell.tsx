"use client";

import { useFkUser } from "@/lib/fk-user-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const adminNav = [
  { href: "/fk/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fk/admin/mitglieder", label: "Mitglieder", icon: Users },
  { href: "/fk/admin/kontrollen", label: "Kontrollen", icon: ClipboardCheck },
  {
    href: "/fk/admin/fuehrerscheinklassen",
    label: "FS-Klassen",
    icon: CreditCard,
  },
  { href: "/fk/admin/einstellungen", label: "Einstellungen", icon: Settings },
];

const memberNav = [
  { href: "/fk/dashboard", label: "Mein Status", icon: LayoutDashboard },
  { href: "/fk/profil", label: "Mein Profil", icon: User },
];

export default function FkAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useFkUser();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNav : memberNav;

  return (
    <div className="flex min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-sidebar border-r border-sidebar-border transform transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 p-4 border-b">
          <span className="text-2xl">🚒</span>
          <div>
            <h1 className="font-bold text-sm leading-tight">Führerschein-</h1>
            <h1 className="font-bold text-sm leading-tight">kontrolle</h1>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
              {user?.name?.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {isAdmin && <Shield className="h-3 w-3" />}
                {isAdmin ? "Admin" : "Mitglied"}
              </p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Zum Portal
            </Button>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 p-4 border-b border-sidebar-border bg-sidebar">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg">🚒</span>
          <span className="font-bold text-sm flex-1">
            Führerscheinkontrolle
          </span>
          <ThemeToggle />
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>

        <footer className="py-6 text-center text-xs text-muted-foreground border-t">
          Führerscheinkontrolle
        </footer>
      </div>
    </div>
  );
}
