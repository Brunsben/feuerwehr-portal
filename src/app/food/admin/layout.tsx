"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/food/admin", label: "Admin", icon: "🏠" },
  { href: "/food/admin/kitchen", label: "Küche", icon: "🍳" },
  { href: "/food/admin/weekly", label: "Wochenplan", icon: "📅" },
  { href: "/food/admin/stats", label: "Statistiken", icon: "📊" },
  { href: "/food/admin/history", label: "Historie", icon: "📋" },
];

export default function FoodAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-56 bg-card border-r border-border transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <h1 className="text-lg font-bold">🍽️ Essensverwaltung</h1>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/food/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-500/10 text-blue-500"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-2">
            <Link
              href="/food"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              → Touch-Ansicht
            </Link>
            <Link
              href="/dashboard"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Zurück zum Portal
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 p-4 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="font-bold">🍽️ Essensverwaltung</h1>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
