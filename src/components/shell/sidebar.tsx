"use client";

import Link from "next/link";
import {
  BarChart3,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Clock,
  Database,
  DatabaseBackup,
  FileText,
  Gauge,
  LayoutDashboard,
  Scale,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Nama grup Tim Kajian (cermin `GRUP_TIM_KAJIAN` di auth.ts; tidak diimpor agar Client Component tidak menarik Auth.js). */
const GRUP_TIM_KAJIAN = "tim-kajian";

/** Nama grup pengisi sekolah (cermin `GRUP_SEKOLAH_PENGISI` di auth.ts). */
const GRUP_SEKOLAH_PENGISI = "sekolah-pengisi";

export type NavLink = { kind: "link"; href: string; label: string; icon: LucideIcon };
export type NavGroup = {
  kind: "group";
  href: string;
  label: string;
  icon: LucideIcon;
  items: ReadonlyArray<{ href: string; label: string }>;
};
export type NavEntry = NavLink | NavGroup;

export const MASTER_DATA_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/master-data/jenjang-pendidikan", label: "Jenjang Pendidikan" },
  { href: "/master-data/sekolah", label: "Sekolah" },
  { href: "/master-data/jabatan", label: "Jabatan" },
  { href: "/master-data/sme-panel", label: "SME Panel" },
  { href: "/master-data/mata-pelajaran", label: "Mata Pelajaran" },
  { href: "/master-data/dcs", label: "Instrumen DCS" },
  { href: "/master-data/wcp", label: "Instrumen WCP" },
  { href: "/master-data/task-inventory", label: "Instrumen TI" },
  { href: "/master-data/task-inventory/utilitas", label: "Utilitas Katalog TI" },
  { href: "/master-data/tugas-pokok", label: "Tugas Pokok" },
  { href: "/master-data/detil-tugas", label: "Detil Tugas" },
  { href: "/master-data/uraian-tugas", label: "Uraian Tugas" },
];

/**
 * Sub-item grup menu "Redesain Pekerjaan" (khusus grup `tim-kajian`). Diperluas oleh item
 * WEB berikutnya; item WEB-1 mengisinya Beranda dan Riwayat Perubahan.
 */
export const REDESAIN_TIM_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/redesain", label: "Beranda" },
  { href: "/redesain/kode-orang", label: "Kode Orang" },
  { href: "/redesain/cakupan-jabatan", label: "Cakupan 19 Jabatan" },
  { href: "/redesain/konteks", label: "Konteks" },
  { href: "/redesain/masalah", label: "Masalah" },
  { href: "/redesain/sesi", label: "Sesi Partisipasi" },
  { href: "/redesain/agenda-yayasan", label: "Agenda Yayasan" },
  { href: "/redesain/riwayat", label: "Riwayat Perubahan" },
];

/** Entri menu "Redesain Pekerjaan" — hanya ditambahkan untuk pengguna grup `tim-kajian`. */
const NAV_REDESAIN_TIM: NavGroup = {
  kind: "group",
  href: "/redesain",
  label: "Redesain Pekerjaan",
  icon: Compass,
  items: REDESAIN_TIM_ITEMS,
};

/**
 * Sub-item grup menu "Konfirmasi Redesain" (khusus grup `sekolah-pengisi`): daftar masalah
 * untuk diisi dan riwayat isian milik sendiri.
 */
export const REDESAIN_SEKOLAH_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/redesain-sekolah", label: "Daftar Masalah" },
  { href: "/redesain-sekolah/isian-saya", label: "Isian Saya" },
];

/** Entri menu "Konfirmasi Redesain" — hanya ditambahkan untuk pengguna grup `sekolah-pengisi`. */
const NAV_REDESAIN_SEKOLAH: NavGroup = {
  kind: "group",
  href: "/redesain-sekolah",
  label: "Konfirmasi Redesain",
  icon: ClipboardCheck,
  items: REDESAIN_SEKOLAH_ITEMS,
};

export const NAV_ADMIN: ReadonlyArray<NavEntry> = [
  { kind: "link", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { kind: "link", href: "/partisipan", label: "Partisipan", icon: Users },
  { kind: "link", href: "/task-inventory", label: "Task Inventory", icon: ClipboardList },
  { kind: "link", href: "/time-study", label: "Time Study", icon: Clock },
  { kind: "link", href: "/opm", label: "OPM", icon: BarChart3 },
  { kind: "link", href: "/dcs", label: "DCS", icon: Gauge },
  { kind: "link", href: "/wcp", label: "WCP", icon: Scale },
  {
    kind: "group",
    href: "/master-data",
    label: "Master Data",
    icon: Database,
    items: MASTER_DATA_ITEMS,
  },
  { kind: "link", href: "/backup", label: "Backup & Restore", icon: DatabaseBackup },
];

export const NAV_PARTISIPAN: ReadonlyArray<NavEntry> = [
  { kind: "link", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { kind: "link", href: "/kuesioner", label: "Kuesioner Saya", icon: FileText },
];

/**
 * Pilih daftar menu sidebar sesuai grup Authentik pengguna.
 *
 * Menu dasar: `NAV_ADMIN` bila punya "admin", selain itu `NAV_PARTISIPAN`. Bila punya
 * "tim-kajian", grup menu "Redesain Pekerjaan" ditambahkan di akhir; bila punya
 * "sekolah-pengisi", grup "Konfirmasi Redesain" (Daftar Masalah, Isian Saya) ditambahkan. Grup "admin" saja
 * TIDAK memunculkan menu redesain.
 *
 * @param groups - Klaim `groups` dari sesi.
 * @returns Daftar entri menu untuk `Sidebar`.
 */
export function navForGroups(groups: ReadonlyArray<string>): ReadonlyArray<NavEntry> {
  const dasar = groups.includes("admin") ? NAV_ADMIN : NAV_PARTISIPAN;
  const tambahan: NavEntry[] = [];
  if (groups.includes(GRUP_TIM_KAJIAN)) tambahan.push(NAV_REDESAIN_TIM);
  if (groups.includes(GRUP_SEKOLAH_PENGISI)) tambahan.push(NAV_REDESAIN_SEKOLAH);
  return tambahan.length > 0 ? [...dasar, ...tambahan] : dasar;
}

/** Item aktif = pathname persis sama, atau sub-route (`href` + `/...`). */
export function isActiveHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function linkClass(active: boolean, expanded: boolean) {
  return cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50",
    !expanded && "justify-center px-0",
  );
}

function NavList({
  entries,
  expanded,
  pathname,
  onNavigate,
}: {
  entries: ReadonlyArray<NavEntry>;
  expanded: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  const [terbuka, setTerbuka] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Grup yang rutenya sedang aktif otomatis terbuka.
    for (const entry of entries) {
      if (entry.kind === "group" && isActiveHref(pathname, entry.href)) {
        setTerbuka((prev) => (prev[entry.href] ? prev : { ...prev, [entry.href]: true }));
      }
    }
  }, [pathname, entries]);

  return (
    <>
      {entries.map((entry) => {
        const active = isActiveHref(pathname, entry.href);
        const Icon = entry.icon;

        if (entry.kind === "link") {
          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={linkClass(active, expanded)}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {expanded && <span>{entry.label}</span>}
            </Link>
          );
        }

        // Grup (Master Data): di mode rail, sub-item disembunyikan dan parent
        // jadi link langsung — tidak ada ruang untuk menampilkan sub-menu.
        if (!expanded) {
          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={linkClass(active, expanded)}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
            </Link>
          );
        }

        const masterDataOpen = terbuka[entry.href] ?? false;
        return (
          <div key={entry.href}>
            <button
              type="button"
              onClick={() => setTerbuka((prev) => ({ ...prev, [entry.href]: !prev[entry.href] }))}
              aria-expanded={masterDataOpen}
              className={cn(linkClass(active, expanded), "w-full justify-between")}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-5 shrink-0" aria-hidden />
                <span>{entry.label}</span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  masterDataOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {masterDataOpen && (
              <div className="mt-1 flex flex-col gap-1 border-l border-gray-200 pl-4 dark:border-gray-700">
                {entry.items.map((item) => {
                  const itemActive = isActiveHref(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={itemActive ? "page" : undefined}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-sm transition-colors",
                        itemActive
                          ? "text-primary-700 font-medium dark:text-primary-300"
                          : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

/**
 * Sidebar gaya Gmail: rail sempit (~72px, ikon saja) atau full (256px, ikon+label)
 * di layar md+ (dikontrol `expanded`, tombol hamburger di `TopBar`); di layar mobile
 * jadi drawer overlay penuh (dikontrol `mobileOpen` terpisah dari `expanded`).
 */
export function Sidebar({
  entries,
  expanded,
  mobileOpen,
  pathname,
  onNavigate,
}: {
  entries: ReadonlyArray<NavEntry>;
  expanded: boolean;
  mobileOpen: boolean;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className={cn(
          "hidden shrink-0 flex-col gap-1 border-r border-gray-200 bg-white py-3 transition-[width] duration-200 md:flex dark:border-gray-700 dark:bg-gray-900",
          expanded ? "w-64 px-3" : "w-[72px] items-center px-2",
        )}
      >
        <NavList
          entries={entries}
          expanded={expanded}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>

      <nav
        aria-label="Navigasi utama"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-1 border-r border-gray-200 bg-white px-3 py-3 transition-transform duration-200 md:hidden dark:border-gray-700 dark:bg-gray-900",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <NavList entries={entries} expanded pathname={pathname} onNavigate={onNavigate} />
      </nav>
    </>
  );
}
