/**
 * Logika murni cerita bebas pra-bank Tahap 1 Task Inventory (UX-01, saklar `PREBANK_FREEZE`).
 *
 * Dipisah dari komponen agar bisa diuji langsung tanpa DOM.
 */
import { ApiError } from "@/lib/api/errors";
import type { ExposureState } from "@/lib/api/schema";

/** Batas karakter teks cerita menurut kontrak backend (`CeritaPrabankUpsert.teks`). */
export const BATAS_CERITA = 20000;

/** Kode galat 409 dari simpan seleksi ketika paparan bank belum tercatat di backend. */
export const KODE_PAPARAN_BELUM_TERCATAT = "PAPARAN_BELUM_TERCATAT";

/** Pesan tetap untuk 409 {@link KODE_PAPARAN_BELUM_TERCATAT}. */
export const PESAN_PAPARAN_BELUM_TERCATAT =
  "Daftar tugas belum tercatat sebagai sudah ditampilkan. Muat ulang halaman ini, lalu coba lagi.";

/**
 * Apakah halaman harus menampilkan langkah cerita bebas (bank tugas belum boleh dimuat).
 *
 * @param saklarAktif - Status saklar `PREBANK_FREEZE`.
 * @param state - `exposure_state` dari `GET .../prabank`.
 * @returns `true` hanya bila saklar hidup dan responden belum terpapar.
 */
export function perluCeritaBebas(saklarAktif: boolean, state: ExposureState): boolean {
  return saklarAktif && state === "BELUM_TERPAPAR";
}

/**
 * Validasi teks cerita sebelum dikirim.
 *
 * @param teks - Isian textarea.
 * @returns Pesan galat, atau `null` bila sah.
 */
export function validasiCerita(teks: string): string | null {
  if (teks.trim().length === 0) return "Tuliskan cerita Anda terlebih dahulu.";
  if (teks.length > BATAS_CERITA) return `Cerita maksimal ${BATAS_CERITA} karakter.`;
  return null;
}

/**
 * Ganti pesan galat 409 `PAPARAN_BELUM_TERCATAT` dengan pesan yang menyuruh memuat ulang.
 *
 * @param err - Error hasil panggilan API.
 * @returns `ApiError` baru berpesan tetap bila cocok; `err` apa adanya bila tidak.
 */
export function petakanPaparanBelumTercatat(err: unknown): unknown {
  if (!(err instanceof ApiError) || err.code !== KODE_PAPARAN_BELUM_TERCATAT) return err;
  return new ApiError(
    { code: err.code, message: PESAN_PAPARAN_BELUM_TERCATAT, details: err.details },
    err.requestId,
    err.status,
  );
}
