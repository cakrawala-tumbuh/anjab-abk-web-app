"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses } from "@/lib/notify";
import type { Galat } from "@/lib/riset";
import {
  BATAS_SIGNOFF,
  KONFIRMASI_SIGNOFF,
  formSignoff,
  formatUkuran,
  galatFieldSignoff,
  pesanGalatSignoff,
  validasiSignoff,
  type FieldSignoff,
} from "@/lib/riset-signoff";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link SignoffForm}. */
export interface SignoffFormProps {
  /** ID protokol `TERKUNCI` yang belum punya sign-off. */
  protokolId: string;
}

/**
 * Formulir pencatatan sign-off PI/etik (hanya dirender untuk protokol `TERKUNCI` tanpa
 * sign-off).
 *
 * Validasi klien (`validasiSignoff`) berjalan sebelum permintaan: berkas non-PDF atau > 5 MiB
 * ditolak TANPA request. Lolos → `confirm()` (sign-off tidak dapat diubah) → `POST
 * /api/riset/protokol/{id}/sign-off` (Route Handler; Bearer ditambahkan di server, token tidak
 * pernah di browser). Sukses hanya setelah 2xx, lalu `router.refresh()`. Galat 409/422/413
 * backend dipetakan ke pesan Indonesia (`pesanGalatSignoff`); 422 validasi per field ditampilkan
 * di bawah isian.
 *
 * @param props - Lihat {@link SignoffFormProps}.
 */
export function SignoffForm({ protokolId }: SignoffFormProps) {
  const router = useRouter();
  const [piNama, setPiNama] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [nomor, setNomor] = useState("");
  const [berkas, setBerkas] = useState<File | null>(null);
  const [galat, setGalat] = useState<Galat<FieldSignoff>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setUmum(null);
    const isian = {
      pi_nama: piNama,
      tanggal_persetujuan_etik: tanggal,
      nomor_persetujuan_etik: nomor,
      berkas,
    };
    const salah = validasiSignoff(isian);
    setGalat(salah);
    if (Object.keys(salah).length > 0 || !berkas) return;
    if (!window.confirm(KONFIRMASI_SIGNOFF)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/riset/protokol/${encodeURIComponent(protokolId)}/sign-off`, {
        method: "POST",
        body: formSignoff(isian, berkas),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw toApiError(body, res.headers.get("x-request-id"), res.status);
      }
      notifySukses("Sign-off PI/etik dicatat.");
      router.refresh();
    } catch (err) {
      setGalat(galatFieldSignoff(err));
      setUmum(pesanGalatSignoff(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  const pesan = (k: FieldSignoff) =>
    galat[k] ? (
      <span role="alert" className="mt-1 block text-xs text-red-600">
        {galat[k]}
      </span>
    ) : null;

  return (
    <form onSubmit={kirim} className="space-y-3" noValidate aria-label="Catat sign-off PI/etik">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Dicatat oleh ketua tim kajian sebagai PI (Principal Investigator). Sistem merekam akun
        pencatat dan nama PI yang Anda isi; sign-off tidak dapat diubah setelah disimpan.
      </p>
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Nama PI</span>
        <input
          value={piNama}
          onChange={(e) => setPiNama(e.target.value)}
          maxLength={BATAS_SIGNOFF.piNama}
          className={INPUT}
        />
        {pesan("pi_nama")}
      </label>
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">Tanggal persetujuan etik</span>
        <input
          type="date"
          value={tanggal}
          onChange={(e) => setTanggal(e.target.value)}
          className={INPUT}
        />
        {pesan("tanggal_persetujuan_etik")}
      </label>
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">
          Nomor persetujuan etik (opsional)
        </span>
        <input
          value={nomor}
          onChange={(e) => setNomor(e.target.value)}
          maxLength={BATAS_SIGNOFF.nomor}
          className={INPUT}
        />
        {pesan("nomor_persetujuan_etik")}
      </label>
      <label className="block text-sm">
        <span className="block text-gray-600 dark:text-gray-400">
          Berkas PDF persetujuan etik (maksimal 5 MiB)
        </span>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:text-gray-300 dark:file:bg-gray-700 dark:file:text-gray-200"
        />
        {berkas && (
          <span className="mt-1 block text-xs text-gray-500">
            {berkas.name} ({formatUkuran(berkas.size)})
          </span>
        )}
        {pesan("lampiran")}
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Simpan sign-off"}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
        </p>
      )}
    </form>
  );
}
