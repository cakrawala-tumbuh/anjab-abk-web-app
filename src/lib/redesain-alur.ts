/**
 * Logika murni bagian Alur pada detail masalah redesain: kosakata status langkah,
 * pengurutan langkah, dan penentuan asal koreksi.
 */
import type { KoreksiRead, LangkahRead } from "@/lib/api/schema";

/** Nilai kosakata `status_langkah` (urutan sama dengan backend). */
export const STATUS_LANGKAH = [
  "Hipotesis",
  "Keterangan kasus",
  "Diperkuat untuk klaim",
  "Diperselisihkan",
  "Tidak berlaku",
] as const;

/** Asal sebuah koreksi: dari konfirmasi sekolah atau ditulis Tim Kajian. */
export type AsalKoreksi = "Konfirmasi" | "Tim";

/**
 * Urutkan langkah menaik menurut `urutan` tanpa memutasi argumen.
 *
 * @param langkah - Langkah sebuah proses (urutan respons tidak dijamin).
 * @returns Salinan terurut; `kode` memutus seri secara deterministik.
 */
export function urutkanLangkah<T extends Pick<LangkahRead, "urutan" | "kode">>(langkah: T[]): T[] {
  return [...langkah].sort((a, b) => a.urutan - b.urutan || a.kode.localeCompare(b.kode));
}

/**
 * Urutkan koreksi menaik menurut `waktu` (ISO-8601) tanpa memutasi argumen.
 *
 * @param koreksi - Koreksi sebuah langkah.
 */
export function urutkanKoreksi(koreksi: KoreksiRead[]): KoreksiRead[] {
  return [...koreksi].sort((a, b) => a.waktu.localeCompare(b.waktu));
}

/**
 * Asal koreksi: "Konfirmasi" bila `konfirmasi_id` terisi, selain itu "Tim".
 *
 * @param k - Koreksi.
 */
export function asalKoreksi(k: Pick<KoreksiRead, "konfirmasi_id">): AsalKoreksi {
  return k.konfirmasi_id ? "Konfirmasi" : "Tim";
}

/**
 * Format `waktu` ISO menjadi `YYYY-MM-DD HH:MM` (tanpa zona; deterministik untuk tampilan).
 *
 * @param iso - Stempel waktu ISO-8601.
 */
export function formatWaktu(iso: string): string {
  return iso.replace("T", " ").slice(0, 16);
}
