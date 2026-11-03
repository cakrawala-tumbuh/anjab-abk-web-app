/**
 * Label tampilan responden instrumen (WCP/DCS/OPM/Task Inventory).
 *
 * Nama responden tidak lagi keluar dari API (A6): responden diidentifikasi dengan
 * kode orang pseudonim (`O-nnnn`, sama dengan register redesain). Satu fungsi ini
 * dipakai seluruh halaman agar bentuk label seragam.
 */

/** Bentuk minimal responden yang dibutuhkan untuk membentuk label. */
export interface RespondenLabelInput {
  /** Kode orang pseudonim (`O-nnnn`); `null`/`undefined` untuk responden eksternal TI. */
  kode_orang?: string | null;
  /** ID responden; 8 karakter pertamanya dipakai untuk responden tanpa kode orang. */
  id: string;
}

/**
 * Membentuk label tampilan sebuah responden.
 *
 * @param r - Responden dengan `kode_orang` (boleh kosong) dan `id`.
 * @returns `kode_orang` apa adanya bila ada; bila tidak, `Responden eksternal`
 *   diikuti 8 karakter pertama `id`.
 * @example
 * labelResponden({ kode_orang: "O-0012", id: "wrsp_a1b2c3d4" }); // "O-0012"
 * labelResponden({ kode_orang: null, id: "tirs_ab12cd34ef" }); // "Responden eksternal tirs_ab1"
 */
export function labelResponden(r: RespondenLabelInput): string {
  if (r.kode_orang) return r.kode_orang;
  return `Responden eksternal ${r.id.slice(0, 8)}`;
}
