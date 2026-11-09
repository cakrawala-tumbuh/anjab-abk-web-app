"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import {
  ISIAN_PUTUSAN_KOSONG,
  OPSI_PUTUSAN,
  TINGKAT_KOREKSI,
  bodyPutusan,
  validasiPutusan,
  type GalatPutusan,
  type IsianPutusan,
} from "@/lib/ai-usulan";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link PutusanForm}. */
export interface PutusanFormProps {
  /** Id usulan yang diputus. */
  usulanId: string;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Form putusan reviewer atas satu usulan AI (`APPROVE`/`REVISE`/`REJECT`).
 *
 * Validasi klien mencerminkan kombinasi sah backend ({@link validasiPutusan}). Kirim lewat
 * `POST /api/v1/ai/usulan/{id}/putusan` dengan `Idempotency-Key` dari
 * `useIdempotencyKey().keyUntuk(body)`. Sukses hanya setelah 2xx, lalu data detail dimuat
 * ulang (`router.refresh()`); galat 409/422 backend ditampilkan sebagai pesan.
 *
 * @param props - Lihat {@link PutusanFormProps}.
 */
export function PutusanForm({ usulanId, accessToken }: PutusanFormProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [isian, setIsian] = useState<IsianPutusan>(ISIAN_PUTUSAN_KOSONG);
  const [galat, setGalat] = useState<GalatPutusan>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function ubah<K extends keyof IsianPutusan>(k: K, v: IsianPutusan[K]) {
    setIsian((p) => ({ ...p, [k]: v }));
  }

  async function kirim() {
    const salah = validasiPutusan(isian);
    setGalat(salah);
    setUmum(null);
    if (Object.keys(salah).length > 0) return;
    const body = bodyPutusan(isian);
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST("/api/v1/ai/usulan/{usulan_id}/putusan", {
        params: { path: { usulan_id: usulanId } },
        body,
        headers: headerIdempotencyKey(idem.keyUntuk(body)),
      });
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      setIsian(ISIAN_PUTUSAN_KOSONG);
      notifySukses("Putusan tercatat.");
      router.refresh();
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      setUmum(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  const pesan = (k: keyof IsianPutusan) =>
    galat[k] ? (
      <span role="alert" className="mt-1 block text-xs text-red-600">
        {galat[k]}
      </span>
    ) : null;

  return (
    <section aria-labelledby="putusan-judul" className="space-y-3">
      <h2 id="putusan-judul" className="text-base font-semibold">
        Putusan reviewer
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Putusan</span>
          <select
            value={isian.putusan}
            onChange={(e) => ubah("putusan", e.target.value as IsianPutusan["putusan"])}
            className={INPUT}
          >
            <option value="">Pilih putusan</option>
            {OPSI_PUTUSAN.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {pesan("putusan")}
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">
            Tingkat koreksi (REVISE dan REJECT)
          </span>
          <select
            value={isian.tingkat_koreksi}
            onChange={(e) =>
              ubah("tingkat_koreksi", e.target.value as IsianPutusan["tingkat_koreksi"])
            }
            className={INPUT}
          >
            <option value="">—</option>
            {TINGKAT_KOREKSI.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {pesan("tingkat_koreksi")}
        </label>
      </div>
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">
          Catatan (wajib untuk REJECT, minimal 5 karakter)
        </span>
        <textarea
          value={isian.catatan}
          onChange={(e) => ubah("catatan", e.target.value)}
          rows={3}
          maxLength={5000}
          className={INPUT}
        />
        {pesan("catatan")}
      </label>
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">
          Teks koreksi (wajib untuk REVISE)
        </span>
        <textarea
          value={isian.teks_koreksi}
          onChange={(e) => ubah("teks_koreksi", e.target.value)}
          rows={5}
          maxLength={20000}
          className={INPUT}
        />
        {pesan("teks_koreksi")}
      </label>
      <button
        type="button"
        disabled={loading}
        onClick={() => void kirim()}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Kirim putusan"}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
        </p>
      )}
    </section>
  );
}
