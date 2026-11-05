"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  KETERANGAN_ANTREAN,
  STATUS_ANTREAN,
  queryFilterAntrean,
  type FilterAntrean as FilterAntreanAktif,
  type StatusAntrean,
} from "@/lib/narasi-antrean";

const KONTROL =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800";

/**
 * Kontrol filter antrean: status, instrumen, periode. Komponen ini hanya mengubah URL
 * (`router.push`) dan selalu membuang `hlm`; datanya dibaca ulang Server Component.
 * Status berubah langsung saat dipilih; instrumen dan periode berlaku lewat "Terapkan".
 *
 * @param props.filter - Filter aktif dari `searchParams`.
 */
export function FilterAntrean({ filter }: { filter: FilterAntreanAktif }) {
  const router = useRouter();
  const [instrumen, setInstrumen] = useState(filter.instrument_id ?? "");
  const [periode, setPeriode] = useState(filter.periode ?? "");

  function dorong(f: FilterAntreanAktif) {
    const qs = queryFilterAntrean(f);
    router.push(qs ? `/narasi/antrean?${qs}` : "/narasi/antrean");
  }

  function terapkan(e: FormEvent) {
    e.preventDefault();
    dorong({
      status: filter.status,
      instrument_id: instrumen.trim() || null,
      periode: periode.trim() || null,
    });
  }

  return (
    <form
      onSubmit={terapkan}
      className="flex flex-wrap items-end gap-3"
      aria-label="Filter antrean"
    >
      <label className="text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Status</span>
        <select
          value={filter.status ?? ""}
          onChange={(e) =>
            dorong({
              status: (e.target.value || null) as StatusAntrean | null,
              instrument_id: instrumen.trim() || null,
              periode: periode.trim() || null,
            })
          }
          className={KONTROL}
        >
          <option value="">Semua status</option>
          {STATUS_ANTREAN.map((s) => (
            <option key={s} value={s}>
              {s} — {KETERANGAN_ANTREAN[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Instrumen</span>
        <input
          value={instrumen}
          onChange={(e) => setInstrumen(e.target.value)}
          maxLength={50}
          className={KONTROL}
        />
      </label>
      <label className="text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Periode</span>
        <input
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          maxLength={20}
          placeholder="2026/27"
          className={KONTROL}
        />
      </label>
      <button type="submit" className={`${KONTROL} hover:bg-gray-100 dark:hover:bg-gray-700`}>
        Terapkan
      </button>
    </form>
  );
}
