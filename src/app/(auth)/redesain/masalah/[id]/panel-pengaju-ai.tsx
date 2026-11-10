"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { validasiPeriodeAi } from "@/lib/ai-usulan-konteks";
import { KODE_GALAT_SYARAT_F4, kodeSyaratF4, type SyaratF4 } from "@/lib/ai-usulan-masalah";
import { apiErrorDari, ApiError, type ApiResult } from "@/lib/api/errors";
import { petakanKonkurensi } from "@/lib/konkurensi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";

const INPUT =
  "w-40 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";

/** Hasil panggilan POST pengajuan: `data` terisi pada 202, `error` pada galat. */
export type HasilPengajuanAi = ApiResult & { data?: { id: string } };

/** Properti {@link PanelPengajuAi}. */
export interface PanelPengajuAiProps {
  /** Judul `<summary>` panel. */
  judul: string;
  /** Penjelasan singkat di dalam panel. */
  deskripsi: string;
  /** Teks tombol kirim. */
  labelTombol: string;
  /** Pesan notifikasi saat 202 (menyebut bahwa permintaan DITERIMA, bukan selesai). */
  pesanSukses: string;
  /** Nilai awal isian periode (`masalah.periode_acuan`). */
  periodeAwal: string;
  /** Bila true, tombol kirim dinonaktifkan (backend tetap penentu akhir). */
  nonaktif?: boolean;
  /** Teks penjelas yang tampil selagi tombol nonaktif. */
  alasanNonaktif?: string;
  /** Catatan tetap di bawah deskripsi (mis. peringatan fungsi belum diaktifkan). */
  catatan?: string;
  /** Isian tambahan di bawah periode (mis. dropdown usulan P06). */
  ekstra?: ReactNode;
  /**
   * Memanggil endpoint dengan periode yang sudah lolos validasi. Pemanggil memegang
   * `Idempotency-Key` (`keyUntuk(body)`) dan memanggil `perbarui()` setelah 2xx.
   */
  panggil: (periode: string) => Promise<HasilPengajuanAi>;
}

/**
 * Kerangka bersama panel pengaju fungsi AI per masalah (P05, P06, P07): isian periode
 * (diprefill, dapat disunting, divalidasi `validasiPeriodeAi`), tombol kirim dengan
 * dan tampilan hasil. `Idempotency-Key` dikelola komponen pemanggil (`useIdempotencyKey`).
 *
 * 202 -> notifikasi "diterima" plus tautan `/ai-usulan/{id}`; key diperbarui hanya setelah
 * 2xx. Galat tampil sebagai pesan backend apa adanya di `role="alert"`; untuk 409
 * `SYARAT_F4_BELUM_TERPENUHI` ditambah daftar kode syarat berlabel. Tanpa notifikasi sukses
 * pada galat.
 *
 * @param props - Lihat {@link PanelPengajuAiProps}.
 */
export function PanelPengajuAi({
  judul,
  deskripsi,
  labelTombol,
  pesanSukses,
  periodeAwal,
  ekstra,
  nonaktif = false,
  alasanNonaktif,
  catatan,
  panggil,
}: PanelPengajuAiProps) {
  const [periode, setPeriode] = useState(periodeAwal);
  const [galat, setGalat] = useState<string | null>(null);
  const [syarat, setSyarat] = useState<SyaratF4[]>([]);
  const [usulanId, setUsulanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function kirim() {
    const salah = validasiPeriodeAi(periode);
    setUsulanId(null);
    setSyarat([]);
    setGalat(salah);
    if (salah) return;
    setLoading(true);
    try {
      const res = await panggil(periode);
      if (!res.data) throw apiErrorDari(res);
      setUsulanId(res.data.id);
      notifySukses(pesanSukses);
    } catch (err) {
      const g = petakanKonkurensi(err, true);
      setGalat(pesanGagal(g));
      if (g instanceof ApiError && g.code === KODE_GALAT_SYARAT_F4) {
        setSyarat(kodeSyaratF4(g.details));
      }
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  return (
    <details className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <summary className="cursor-pointer font-medium">{judul}</summary>
      <div className="mt-3 space-y-3 text-sm">
        <p className="text-gray-600 dark:text-gray-400">{deskripsi}</p>
        {catatan && <p className="text-gray-600 dark:text-gray-400">{catatan}</p>}
        <label className="flex items-center gap-2">
          <span>Periode</span>
          <input
            type="text"
            value={periode}
            placeholder="2026/27"
            onChange={(e) => setPeriode(e.target.value)}
            className={INPUT}
          />
        </label>
        {ekstra}
        <button
          type="button"
          disabled={loading || nonaktif}
          onClick={() => void kirim()}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Mengirim…" : labelTombol}
        </button>
        {nonaktif && alasanNonaktif && <p>{alasanNonaktif}</p>}
        {galat && (
          <div role="alert" className="form-error space-y-1">
            <p>{galat}</p>
            {syarat.length > 0 && (
              <ul className="list-disc pl-5">
                {syarat.map((s, i) => (
                  <li key={`${s.kode}-${i}`}>
                    {s.label}
                    {s.label !== s.kode && (
                      <span className="ml-1 font-mono text-xs">({s.kode})</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {usulanId && (
          <p role="status">
            Permintaan diterima.{" "}
            <Link href={`/ai-usulan/${usulanId}`} className="text-blue-600 dark:text-blue-400">
              Buka usulan
            </Link>
          </p>
        )}
      </div>
    </details>
  );
}
