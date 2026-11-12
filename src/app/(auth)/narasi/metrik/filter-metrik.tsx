"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  DAFTAR_KIND,
  KETERANGAN_KIND,
  KIND_SEMUA,
  queryFilterMetrik,
  validasiRentang,
  type FilterMetrik as FilterAktif,
} from "@/lib/narasi-metrik";
import type { NarrativeKind } from "@/lib/api/schema";

const KONTROL =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800";

/**
 * Pemilih rentang tanggal dan jenis narasi panel metrik. Rentang divalidasi di klien
 * (`dari` ≤ `sampai`, paling panjang 366 hari) SEBELUM navigasi, sehingga rentang yang pasti
 * ditolak backend tidak pernah dikirim. Hanya mengubah URL; data dibaca ulang Server Component.
 *
 * @param props.filter - Filter aktif dari `searchParams`.
 */
export function FilterMetrik({ filter }: { filter: FilterAktif }) {
  const router = useRouter();
  const [dari, setDari] = useState(filter.dari);
  const [sampai, setSampai] = useState(filter.sampai);
  const [kind, setKind] = useState<NarrativeKind | typeof KIND_SEMUA>(
    filter.narrative_kind ?? KIND_SEMUA,
  );
  const [galat, setGalat] = useState<string | null>(null);

  function terapkan(e: FormEvent) {
    e.preventDefault();
    const pesan = validasiRentang(dari, sampai);
    setGalat(pesan);
    if (pesan) return;
    router.push(
      `/narasi/metrik?${queryFilterMetrik({
        dari,
        sampai,
        narrative_kind: kind === KIND_SEMUA ? null : kind,
      })}`,
    );
  }

  return (
    <form onSubmit={terapkan} className="flex flex-wrap items-end gap-3" aria-label="Filter metrik">
      <label className="text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Dari</span>
        <input
          type="date"
          value={dari}
          onChange={(e) => setDari(e.target.value)}
          className={KONTROL}
        />
      </label>
      <label className="text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Sampai</span>
        <input
          type="date"
          value={sampai}
          onChange={(e) => setSampai(e.target.value)}
          className={KONTROL}
        />
      </label>
      <label className="text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Jenis narasi</span>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as NarrativeKind | typeof KIND_SEMUA)}
          className={KONTROL}
        >
          <option value={KIND_SEMUA}>Semua jenis</option>
          {DAFTAR_KIND.map((k) => (
            <option key={k} value={k}>
              {KETERANGAN_KIND[k]}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className={`${KONTROL} hover:bg-gray-100 dark:hover:bg-gray-700`}>
        Terapkan
      </button>
      {galat && (
        <p role="alert" className="w-full text-sm text-red-600">
          {galat}
        </p>
      )}
    </form>
  );
}
