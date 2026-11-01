"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { KonfirmasiDaftarRead, KonteksRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link DialogAngkat}. */
export interface DialogAngkatProps {
  /** Konfirmasi `terkirim` ber-`masalah_baru` yang diangkat. */
  konfirmasi: KonfirmasiDaftarRead;
  konteks: KonteksRead[];
  accessToken: string | undefined;
}

/**
 * Tombol + dialog "Angkat masalah" dari `masalah_baru` sebuah konfirmasi.
 *
 * Isian: konteks dan rumusan hipotesis (keduanya wajib). Simpan →
 * `POST /api/v1/redesain/konfirmasi/{id}/angkat-masalah`; 201 → arahkan ke detail
 * masalah baru. Kegagalan (422/409) ditampilkan inline dan lewat `notifyGagal`; dialog
 * tetap terbuka.
 *
 * @param props - Lihat {@link DialogAngkatProps}.
 */
export function DialogAngkat({ konfirmasi, konteks, accessToken }: DialogAngkatProps) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [konteksId, setKonteksId] = useState("");
  const [rumusan, setRumusan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = konteksId !== "" && rumusan.trim() !== "";

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/redesain/konfirmasi/{konfirmasi_id}/angkat-masalah",
        {
          params: { path: { konfirmasi_id: konfirmasi.id } },
          body: { konteks_id: konteksId, rumusan_hipotesis: rumusan },
        },
      );
      if (!res.data) throw apiErrorDari(res);
      notifySukses("Masalah baru diangkat.");
      setBuka(false);
      router.push(`/redesain/masalah/${res.data.id}`);
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
      >
        Angkat masalah
      </button>
      {buka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Angkat masalah"
            className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 text-left font-normal whitespace-normal shadow-lg dark:bg-gray-900"
          >
            <h3 className="mb-1 text-base font-semibold">Angkat masalah baru</h3>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Masalah yang disebut sekolah: <em>{konfirmasi.masalah_baru}</em>
            </p>
            <form onSubmit={simpan} className="space-y-3">
              <label className="block text-sm">
                <span className="block text-gray-600 dark:text-gray-400">Konteks</span>
                <select
                  aria-label="Konteks"
                  value={konteksId}
                  onChange={(e) => setKonteksId(e.target.value)}
                  className={INPUT}
                >
                  <option value="">— pilih konteks —</option>
                  {konteks.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.kode} — {k.tema}
                    </option>
                  ))}
                </select>
              </label>
              <PeringatanPrivasi />
              <label className="block text-sm">
                <span className="block text-gray-600 dark:text-gray-400">Rumusan hipotesis</span>
                <textarea
                  aria-label="Rumusan hipotesis"
                  rows={3}
                  value={rumusan}
                  onChange={(e) => setRumusan(e.target.value)}
                  className={INPUT}
                />
              </label>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBuka(false)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!valid || loading}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Menyimpan…" : "Angkat masalah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
