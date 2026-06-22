"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/master-data/jenjang-pendidikan", label: "Jenjang Pendidikan" },
  { href: "/master-data/sekolah", label: "Sekolah" },
  { href: "/master-data/jabatan", label: "Jabatan" },
  { href: "/master-data/sme-panel", label: "SME Panel" },
  { href: "/master-data/mata-pelajaran", label: "Mata Pelajaran" },
  { href: "/master-data/dcs", label: "Instrumen DCS" },
  { href: "/master-data/wcp", label: "Instrumen WCP" },
  { href: "/master-data/task-inventory", label: "Instrumen TI" },
];

export default function MasterDataLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Master Data</h1>
        <p className="page-subtext">Kelola data referensi yang digunakan di seluruh aplikasi.</p>
      </div>

      <nav
        className="flex gap-1 border-b border-gray-200 dark:border-gray-700"
        aria-label="Navigasi master data"
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
