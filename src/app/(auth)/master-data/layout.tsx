"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/master-data/jenjang-pendidikan", label: "Jenjang Pendidikan" },
  { href: "/master-data/sekolah", label: "Sekolah" },
  { href: "/master-data/jabatan", label: "Jabatan" },
  { href: "/master-data/mata-pelajaran", label: "Mata Pelajaran" },
  { href: "/master-data/dcs", label: "Instrumen DCS" },
  { href: "/master-data/wcp", label: "Instrumen WCP" },
];

export default function MasterDataLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Master Data</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kelola data referensi yang digunakan di seluruh aplikasi.
        </p>
      </div>

      <nav className="flex gap-1 border-b border-gray-200" aria-label="Navigasi master data">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
