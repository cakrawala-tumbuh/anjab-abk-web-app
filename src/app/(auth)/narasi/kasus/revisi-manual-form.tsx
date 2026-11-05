"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { ApiError, apiErrorDari } from "@/lib/api/errors";
import type { NarasiSumberRingkas } from "@/lib/api/schema";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import {
  BASIS_RELATION,
  BATAS_TEKS_REVISI,
  KETERANGAN_BASIS,
  KODE_VERSI_BASI,
  bodyRevisi,
  revisiValid,
  validasiRevisi,
  type BarisSumberRevisi,
  type GalatRevisi,
  type IsianRevisi,
} from "@/lib/narasi-kasus";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

const BARIS_BARU: BarisSumberRevisi = { sumber_id: "", source_span: "", basis_relation: "DIRECT" };

/** Properti {@link RevisiManualForm}. */
export interface RevisiManualFormProps {
  /** Id kasus yang direvisi. */
  kasusId: string;
  /** Id versi terbaru yang dimuat halaman; `null` bila kasus belum punya versi. */
  supersedesId: string | null;
  /** Pilihan sumber (data inti, sudah dimuat penuh tanpa terpotong). */
  sumberOpsi: NarasiSumberRingkas[];
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Formulir revisi manual bersumber.
 *
 * `POST /api/v1/narasi/kasus/{id}/revisi` dengan `supersedes_id` = id versi terbaru yang
 * dimuat. Wajib `teks` dan minimal satu baris sumber. 409 `versi_basi` meminta memuat ulang
 * tanpa membuang teks yang sudah diketik: tombol "Muat ulang" memanggil `router.refresh()`
 * sehingga `supersedesId` baru mengalir lewat prop sementara isian tetap di state.
 *
 * @param props - Lihat {@link RevisiManualFormProps}.
 */
export function RevisiManualForm({
  kasusId,
  supersedesId,
  sumberOpsi,
  accessToken,
}: RevisiManualFormProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [isian, setIsian] = useState<IsianRevisi>({ teks: "", sumber: [{ ...BARIS_BARU }] });
  const [galat, setGalat] = useState<GalatRevisi>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [basi, setBasi] = useState(false);
  const [loading, setLoading] = useState(false);

  function ubahBaris(idx: number, p: Partial<BarisSumberRevisi>) {
    setIsian((s) => ({
      ...s,
      sumber: s.sumber.map((b, i) => (i === idx ? { ...b, ...p } : b)),
    }));
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setUmum(null);
    setBasi(false);
    const salah = validasiRevisi(isian);
    setGalat(salah);
    if (!revisiValid(salah)) return;
    setLoading(true);
    const body = bodyRevisi(isian, supersedesId);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/narasi/kasus/{narasi_id}/revisi",
        {
          params: { path: { narasi_id: kasusId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Revisi manual disimpan.");
      setIsian({ teks: "", sumber: [{ ...BARIS_BARU }] });
      router.refresh();
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      setBasi(g instanceof ApiError && g.code === KODE_VERSI_BASI);
      setUmum(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={kirim} className="space-y-3" noValidate>
      <PeringatanPrivasi />
      <div className="text-sm">
        <label htmlFor="teks-revisi" className="block text-gray-600 dark:text-gray-400">
          Teks revisi
        </label>
        <textarea
          id="teks-revisi"
          value={isian.teks}
          onChange={(e) => setIsian((s) => ({ ...s, teks: e.target.value }))}
          rows={10}
          className={INPUT}
        />
        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
          {isian.teks.length.toLocaleString("id-ID")} / {BATAS_TEKS_REVISI.toLocaleString("id-ID")}{" "}
          karakter
        </span>
        {galat.teks && (
          <span role="alert" className="mt-1 block text-xs text-red-600">
            {galat.teks}
          </span>
        )}
      </div>

      <fieldset className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
        <legend className="px-1 text-sm font-medium">Sumber</legend>
        {sumberOpsi.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Belum ada sumber narasi. Tambahkan sumber lebih dulu di menu Sumber Narasi.
          </p>
        )}
        {isian.sumber.map((b, idx) => (
          <div key={idx} className="grid gap-2 sm:grid-cols-[2fr_1fr_2fr_auto]">
            <label className="text-sm">
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
            <label className="text-sm">
              <span className="block text-gray-600 dark:text-gray-400">Hubungan {idx + 1}</span>
              <select
                value={b.basis_relation}
                onChange={(e) =>
                  ubahBaris(idx, {
                    basis_relation: e.target.value as BarisSumberRevisi["basis_relation"],
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
            <label className="text-sm">
              <span className="block text-gray-600 dark:text-gray-400">Kutipan {idx + 1}</span>
              <input
                value={b.source_span}
                onChange={(e) => ubahBaris(idx, { source_span: e.target.value })}
                className={INPUT}
              />
            </label>
            <button
              type="button"
              onClick={() =>
                setIsian((s) => ({ ...s, sumber: s.sumber.filter((_, i) => i !== idx) }))
              }
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
          onClick={() => setIsian((s) => ({ ...s, sumber: [...s.sumber, { ...BARIS_BARU }] }))}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          + Tambah sumber
        </button>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Simpan revisi"}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
          {basi && (
            <>
              {" "}
              Versi kasus sudah berubah sejak halaman dimuat. Teks yang Anda ketik tetap
              dipertahankan.{" "}
              <button type="button" onClick={() => router.refresh()} className="underline">
                Muat ulang versi terbaru
              </button>
            </>
          )}
        </p>
      )}
    </form>
  );
}
