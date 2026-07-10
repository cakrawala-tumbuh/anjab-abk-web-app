"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { navForGroups, Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";

const RAIL_STORAGE_KEY = "anjab_sidebar_rail";

/**
 * Kerangka gaya Gmail untuk semua route terproteksi: top bar + sidebar + `<main>`.
 *
 * Dua state independen untuk tombol hamburger yang sama:
 * - `railExpanded` (desktop, md+): rail sempit (ikon) ↔ full (ikon+label), dipersist ke
 *   `localStorage` supaya pilihan pengguna bertahan antar kunjungan.
 * - `mobileOpen` (mobile, <md): drawer overlay, default tertutup, TIDAK dipersist —
 *   selalu mulai tertutup tiap kunjungan/navigasi.
 * Keduanya di-toggle bersamaan oleh satu tombol karena CSS (`md:`) yang menentukan mana
 * yang benar-benar terlihat pada lebar layar saat itu. Route aktif diturunkan dari
 * `usePathname()` — satu sumber kebenaran untuk highlight menu.
 */
export function AppShell({
  groups,
  username,
  children,
}: {
  groups: ReadonlyArray<string>;
  username?: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const entries = navForGroups(groups);
  const [railExpanded, setRailExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(RAIL_STORAGE_KEY);
    if (stored !== null) setRailExpanded(stored === "1");
  }, []);

  function toggleSidebar() {
    setRailExpanded((prev) => {
      const next = !prev;
      window.localStorage.setItem(RAIL_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
    setMobileOpen((prev) => !prev);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar username={username} onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar
          entries={entries}
          expanded={railExpanded}
          mobileOpen={mobileOpen}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
        {mobileOpen && (
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
          />
        )}
        <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
