"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { periodeValid } from "@/lib/redesain-alternatif";

/** Properti {@link PemilihPeriode}. */
export interface PemilihPeriodeProps {
  /** ID masalah; dipakai menyusun URL tujuan `?bagian=alternatif&periode=`. */
  masalahId: string;
  /** Periode yang sedang dimuat (format `YYYY/YY`). */
  periode: string;
}

/**
 * Pemilih periode kesiapan (tahun ajaran `YYYY/YY`).
 *
 * Mengubah periode menavigasi ulang halaman dengan `?periode=` sehingga matriks kesiapan
 * dan riwayat keputusan perubahan dimuat ulang oleh Server Component. Format yang salah
 * ditolak di klien dan tidak pernah dikirim ke backend.
 *
 * @param props - Lihat {@link PemilihPeriodeProps}.
 */
export function PemilihPeriode({ masalahId, periode }: PemilihPeriodeProps) {
  const router = useRouter();
  const [nilai, setNilai] = useState(periode);
  const [galat, setGalat] = useState<string | null>(null);

  function terapkan(e: React.FormEvent) {
    e.preventDefault();
    const bersih = nilai.trim();
    if (!periodeValid(bersih)) {
      setGalat("Format periode harus YYYY/YY, mis. 2026/27.");
      return;
    }
    setGalat(null);
    router.push(
      `/redesain/masalah/${masalahId}?bagian=alternatif&periode=${encodeURIComponent(bersih)}`,
    );
  }

  return (
    <form onSubmit={terapkan} className="flex flex-wrap items-end gap-2 text-sm">
      <label>
        <span className="block text-gray-600 dark:text-gray-400">Periode (tahun ajaran)</span>
        <input
          aria-label="Periode"
          value={nilai}
          placeholder="2026/27"
          onChange={(e) => setNilai(e.target.value)}
          className="w-32 rounded-md border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
        />
      </label>
      <button
        type="submit"
        className="rounded-md border border-gray-300 px-3 py-1 dark:border-gray-600"
      >
        Terapkan periode
      </button>
      {galat && (
        <p role="alert" className="form-error">
          {galat}
        </p>
      )}
    </form>
  );
}
