"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { PilihKodeOrang } from "@/components/pilih-kode-orang";
import { PESAN_KODE_ORANG_WAJIB } from "@/lib/redesain-kode-orang";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { PenilaianRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import {
  OPSI_PRIORITAS_FINAL,
  TEKS_PENCATAT_KEPUTUSAN,
  TEKS_PERINGATAN_PRATINJAU,
  hariIniWib,
  payloadPutuskan,
  perluPeringatanPratinjau,
  validasiKeputusan,
  type IsianKeputusan,
} from "@/lib/redesain-keputusan";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link DialogPutuskan}. */
export interface DialogPutuskanProps {
  /** Penilaian yang diputuskan (sumber `status_bukti`, `saran_otomatis`, dan nilai awal). */
  penilaian: PenilaianRead;
  accessToken: string | undefined;
}

/**
 * Tombol + dialog "Catat keputusan prioritas" (WEB-5b).
 *
 * Kelima field wajib (prioritas, alasan, kode orang pemutus, jabatan pemutus, tanggal ≤ hari
 * ini); tombol simpan nonaktif selama validasi klien gagal sehingga `putuskan` tidak
 * dipanggil. Bila kode orang pemutus satu-satunya yang kosong, pesan aplikasi
 * `PESAN_KODE_ORANG_WAJIB` tampil di dekat field (`aria-invalid` + `aria-describedby`)
 * menjelaskan mengapa simpan nonaktif; pesan bawaan browser tak pernah muncul.
 * Pratinjau peringatan PT-2 tampil bila P1–P3 dipilih pada bukti yang belum diperkuat, tanpa memblokir. Simpan → `POST /api/v1/redesain/penilaian/{id}/putuskan`;
 * 422 backend ditampilkan utuh (inline + toast). Peringatan resmi datang dari respons
 * setelah `router.refresh()`.
 *
 * @param props - Lihat {@link DialogPutuskanProps}.
 */
export function DialogPutuskan({ penilaian, accessToken }: DialogPutuskanProps) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [isian, setIsian] = useState<IsianKeputusan>({
    prioritas_final: penilaian.prioritas_final ?? "",
    alasan_final: "",
    pemutus_kode_orang: penilaian.pemutus_kode_orang ?? "",
    pemutus_jabatan: penilaian.pemutus_jabatan ?? "",
    tanggal_keputusan: hariIniWib(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const galat = validasiKeputusan(isian);
  const valid = Object.keys(galat).length === 0;
  const idGalatKode = useId();
  // Pesan kode orang tampil bila kode kosong dan itulah satu-satunya penghalang simpan
  // (tombol nonaktif tanpa penjelasan membingungkan); selain itu field lain yang dikerjakan dulu.
  const galatKode =
    !isian.pemutus_kode_orang && Object.keys(galat).every((k) => k === "pemutus_kode_orang");
  const ubah = (k: keyof IsianKeputusan, v: string) => setIsian((s) => ({ ...s, [k]: v }));

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/redesain/penilaian/{penilaian_id}/putuskan",
        { params: { path: { penilaian_id: penilaian.id } }, body: payloadPutuskan(isian) },
      );
      if (!res.data) throw apiErrorDari(res);
      notifySukses("Keputusan prioritas dicatat.");
      setBuka(false);
      router.refresh();
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
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Catat keputusan prioritas
      </button>
      {buka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Catat keputusan prioritas"
            className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 shadow-lg dark:bg-gray-900"
          >
            <h3 className="mb-1 text-base font-semibold">Catat keputusan prioritas</h3>
            <p className="mb-3 text-xs text-gray-500">{TEKS_PENCATAT_KEPUTUSAN}</p>
            <p className="mb-3 text-sm">
              Saran sistem: <strong>{penilaian.saran_otomatis ?? "—"}</strong>
            </p>
            <form onSubmit={simpan} className="space-y-3">
              <label className="block text-sm">
                <span className="block text-gray-600 dark:text-gray-400">Prioritas final</span>
                <select
                  aria-label="Prioritas final"
                  value={isian.prioritas_final}
                  onChange={(e) => ubah("prioritas_final", e.target.value)}
                  className={INPUT}
                >
                  <option value="">— pilih prioritas —</option>
                  {OPSI_PRIORITAS_FINAL.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
              {perluPeringatanPratinjau(isian.prioritas_final, penilaian.status_bukti) && (
                <p
                  role="alert"
                  data-testid="peringatan-pratinjau"
                  className="rounded-md bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                >
                  {TEKS_PERINGATAN_PRATINJAU}
                </p>
              )}
              <PeringatanPrivasi />
              <label className="block text-sm">
                <span className="block text-gray-600 dark:text-gray-400">Alasan keputusan</span>
                <textarea
                  aria-label="Alasan keputusan"
                  rows={3}
                  value={isian.alasan_final}
                  onChange={(e) => ubah("alasan_final", e.target.value)}
                  className={INPUT}
                />
              </label>
              <div className="text-sm">
                <span className="block text-gray-600 dark:text-gray-400">Kode orang pemutus</span>
                <PilihKodeOrang
                  name="pemutus_kode_orang"
                  value={isian.pemutus_kode_orang}
                  onChange={(v) => ubah("pemutus_kode_orang", v)}
                  wajib
                  invalid={galatKode}
                  describedBy={idGalatKode}
                  accessToken={accessToken}
                />
                {galatKode && (
                  <p id={idGalatKode} role="alert" className="form-error">
                    {PESAN_KODE_ORANG_WAJIB}
                  </p>
                )}
              </div>
              <label className="block text-sm">
                <span className="block text-gray-600 dark:text-gray-400">Jabatan pemutus</span>
                <input
                  aria-label="Jabatan pemutus"
                  value={isian.pemutus_jabatan}
                  onChange={(e) => ubah("pemutus_jabatan", e.target.value)}
                  className={INPUT}
                />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-600 dark:text-gray-400">Tanggal keputusan</span>
                <input
                  type="date"
                  aria-label="Tanggal keputusan"
                  max={hariIniWib()}
                  value={isian.tanggal_keputusan}
                  onChange={(e) => ubah("tanggal_keputusan", e.target.value)}
                  className={INPUT}
                />
              </label>
              {galat.tanggal_keputusan && isian.tanggal_keputusan && (
                <p role="alert" className="form-error">
                  {galat.tanggal_keputusan}
                </p>
              )}
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
                  {loading ? "Menyimpan…" : "Simpan keputusan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
