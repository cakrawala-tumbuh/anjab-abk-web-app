"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  DISPOSISI,
  DISPOSISI_SEMUA,
  KETERANGAN_DISPOSISI,
  queryFilterKlarifikasi,
  type DisposisiKlarifikasi,
  type FilterKlarifikasi as FilterAktif,
} from "@/lib/narasi-klarifikasi";

const KONTROL =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800";

/**
 * Kontrol filter indeks klarifikasi: disposisi (bawaan `TERBUKA`) dan id kasus. Hanya mengubah
 * URL (`router.push`) dan selalu membuang `hlm`; data dibaca ulang Server Component.
 *
 * @param props.filter - Filter aktif dari `searchParams`.
 */
export function FilterKlarifikasi({ filter }: { filter: FilterAktif }) {
  const router = useRouter();
  const [narasi, setNarasi] = useState(filter.narasi_id ?? "");

  function dorong(f: FilterAktif) {
    const qs = queryFilterKlarifikasi(f);
    router.push(qs ? `/narasi/klarifikasi?${qs}` : "/narasi/klarifikasi");
  }

  function terapkan(e: FormEvent) {
    e.preventDefault();
    dorong({ disposition: filter.disposition, narasi_id: narasi.trim() || null });
  }

  return (
    <form
      onSubmit={terapkan}
      className="flex flex-wrap items-end gap-3"
      aria-label="Filter klarifikasi"
    >
      <label className="text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Disposisi</span>
        <select
          value={filter.disposition ?? DISPOSISI_SEMUA}
          onChange={(e) =>
            dorong({
              disposition:
                e.target.value === DISPOSISI_SEMUA
                  ? null
                  : (e.target.value as DisposisiKlarifikasi),
              narasi_id: narasi.trim() || null,
            })
          }
          className={KONTROL}
        >
          <option value={DISPOSISI_SEMUA}>Semua disposisi</option>
          {DISPOSISI.map((d) => (
            <option key={d} value={d}>
              {KETERANGAN_DISPOSISI[d]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="block text-gray-600 dark:text-gray-400">ID kasus narasi</span>
        <input
          value={narasi}
          onChange={(e) => setNarasi(e.target.value)}
          maxLength={36}
          className={KONTROL}
        />
      </label>
      <button type="submit" className={`${KONTROL} hover:bg-gray-100 dark:hover:bg-gray-700`}>
        Terapkan
      </button>
    </form>
  );
}
