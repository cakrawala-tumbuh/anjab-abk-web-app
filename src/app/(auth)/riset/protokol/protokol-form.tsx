"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import {
  BATAS,
  bodyProtokol,
  galatField422,
  validasiProtokol,
  type Galat,
  type IsianProtokol,
} from "@/lib/riset";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";
const FIELD = ["kode", "judul", "isi"] as const;

/** Properti {@link ProtokolForm}. */
export interface ProtokolFormProps {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Formulir protokol riset baru.
 *
 * `POST /api/v1/riset/protokol` dengan `Idempotency-Key` per upaya (`keyUntuk(body)`).
 * Sukses hanya setelah 2xx, lalu diarahkan ke detail (berstatus `DRAF`). 422 backend
 * dipetakan ke field; galat lain tampil sebagai pesan backend apa adanya.
 *
 * @param props - Lihat {@link ProtokolFormProps}.
 */
export function ProtokolForm({ accessToken }: ProtokolFormProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [isian, setIsian] = useState<IsianProtokol>({ kode: "", judul: "", isi: "" });
  const [galat, setGalat] = useState<Galat<keyof IsianProtokol>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function ubah(k: keyof IsianProtokol, v: string) {
    setIsian((s) => ({ ...s, [k]: v }));
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setUmum(null);
    const salah = validasiProtokol(isian);
    setGalat(salah);
    if (Object.keys(salah).length > 0) return;
    setLoading(true);
    const body = bodyProtokol(isian);
    try {
      const res = await withServerAuth(accessToken).POST("/api/v1/riset/protokol", {
        body,
        headers: headerIdempotencyKey(idem.keyUntuk(body)),
      });
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses(`Protokol "${res.data.kode}" disimpan sebagai draf.`);
      router.push(`/riset/protokol/${res.data.id}`);
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

  const pesan = (k: keyof IsianProtokol) =>
    galat[k] ? (
      <span role="alert" className="mt-1 block text-xs text-red-600">
        {galat[k]}
      </span>
    ) : null;

  return (
    <form onSubmit={kirim} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Kode</span>
          <input
            value={isian.kode}
            onChange={(e) => ubah("kode", e.target.value)}
            maxLength={BATAS.kode}
            placeholder="PROTOKOL-01"
            className={INPUT}
          />
          {pesan("kode")}
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Judul</span>
          <input
            value={isian.judul}
            onChange={(e) => ubah("judul", e.target.value)}
            maxLength={BATAS.judul}
            className={INPUT}
          />
          {pesan("judul")}
        </label>
      </div>
      <div className="text-sm">
        <label htmlFor="isi-protokol" className="block text-gray-600 dark:text-gray-400">
          Isi protokol
        </label>
        <textarea
          id="isi-protokol"
          value={isian.isi}
          onChange={(e) => ubah("isi", e.target.value)}
          rows={14}
          className={INPUT}
        />
        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
          {isian.isi.length.toLocaleString("id-ID")} / {BATAS.isi.toLocaleString("id-ID")} karakter
        </span>
        {pesan("isi")}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Simpan protokol"}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
        </p>
      )}
    </form>
  );
}
