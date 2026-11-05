"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { NarasiSumberRead } from "@/lib/api/schema";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import {
  BATAS_TEKS,
  JENIS_SUMBER,
  KETERANGAN_IZIN_AI,
  LABEL_JENIS,
  bodySumber,
  galatField422,
  validasiSumber,
  type FieldSumber,
  type IsianSumber,
} from "@/lib/narasi-sumber";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link SumberForm}. */
export interface SumberFormProps {
  /** Sumber lama untuk mode revisi: isinya jadi nilai awal dan `id`-nya jadi `menggantikan_id`. */
  awal?: NarasiSumberRead;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Formulir sumber narasi baru (atau revisi).
 *
 * `POST /api/v1/narasi/sumber` dengan `Idempotency-Key` per upaya (`keyUntuk(body)`: isi
 * berubah → key baru; kirim ulang isi sama setelah gagal memakai key yang sama). Sukses
 * hanya ditampilkan setelah respons 2xx. `izin_ai` tercentang tanpa catatan tidak dikirim.
 * 422 backend dipetakan ke field. Tidak ada mode ubah: revisi selalu baris baru.
 *
 * @param props - Lihat {@link SumberFormProps}.
 */
export function SumberForm({ awal, accessToken }: SumberFormProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [isian, setIsian] = useState<IsianSumber>({
    judul: awal?.judul ?? "",
    jenis: awal?.jenis ?? "SINTETIS",
    versi: awal?.versi ?? "",
    periode: awal?.periode ?? "",
    teks: awal?.teks ?? "",
    izin_ai: awal?.izin_ai ?? false,
    izin_catatan: awal?.izin_catatan ?? "",
  });
  const [galat, setGalat] = useState<Partial<Record<FieldSumber, string>>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function ubah<K extends FieldSumber>(k: K, v: IsianSumber[K]) {
    setIsian((s) => ({ ...s, [k]: v }));
  }

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setUmum(null);
    const salah = validasiSumber(isian);
    setGalat(salah);
    if (Object.keys(salah).length > 0) return;
    setLoading(true);
    const body = bodySumber(isian, awal?.id);
    try {
      const res = await withServerAuth(accessToken).POST("/api/v1/narasi/sumber", {
        body,
        headers: headerIdempotencyKey(idem.keyUntuk(body)),
      });
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses(`Sumber "${res.data.judul}" disimpan.`);
      router.push(`/narasi/sumber/${res.data.id}`);
      router.refresh();
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      const perField = galatField422(g);
      setGalat(perField);
      setUmum(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  const pesan = (k: FieldSumber) =>
    galat[k] ? (
      <span role="alert" className="mt-1 block text-xs text-red-600">
        {galat[k]}
      </span>
    ) : null;

  return (
    <form onSubmit={kirim} className="space-y-3" noValidate>
      {awal && (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          Revisi dari sumber <span className="font-mono text-xs">{awal.id}</span>. Hasilnya adalah
          baris baru; sumber lama tidak diubah.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">
          <span className="block text-gray-600 dark:text-gray-400">Judul</span>
          <input
            value={isian.judul}
            onChange={(e) => ubah("judul", e.target.value)}
            maxLength={200}
            className={INPUT}
          />
          {pesan("judul")}
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Jenis</span>
          <select
            value={isian.jenis}
            onChange={(e) => ubah("jenis", e.target.value as IsianSumber["jenis"])}
            className={INPUT}
          >
            {JENIS_SUMBER.map((j) => (
              <option key={j} value={j}>
                {LABEL_JENIS[j]}
              </option>
            ))}
          </select>
          {pesan("jenis")}
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Versi</span>
          <input
            value={isian.versi}
            onChange={(e) => ubah("versi", e.target.value)}
            maxLength={50}
            placeholder="v1.0"
            className={INPUT}
          />
          {pesan("versi")}
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 dark:text-gray-400">Periode</span>
          <input
            value={isian.periode}
            onChange={(e) => ubah("periode", e.target.value)}
            maxLength={20}
            placeholder="2026/27"
            className={INPUT}
          />
          {pesan("periode")}
        </label>
      </div>

      <PeringatanPrivasi />
      <div className="text-sm">
        <label htmlFor="teks-sumber" className="block text-gray-600 dark:text-gray-400">
          Teks sumber
        </label>
        <textarea
          id="teks-sumber"
          value={isian.teks}
          onChange={(e) => ubah("teks", e.target.value)}
          rows={14}
          className={INPUT}
        />
        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
          {isian.teks.length.toLocaleString("id-ID")} / {BATAS_TEKS.toLocaleString("id-ID")}{" "}
          karakter
        </span>
        {pesan("teks")}
      </div>

      <div className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isian.izin_ai}
            onChange={(e) => ubah("izin_ai", e.target.checked)}
          />
          Izin pemakaian AI
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">{KETERANGAN_IZIN_AI}</p>
        {pesan("izin_ai")}
        {isian.izin_ai && (
          <label className="block text-sm">
            <span className="block text-gray-600 dark:text-gray-400">Dasar izin (wajib)</span>
            <textarea
              value={isian.izin_catatan}
              onChange={(e) => ubah("izin_catatan", e.target.value)}
              rows={3}
              className={INPUT}
            />
            {pesan("izin_catatan")}
          </label>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : awal ? "Simpan revisi" : "Simpan sumber"}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
        </p>
      )}
    </form>
  );
}
