"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import {
  BATAS,
  bodyKasusNegatif,
  galatField422,
  validasiKasusNegatif,
  type Galat,
  type IsianKasusNegatif,
} from "@/lib/riset";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";
const FIELD = ["ringkasan", "alasan_negatif", "sumber_ref"] as const;
const AWAL: IsianKasusNegatif = { ringkasan: "", alasan_negatif: "", sumber_ref: "" };

/** Properti {@link KasusNegatifForm}. */
export interface KasusNegatifFormProps {
  /** ID protokol `TERKUNCI` tempat kasus dicatat. */
  protokolId: string;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Formulir kasus negatif baru pada protokol `TERKUNCI`.
 *
 * `POST /api/v1/riset/protokol/{id}/kasus-negatif` dengan `Idempotency-Key` per upaya.
 * `sumber_ref` kosong dikirim `null`. Sukses hanya setelah 2xx (isian dikosongkan,
 * `router.refresh()`); galat backend tampil apa adanya.
 *
 * @param props - Lihat {@link KasusNegatifFormProps}.
 */
export function KasusNegatifForm({ protokolId, accessToken }: KasusNegatifFormProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [isian, setIsian] = useState<IsianKasusNegatif>(AWAL);
  const [galat, setGalat] = useState<Galat<keyof IsianKasusNegatif>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function ubah(k: keyof IsianKasusNegatif, v: string) {
    setIsian((s) => ({ ...s, [k]: v }));
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setUmum(null);
    const salah = validasiKasusNegatif(isian);
    setGalat(salah);
    if (Object.keys(salah).length > 0) return;
    setLoading(true);
    const body = bodyKasusNegatif(isian);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/riset/protokol/{protokol_id}/kasus-negatif",
        {
          params: { path: { protokol_id: protokolId } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      setIsian(AWAL);
      notifySukses("Kasus negatif dicatat.");
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

  const pesan = (k: keyof IsianKasusNegatif) =>
    galat[k] ? (
      <span role="alert" className="mt-1 block text-xs text-red-600">
        {galat[k]}
      </span>
    ) : null;

  return (
    <form onSubmit={kirim} className="space-y-3" noValidate aria-label="Tambah kasus negatif">
      <PeringatanPrivasi />
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Ringkasan kasus (tersamar)</span>
        <textarea
          value={isian.ringkasan}
          onChange={(e) => ubah("ringkasan", e.target.value)}
          rows={4}
          className={INPUT}
        />
        {pesan("ringkasan")}
      </label>
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Alasan negatif</span>
        <textarea
          value={isian.alasan_negatif}
          onChange={(e) => ubah("alasan_negatif", e.target.value)}
          rows={4}
          className={INPUT}
        />
        {pesan("alasan_negatif")}
      </label>
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Rujukan sumber (opsional)</span>
        <input
          value={isian.sumber_ref}
          onChange={(e) => ubah("sumber_ref", e.target.value)}
          maxLength={BATAS.sumberRef}
          className={INPUT}
        />
        {pesan("sumber_ref")}
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Simpan kasus negatif"}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
        </p>
      )}
    </form>
  );
}
