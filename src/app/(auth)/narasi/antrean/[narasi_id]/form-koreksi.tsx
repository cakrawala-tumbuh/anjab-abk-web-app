"use client";

import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import type { NarasiSumberRingkas } from "@/lib/api/schema";
import { BASIS_RELATION, KETERANGAN_BASIS } from "@/lib/narasi-kasus";
import {
  BARIS_KOREKSI_BARU,
  type BarisSumberKoreksi,
  type GalatKoreksi,
  type IsianKoreksi,
} from "@/lib/narasi-tinjauan";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link FormKoreksi}. */
export interface FormKoreksiProps {
  /** Isian saat ini (state dimiliki induk agar bertahan saat versi dimuat ulang). */
  isian: IsianKoreksi;
  /** Dipanggil dengan isian baru setiap kali pengguna mengubah sesuatu. */
  onUbah: (baru: IsianKoreksi) => void;
  /** Galat validasi per bagian. */
  galat: GalatKoreksi;
  /** Pilihan sumber (data inti, dimuat penuh). */
  sumberOpsi: NarasiSumberRingkas[];
}

/**
 * Isian aksi `KOREKSI`: teks pengganti dan baris sumber (`sumber_id`, `source_span`,
 * `basis_relation`). Komponen terkendali tanpa state sendiri; tombol kirim ada di induk.
 *
 * @param props - Lihat {@link FormKoreksiProps}.
 */
export function FormKoreksi({ isian, onUbah, galat, sumberOpsi }: FormKoreksiProps) {
  function ubahBaris(idx: number, p: Partial<BarisSumberKoreksi>) {
    onUbah({ ...isian, sumber: isian.sumber.map((b, i) => (i === idx ? { ...b, ...p } : b)) });
  }

  return (
    <div className="space-y-3">
      <PeringatanPrivasi />
      <div className="text-sm">
        <label htmlFor="teks-koreksi" className="block text-gray-600 dark:text-gray-400">
          Teks koreksi
        </label>
        <textarea
          id="teks-koreksi"
          value={isian.teks}
          onChange={(e) => onUbah({ ...isian, teks: e.target.value })}
          rows={8}
          className={INPUT}
        />
        {galat.teks && (
          <span role="alert" className="mt-1 block text-xs text-red-600">
            {galat.teks}
          </span>
        )}
      </div>

      <fieldset className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
        <legend className="px-1 text-sm font-medium">Sumber koreksi</legend>
        {sumberOpsi.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Belum ada sumber narasi. Tambahkan sumber lebih dulu di menu Sumber Narasi.
          </p>
        )}
        {isian.sumber.map((b, idx) => (
          <div key={idx} className="grid gap-2 sm:grid-cols-[2fr_1fr_2fr_auto]">
            <label className="min-w-0 text-sm">
              <span className="block text-gray-600 dark:text-gray-400">Sumber {idx + 1}</span>
              <select
                value={b.sumber_id}
                onChange={(e) => ubahBaris(idx, { sumber_id: e.target.value })}
                className={INPUT}
              >
                <option value="">— pilih sumber —</option>
                {sumberOpsi.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.judul} ({s.versi}, {s.periode})
                  </option>
                ))}
              </select>
              {galat.baris?.[idx] && (
                <span role="alert" className="mt-1 block text-xs text-red-600">
                  {galat.baris[idx]}
                </span>
              )}
            </label>
            <label className="min-w-0 text-sm">
              <span className="block text-gray-600 dark:text-gray-400">Hubungan {idx + 1}</span>
              <select
                value={b.basis_relation}
                onChange={(e) =>
                  ubahBaris(idx, {
                    basis_relation: e.target.value as BarisSumberKoreksi["basis_relation"],
                  })
                }
                className={INPUT}
              >
                {BASIS_RELATION.map((r) => (
                  <option key={r} value={r}>
                    {r} — {KETERANGAN_BASIS[r]}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-sm">
              <span className="block text-gray-600 dark:text-gray-400">Kutipan {idx + 1}</span>
              <input
                value={b.source_span}
                onChange={(e) => ubahBaris(idx, { source_span: e.target.value })}
                className={INPUT}
              />
            </label>
            <button
              type="button"
              onClick={() => onUbah({ ...isian, sumber: isian.sumber.filter((_, i) => i !== idx) })}
              className="self-end rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
              aria-label={`Hapus sumber ${idx + 1}`}
            >
              Hapus
            </button>
          </div>
        ))}
        {galat.sumber && (
          <span role="alert" className="block text-xs text-red-600">
            {galat.sumber}
          </span>
        )}
        <button
          type="button"
          onClick={() => onUbah({ ...isian, sumber: [...isian.sumber, { ...BARIS_KOREKSI_BARU }] })}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          + Tambah sumber
        </button>
      </fieldset>
    </div>
  );
}
