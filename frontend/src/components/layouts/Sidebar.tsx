"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { apiGet } from "@/lib/api";
import type { Site, User } from "@/types/api";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  {
    href: "/sitios",
    label: "Sitios",
    icon: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    adminOnly: true,
    icon: [
      "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
      "M9 7a4 4 0 1 0 0 .01",
      "M23 21v-2a4 4 0 0 0-3-3.87",
      "M16 3.13a4 4 0 0 1 0 7.75",
    ],
  },
];

function NavIcon({ paths }: { paths: string[] }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number | undefined>>({});

  const links = NAV.filter((n) => !n.adminOnly || isAdmin);

  // Conteos junto a cada enlace. Se refrescan al navegar y cuando una vista
  // emite "rxpanel:data-changed" tras crear/editar/eliminar.
  useEffect(() => {
    let cancelled = false;
    async function loadCounts() {
      try {
        const sites = await apiGet<Site[]>("/sites/");
        if (!cancelled) setCounts((c) => ({ ...c, "/sitios": sites.length }));
      } catch {
        /* el conteo no es crítico: se omite ante un error */
      }
      if (isAdmin) {
        try {
          const users = await apiGet<User[]>("/users/");
          if (!cancelled) setCounts((c) => ({ ...c, "/usuarios": users.length }));
        } catch {
          /* idem */
        }
      }
    }
    loadCounts();
    window.addEventListener("rxpanel:data-changed", loadCounts);
    return () => {
      cancelled = true;
      window.removeEventListener("rxpanel:data-changed", loadCounts);
    };
  }, [isAdmin, pathname]);

  const content = (
    <>
      <div className="px-5 py-5">
        <span className="text-lg font-bold text-[var(--c-text)] tracking-tight">Rxpanel</span>
      </div>

      <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
        <p className="px-3 pt-1 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[var(--c-muted)]">
          Menú
        </p>
        {links.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          const count = counts[n.href];
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[0.625rem] text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--c-active-pill)] text-[var(--c-text)]"
                  : "text-[var(--c-text-sub)] hover:bg-[var(--c-hover)] hover:text-[var(--c-text)]"
              }`}
            >
              <NavIcon paths={n.icon} />
              <span className="flex-1">{n.label}</span>
              {count !== undefined && (
                <span
                  className={`min-w-[1.375rem] text-center text-[0.6875rem] font-semibold px-1.5 py-0.5 rounded-full ${
                    active
                      ? "bg-[var(--c-bg)] text-[var(--c-text-sub)]"
                      : "bg-[var(--c-active-pill)] text-[var(--c-muted)]"
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-[var(--c-line)] flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-[var(--c-active-pill)] flex items-center justify-center text-[0.8125rem] font-semibold text-[var(--c-text-sub)] shrink-0">
            {user?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.8125rem] font-medium text-[var(--c-text)] truncate">
              {user?.username}
            </p>
            <p className="text-[0.6875rem] text-[var(--c-muted)] capitalize">{user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={logout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[var(--c-border)] text-[0.8125rem] text-[var(--c-text-sub)] hover:border-[var(--c-text-sub)] hover:text-[var(--c-text)] transition-colors cursor-pointer bg-transparent"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5M21 12H9" />
            </svg>
            Cerrar sesión
          </button>
          <ThemeToggle />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Topbar móvil */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-[var(--c-border)] bg-[var(--c-bg)] shrink-0">
        <span className="text-base font-bold text-[var(--c-text)]">Rxpanel</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--c-border)] text-[var(--c-text-sub)] cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </header>

      {/* Sidebar desktop */}
      <aside
        className="hidden md:flex flex-col w-[var(--sidebar-w)] shrink-0 border-r border-[var(--c-border)] bg-[var(--c-bg)] h-dvh"
      >
        {content}
      </aside>

      {/* Drawer móvil */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/25" />
          <aside
            className="relative flex flex-col w-[16rem] max-w-[85vw] bg-[var(--c-bg)] border-r border-[var(--c-border)] h-dvh"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
