/**
 * Pembantu tampilan untuk register pengecualian TI–OPM dan nilai hasil OPM yang
 * boleh kosong (`null`). Murni (tanpa React) agar mudah diuji.
 */

/** Teks tampilan untuk nilai yang tidak ada — tak pernah diganti angka/"Tidak". */
export const NILAI_KOSONG = "—";

/** Peta kode `alasan` register pengecualian → label Indonesia. */
export const LABEL_ALASAN_PENGECUALIAN: Record<string, string> = {
  TI_DETAIL_UNMATCHED: "Tugas TI tidak ditemukan di katalog",
  OPM_STD_MISSING: "Nilai standar kosong",
  OPM_RATING_MISSING: "Belum ada rating",
};

/**
 * Terjemahkan kode `alasan` ke label Indonesia.
 *
 * @param kode - Kode alasan dari backend.
 * @returns Label Indonesia; kode yang tak dikenal dikembalikan apa adanya.
 */
export function labelAlasanPengecualian(kode: string): string {
  return LABEL_ALASAN_PENGECUALIAN[kode] ?? kode;
}

/**
 * Format angka desimal hasil OPM.
 *
 * @param nilai - Angka atau `null`/`undefined` bila tak ada rating.
 * @param digit - Jumlah angka di belakang koma.
 * @returns Teks angka, atau {@link NILAI_KOSONG} bila `nilai` tidak ada.
 */
export function formatAngkaOpm(nilai: number | null | undefined, digit = 2): string {
  return nilai == null ? NILAI_KOSONG : nilai.toFixed(digit);
}

/**
 * Teks lencana status verifikasi sesi.
 *
 * @param status - `UNVERIFIED` atau `VERIFIED`.
 * @param jumlah - Jumlah pengecualian pada sesi.
 * @returns Teks lencana untuk `UNVERIFIED`; `null` untuk `VERIFIED` (tanpa lencana).
 */
export function teksLencanaVerifikasi(status: string, jumlah: number): string | null {
  if (status !== "UNVERIFIED") return null;
  return `Belum terverifikasi (${jumlah} pengecualian)`;
}
