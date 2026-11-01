"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PeringatanPrivasi } from "@/components/peringatan-privasi";
import { PilihKodeOrang } from "@/components/pilih-kode-orang";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { MasalahRead, SekolahRead } from "@/lib/api/schema";
import { notifyGagal, notifySukses } from "@/lib/notify";
import { OPSI_INDIKASI, OPSI_KESESUAIAN, OPSI_SKALA } from "@/lib/redesain-konfirmasi";
import {
  isianLuringKosong,
  payloadLuring,
  pesanGagalLuring,
  type IsianLuring,
} from "@/lib/redesain-konfirmasi-tim";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Properti {@link FormLuring}. */
export interface FormLuringProps {
  masalah: MasalahRead;
  sekolah: SekolahRead[];
  accessToken: string | undefined;
}

/**
 * Tombol + dialog "Catat isian luring": Tim memasukkan isian kertas atas nama pemberi
 * keterangan (sumber `luring`).
 *
 * Mengirim `POST /api/v1/redesain/konfirmasi/luring` dengan `masalah_id` terisi dan
 * `kode_orang` hasil `PilihKodeOrang`. Kelengkapan field wajib diputuskan backend:
 * 422 menyebut field yang kurang (inline + toast) dan dialog TIDAK ditutup. Sukses →
 * tutup dan `router.refresh()`.
 *
 * @param props - Lihat {@link FormLuringProps}.
 */
export function FormLuring({ masalah, sekolah, accessToken }: FormLuringProps) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [isian, setIsian] = useState<IsianLuring>(() =>
    isianLuringKosong(masalah.sekolah_id ?? ""),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ubah = (k: keyof IsianLuring, val: string) => setIsian((s) => ({ ...s, [k]: val }));

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await withServerAuth(accessToken).POST("/api/v1/redesain/konfirmasi/luring", {
        body: payloadLuring(masalah.id, isian),
      });
      if (!res.data) throw apiErrorDari(res);
      notifySukses("Isian luring dicatat.");
      setBuka(false);
      setIsian(isianLuringKosong(masalah.sekolah_id ?? ""));
      router.refresh();
    } catch (err) {
      setError(pesanGagalLuring(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  const teks = (k: keyof IsianLuring, label: string) => (
    <label className="block text-sm">
      <span className="block text-gray-600 dark:text-gray-400">{label}</span>
      <textarea
        aria-label={label}
        rows={2}
        value={isian[k]}
        onChange={(e) => ubah(k, e.target.value)}
        className={INPUT}
      />
    </label>
  );
  const pilih = (k: keyof IsianLuring, label: string, opsi: ReadonlyArray<string>) => (
    <label className="block text-sm">
      <span className="block text-gray-600 dark:text-gray-400">{label}</span>
      <select
        aria-label={label}
        value={isian[k]}
        onChange={(e) => ubah(k, e.target.value)}
        className={INPUT}
      >
        <option value="">— pilih —</option>
        {opsi.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Catat isian luring
      </button>
      {buka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Catat isian luring"
            className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 shadow-lg dark:bg-gray-900"
          >
            <h3 className="mb-3 text-base font-semibold">Catat isian luring</h3>
            <form onSubmit={simpan} className="space-y-3">
              <div className="text-sm">
                <span className="block text-gray-600 dark:text-gray-400">
                  Kode orang pemberi keterangan
                </span>
                <PilihKodeOrang
                  name="kode_orang"
                  value={isian.kode_orang}
                  onChange={(c) => ubah("kode_orang", c)}
                  wajib
                  accessToken={accessToken}
                />
              </div>
              <label className="block text-sm">
                <span className="block text-gray-600 dark:text-gray-400">Sekolah</span>
                <select
                  aria-label="Sekolah"
                  value={isian.sekolah_id}
                  onChange={(e) => ubah("sekolah_id", e.target.value)}
                  className={INPUT}
                >
                  <option value="">— pilih sekolah —</option>
                  {sekolah.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="block text-gray-600 dark:text-gray-400">Tanggal isian</span>
                <input
                  type="date"
                  aria-label="Tanggal isian"
                  value={isian.tanggal}
                  onChange={(e) => ubah("tanggal", e.target.value)}
                  className={INPUT}
                />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-600 dark:text-gray-400">Jabatan/peran</span>
                <input
                  aria-label="Jabatan/peran"
                  value={isian.peran}
                  onChange={(e) => ubah("peran", e.target.value)}
                  className={INPUT}
                />
              </label>
              <PeringatanPrivasi />
              {teks("cerita_sebelum", "Cerita")}
              {pilih("kesesuaian", "Kesesuaian dugaan", OPSI_KESESUAIAN)}
              {teks("koreksi", "Koreksi")}
              {pilih("k1", "K1", OPSI_SKALA)}
              {pilih("k2", "K2", OPSI_SKALA)}
              {pilih("k3", "K3", OPSI_SKALA)}
              {pilih("k4", "K4", OPSI_SKALA)}
              {teks("alasan_k", "Alasan K")}
              {pilih("indikasi_risiko", "Indikasi risiko", OPSI_INDIKASI)}
              {teks("bukti_dapat_diperiksa", "Bukti dapat diperiksa")}
              {teks("hal_belum_jelas", "Hal belum jelas")}
              {teks("masalah_baru", "Masalah baru")}
              {teks("catatan_independensi", "Catatan independensi")}
              {teks("catatan_akses", "Catatan akses")}
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
                  disabled={loading}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Menyimpan…" : "Simpan isian luring"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
