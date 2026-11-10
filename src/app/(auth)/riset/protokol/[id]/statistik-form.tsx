"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import {
  BATAS,
  bodyStatistik,
  galatField422,
  validasiStatistik,
  type Galat,
  type IsianStatistik,
} from "@/lib/riset";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";
const FIELD = ["nama_analisis", "keluaran", "kode_sumber_ref"] as const;
const AWAL: IsianStatistik = { nama_analisis: "", keluaran: "", kode_sumber_ref: "" };

/** Properti {@link StatistikForm}. */
export interface StatistikFormProps {
  /** ID protokol `TERKUNCI` tempat statistik dicatat. */
  protokolId: string;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Formulir statistik baru pada protokol `TERKUNCI`.
 *
 * `POST /api/v1/riset/protokol/{id}/statistik` dengan `Idempotency-Key` per upaya.
 * Sukses hanya setelah 2xx (isian dikosongkan, `router.refresh()`); 422 dipetakan ke
 * field, galat lain (mis. `PROTOKOL_BELUM_TERKUNCI`) tampil sebagai pesan backend.
 *
 * @param props - Lihat {@link StatistikFormProps}.
 */
export function StatistikForm({ protokolId, accessToken }: StatistikFormProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [isian, setIsian] = useState<IsianStatistik>(AWAL);
  const [galat, setGalat] = useState<Galat<keyof IsianStatistik>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function ubah(k: keyof IsianStatistik, v: string) {
    setIsian((s) => ({ ...s, [k]: v }));
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setUmum(null);
    const salah = validasiStatistik(isian);
    setGalat(salah);
    if (Object.keys(salah).length > 0) return;
    setLoading(true);
    const body = bodyStatistik(isian);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/riset/protokol/{protokol_id}/statistik",
        {
          params: { path: { protokol_id: protokolId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      setIsian(AWAL);
      notifySukses(`Statistik "${res.data.nama_analisis}" dicatat.`);
      router.refresh();
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      setGalat(galatField422(g, FIELD));
      setUmum(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  const pesan = (k: keyof IsianStatistik) =>
    galat[k] ? (
      <span role="alert" className="mt-1 block text-xs text-red-600">
        {galat[k]}
      </span>
    ) : null;

  return (
    <form onSubmit={kirim} className="space-y-3" noValidate aria-label="Tambah statistik">
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Nama analisis</span>
        <input
          value={isian.nama_analisis}
          onChange={(e) => ubah("nama_analisis", e.target.value)}
          maxLength={BATAS.namaAnalisis}
          className={INPUT}
        />
        {pesan("nama_analisis")}
      </label>
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Keluaran analisis</span>
        <textarea
          value={isian.keluaran}
          onChange={(e) => ubah("keluaran", e.target.value)}
          rows={8}
          className={`${INPUT} font-mono`}
        />
        {pesan("keluaran")}
      </label>
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">
          Rujukan kode sumber (skrip + commit)
        </span>
        <input
          value={isian.kode_sumber_ref}
          onChange={(e) => ubah("kode_sumber_ref", e.target.value)}
          maxLength={BATAS.kodeSumberRef}
          className={INPUT}
        />
        {pesan("kode_sumber_ref")}
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Simpan statistik"}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
        </p>
      )}
    </form>
  );
}
