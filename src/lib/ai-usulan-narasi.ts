/**
 * Logika murni pengajuan fungsi AI narasi oleh Tim Kajian: P01 ekstraksi dari sumber, P04 tanya
 * bukti atas kasus, dan P09 kritik versi draf. Badan permintaan dan validasi klien yang
 * mencerminkan batas backend.
 */
import type { components } from "@/lib/api/schema";

/** Badan `POST /api/v1/narasi/sumber/{sumber_id}/ekstraksi-ai`. */
export type BodyP01 = components["schemas"]["EkstraksiAiCreate"];
/** Badan `POST /api/v1/narasi/kasus/{narasi_id}/tanya-bukti-ai`. */
export type BodyP04 = components["schemas"]["TanyaBuktiAiCreate"];
/** Badan `POST /api/v1/narasi/kasus/{narasi_id}/kritik-ai`. */
export type BodyP09 = components["schemas"]["KritikAiCreate"];

/** Batas panjang `peran_ref` (cermin backend). */
export const PERAN_REF_MAKS = 100;
/** Pola `peran_ref` (cermin backend). */
export const POLA_PERAN_REF = /^[A-Za-z0-9_.:-]+$/;
/** Rentang panjang `klaim` setelah dipangkas. */
export const KLAIM_MIN = 5;
/** Batas atas panjang `klaim` setelah dipangkas. */
export const KLAIM_MAKS = 2000;
/** Rentang panjang `keputusan_terkait` setelah dipangkas. */
export const KEPUTUSAN_MIN = 5;
/** Batas atas panjang `keputusan_terkait` setelah dipangkas. */
export const KEPUTUSAN_MAKS = 500;

/**
 * Validasi kode peran konteks P01.
 *
 * @param peranRef - Teks mentah dari kotak isian.
 * @returns Pesan galat; `null` bila sah (wajib, maks {@link PERAN_REF_MAKS}, sesuai {@link POLA_PERAN_REF}).
 */
export function validasiPeranRef(peranRef: string): string | null {
  const t = peranRef.trim();
  if (t === "" || t.length > PERAN_REF_MAKS || !POLA_PERAN_REF.test(t)) {
    return "Peran harus kode tanpa spasi (huruf, angka, _ . : -).";
  }
  return null;
}

/**
 * Bangun body P01. Argumen harus sudah lolos {@link validasiPeranRef} dan `validasiPeriodeAi`.
 *
 * @param peranRef - Kode peran.
 * @param periode - Kode periode.
 * @returns Body bertipe kontrak backend, nilai dipangkas.
 */
export function bodyP01(peranRef: string, periode: string): BodyP01 {
  return { peran_ref: peranRef.trim(), periode: periode.trim() };
}

/**
 * Validasi isian P04.
 *
 * @param klaim - Klaim mentah.
 * @param keputusan - Keputusan terkait mentah.
 * @param jumlahSumber - Jumlah sumber terpilih.
 * @returns Pesan galat pertama yang ditemukan; `null` bila sah.
 */
export function validasiP04(klaim: string, keputusan: string, jumlahSumber: number): string | null {
  const k = klaim.trim().length;
  if (k < KLAIM_MIN || k > KLAIM_MAKS) {
    return `Klaim harus ${KLAIM_MIN}-${KLAIM_MAKS} karakter.`;
  }
  const d = keputusan.trim().length;
  if (d < KEPUTUSAN_MIN || d > KEPUTUSAN_MAKS) {
    return `Keputusan terkait harus ${KEPUTUSAN_MIN}-${KEPUTUSAN_MAKS} karakter.`;
  }
  if (jumlahSumber < 1) return "Pilih minimal satu sumber.";
  return null;
}

/**
 * Bangun body P04 (teks dipangkas).
 *
 * @param klaim - Klaim yang lolos {@link validasiP04}.
 * @param keputusan - Keputusan terkait yang lolos {@link validasiP04}.
 * @param sumberIds - Id sumber terpilih.
 * @returns Body bertipe kontrak backend.
 */
export function bodyP04(klaim: string, keputusan: string, sumberIds: string[]): BodyP04 {
  return { klaim: klaim.trim(), keputusan_terkait: keputusan.trim(), sumber_ids: sumberIds };
}

/**
 * Bangun body P09. Teks draf tidak pernah dikirim; server membacanya dari versi itu.
 *
 * @param versiId - Id versi yang ditampilkan di halaman tinjauan.
 * @returns Body bertipe kontrak backend.
 */
export function bodyP09(versiId: string): BodyP09 {
  return { narasi_versi_id: versiId };
}
