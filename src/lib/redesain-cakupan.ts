/**
 * Logika murni register CAKUPAN_19: kosakata isian dan penyusunan baris tampilan.
 */
import type { CakupanJabatanRead } from "@/lib/api/schema";

/** Cabang yang menjadi kolom tabel cakupan, berurutan. */
export const CABANG_CAKUPAN = ["Bandung", "Semarang"] as const;

/** Nilai kosakata `status_unit` (urutan sama dengan backend). */
export const STATUS_UNIT = [
  "Belum diperiksa",
  "Ada",
  "Tidak ada sesuai bukti",
  "Dilebur",
  "Diperselisihkan",
] as const;

/** Nilai kosakata `pemegang_diperiksa` / `inventori_ditinjau` / `peta_diperkuat`. */
export const TINGKAT_PEMERIKSAAN = [
  "Belum diperiksa",
  "Sebagian",
  "Ya",
  "Tidak relevan berdasarkan bukti",
] as const;

/** Satu baris tampilan: satu `role_kode` dengan sel per cabang (kosong bila tidak ada recordnya). */
export interface BarisCakupan {
  role_kode: string;
  nama_jabatan: string;
  sel: Record<(typeof CABANG_CAKUPAN)[number], CakupanJabatanRead | undefined>;
}

/**
 * Susun record cakupan (satu per role × cabang) menjadi satu baris per `role_kode`.
 *
 * Urutan baris mengikuti kemunculan pertama `role_kode` pada `items`; nama jabatan
 * diambil dari record pertama role tersebut.
 *
 * @param items - Seluruh record cakupan dari backend.
 * @returns Baris tampilan dengan sel `Bandung` dan `Semarang`.
 */
export function susunBarisCakupan(items: ReadonlyArray<CakupanJabatanRead>): BarisCakupan[] {
  const peta = new Map<string, BarisCakupan>();
  for (const rec of items) {
    let baris = peta.get(rec.role_kode);
    if (!baris) {
      baris = {
        role_kode: rec.role_kode,
        nama_jabatan: rec.nama_jabatan,
        sel: { Bandung: undefined, Semarang: undefined },
      };
      peta.set(rec.role_kode, baris);
    }
    baris.sel[rec.cabang] = rec;
  }
  return [...peta.values()];
}
