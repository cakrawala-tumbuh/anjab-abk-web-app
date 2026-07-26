"use client";

import { useState, type FormEvent } from "react";
import { toApiError } from "@/lib/api/errors";
import { pesanGagal } from "@/lib/notify";
import type { RestoreResult } from "@/lib/api/schema";

/**
 * Formulir pemulihan basis data dari berkas cadangan `.dump`.
 *
 * Keputusan desain (lihat issue `cakrawala-tumbuh/anjab-abk-web-app#40`):
 * - UI SENGAJA TIDAK memvalidasi kecocokan nilai `konfirmasi` dan TIDAK menampilkan
 *   nilai yang benar — validasi murni terjadi di backend (`422` bila salah). Kalau UI
 *   menampilkan nilai yang benar, konfirmasi kehilangan gunanya sebagai pengaman.
 * - Tombol dikunci selama berkas atau konfirmasi kosong, DAN selama permintaan
 *   berjalan — pemulihan bisa memakan puluhan detik, dua klik ganda berarti dua
 *   `pg_restore` beruntun.
 * - Pesan error diambil APA ADANYA dari `ApiError.message` (envelope backend), yang
 *   backend rancang berbeda per status (`422` konfirmasi salah, `413` berkas terlalu
 *   besar, `403` bukan admin) — tidak ada pemetaan tambahan di sini yang perlu.
 */
export function PulihkanForm() {
  const [berkas, setBerkas] = useState<File | null>(null);
  const [konfirmasi, setKonfirmasi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasil, setHasil] = useState<RestoreResult | null>(null);

  const disabled = loading || !berkas || konfirmasi.trim().length === 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!berkas) return;

    setLoading(true);
    setError(null);
    setHasil(null);
    try {
      const formData = new FormData();
      formData.set("berkas", berkas);
      formData.set("konfirmasi", konfirmasi);

      const res = await fetch("/api/backup/pulihkan", { method: "POST", body: formData });
      const requestId = res.headers.get("x-request-id");
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw toApiError(body, requestId, res.status);
      }
      const data = (await res.json()) as RestoreResult;
      setHasil(data);
    } catch (err) {
      setError(pesanGagal(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        role="alert"
        className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
      >
        <strong>Peringatan:</strong> Memulihkan cadangan akan MENGGANTI SELURUH data yang tersimpan
        saat ini dengan isi berkas ini. Tindakan ini TIDAK BISA DIBATALKAN.
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {hasil && (
        <div
          role="status"
          className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
        >
          <p>Pemulihan berhasil (status: {hasil.status}).</p>
          {hasil.peringatan && hasil.peringatan.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {hasil.peringatan.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div>
        <label htmlFor="berkas" className="form-label">
          Berkas cadangan (.dump) <span aria-hidden>*</span>
        </label>
        <input
          id="berkas"
          type="file"
          accept=".dump"
          onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
          disabled={loading}
          className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:text-gray-300 dark:file:bg-gray-700 dark:file:text-gray-200"
        />
      </div>

      <div>
        <label htmlFor="konfirmasi" className="form-label">
          Ketik nama basis data tujuan untuk konfirmasi <span aria-hidden>*</span>
        </label>
        <input
          id="konfirmasi"
          type="text"
          value={konfirmasi}
          onChange={(e) => setKonfirmasi(e.target.value)}
          disabled={loading}
          autoComplete="off"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Memulihkan…" : "Pulihkan Basis Data"}
      </button>
    </form>
  );
}
