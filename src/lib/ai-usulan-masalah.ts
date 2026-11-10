/**
 * Logika murni pengajuan fungsi AI per masalah redesain (P05 Hipotesis proses, P06 Opsi
 * redesain, P07 Kartu keputusan): badan permintaan, penyaring usulan P06 yang diterima, dan
 * pembacaan kode syarat gerbang F4 dari galat 409 backend.
 */
import type { AiUsulanRingkas, PengajuanP05, PengajuanP06, PengajuanP07 } from "@/lib/api/schema";

/** Kode galat backend untuk gerbang F4 yang belum terpenuhi. */
export const KODE_GALAT_SYARAT_F4 = "SYARAT_F4_BELUM_TERPENUHI";

/** Label Indonesia kode syarat F4 yang dikenal; kode lain tampil mentah. */
export const LABEL_SYARAT_F4: Record<string, string> = {
  KLAIM_BELUM_TERVALIDASI: "Klaim belum tervalidasi",
  AUDIT_BUKTI_BELUM_MINIMAL: "Audit bukti belum mencapai minimum",
  BUKTI_DIPERSELISIHKAN: "Ada bukti yang diperselisihkan",
  ALTERNATIF_BELUM_ADA: "Belum ada alternatif redesain",
};

/** Satu syarat F4 yang belum terpenuhi. */
export interface SyaratF4 {
  /** Kode dari backend (`details[].code`). */
  kode: string;
  /** Label Indonesia bila dikenal, selain itu sama dengan `kode`. */
  label: string;
}

/**
 * Baca daftar syarat F4 yang belum terpenuhi dari `ApiError.details`.
 *
 * @param details - `details` galat 409 `SYARAT_F4_BELUM_TERPENUHI` (bentuk apa pun).
 * @returns Satu butir per elemen ber-`code` string; elemen tanpa `code` dan masukan yang
 *   bukan larik diabaikan sehingga hasilnya `[]`. Tidak pernah melempar.
 */
export function kodeSyaratF4(details: unknown): SyaratF4[] {
  if (!Array.isArray(details)) return [];
  const hasil: SyaratF4[] = [];
  for (const d of details) {
    if (typeof d !== "object" || d === null) continue;
    const kode = (d as Record<string, unknown>).code;
    if (typeof kode !== "string" || kode === "") continue;
    hasil.push({ kode, label: LABEL_SYARAT_F4[kode] ?? kode });
  }
  return hasil;
}

/**
 * Bangun body P05 (`.../hipotesis-proses-ai`).
 *
 * @param periode - Periode yang sudah lolos `validasiPeriodeAi`.
 * @returns Body bertipe kontrak backend.
 */
export function bodyP05(periode: string): PengajuanP05 {
  return { periode: periode.trim() };
}

/**
 * Bangun body P06 (`.../opsi-ai`).
 *
 * @param periode - Periode yang sudah lolos `validasiPeriodeAi`.
 * @returns Body bertipe kontrak backend.
 */
export function bodyP06(periode: string): PengajuanP06 {
  return { periode: periode.trim() };
}

/**
 * Bangun body P07 (`.../kartu-keputusan-ai`).
 *
 * @param periode - Periode yang sudah lolos `validasiPeriodeAi`.
 * @param usulanP06Id - Id usulan P06 terpilih; string kosong (pilihan "Tanpa usulan P06") -> `null`.
 * @returns Body bertipe kontrak backend.
 */
export function bodyP07(periode: string, usulanP06Id: string): PengajuanP07 {
  return { periode: periode.trim(), usulan_p06_id: usulanP06Id === "" ? null : usulanP06Id };
}

/**
 * Saring usulan P06 yang boleh dijadikan dasar P07: putusan terakhir `APPROVE` atau `REVISE`.
 *
 * @param usulan - Hasil pencarian usulan (fungsi P06, sasaran masalah).
 * @returns Usulan yang diterima reviewer; yang belum diputus atau `REJECT` dibuang.
 */
export function usulanP06Diterima(usulan: readonly AiUsulanRingkas[]): AiUsulanRingkas[] {
  return usulan.filter((u) => {
    const p = u.putusan_terakhir?.putusan;
    return p === "APPROVE" || p === "REVISE";
  });
}
