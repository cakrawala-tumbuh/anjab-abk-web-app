/**
 * Logika murni layar tinjauan narasi (Tim Kajian): kosakata empat aksi, validasi sisi klien,
 * perakitan body `POST /narasi/kasus/{id}/tinjauan`, dan teks bantu tampilan.
 *
 * Body tidak pernah memuat aktor: backend mengambilnya dari token.
 */
import type { AksiTinjauan, TinjauanCreate } from "@/lib/api/schema";
import { labelStatus, type BasisRelation } from "@/lib/narasi-kasus";

/** Kode galat 409 bila versi yang dilihat bukan lagi versi terbaru. */
export const KODE_VERSI_BASI = "versi_basi";

/** Kode galat 409 bila `TERIMA` dikirim atas versi tanpa teks. */
export const KODE_NARASI_TANPA_TEKS = "narasi_tanpa_teks";

/** Kode galat 409 bila kasus tidak (lagi) berada dalam antrean tinjauan. */
export const KODE_TIDAK_DALAM_ANTREAN = "narasi_tidak_dalam_antrean";

/** Panjang minimum `catatan` (setelah dipangkas) untuk `TOLAK` dan `BUTUH_SUMBER`. */
export const MIN_CATATAN = 5;

/** Aksi yang mewajibkan `catatan`. */
export const AKSI_WAJIB_CATATAN = [
  "TOLAK",
  "BUTUH_SUMBER",
] as const satisfies readonly AksiTinjauan[];

/** Label tombol tiap aksi (Bahasa Indonesia). */
export const LABEL_AKSI: Record<AksiTinjauan, string> = {
  TERIMA: "Terima",
  KOREKSI: "Koreksi",
  TOLAK: "Tolak",
  BUTUH_SUMBER: "Butuh sumber",
};

/** Baris sumber pada formulir koreksi (teks mentah dari input). */
export interface BarisSumberKoreksi {
  sumber_id: string;
  source_span: string;
  basis_relation: BasisRelation;
}

/** Isian formulir koreksi. */
export interface IsianKoreksi {
  teks: string;
  catatan: string;
  sumber: BarisSumberKoreksi[];
}

/** Baris sumber kosong untuk formulir koreksi. */
export const BARIS_KOREKSI_BARU: BarisSumberKoreksi = {
  sumber_id: "",
  source_span: "",
  basis_relation: "DIRECT",
};

/**
 * Validasi `catatan` untuk `TOLAK`/`BUTUH_SUMBER`.
 *
 * @param catatan - Isian mentah.
 * @returns Pesan galat, atau `null` bila sah.
 */
export function validasiCatatan(catatan: string): string | null {
  return catatan.trim().length >= MIN_CATATAN
    ? null
    : `Catatan wajib diisi, minimal ${MIN_CATATAN} karakter.`;
}

/** Galat per bagian formulir koreksi. */
export interface GalatKoreksi {
  teks?: string;
  sumber?: string;
  baris?: Record<number, string>;
}

/**
 * Validasi formulir koreksi: `teks` tidak kosong, minimal satu baris sumber, tiap baris
 * punya `sumber_id`.
 *
 * @param isian - Isian formulir.
 * @returns Galat per bagian; objek kosong bila sah.
 */
export function validasiKoreksi(isian: IsianKoreksi): GalatKoreksi {
  const g: GalatKoreksi = {};
  if (!isian.teks.trim()) g.teks = "Teks koreksi wajib diisi.";
  if (isian.sumber.length === 0) g.sumber = "Minimal satu sumber wajib diisi.";
  isian.sumber.forEach((b, i) => {
    if (!b.sumber_id) (g.baris ??= {})[i] = "Pilih sumber.";
  });
  return g;
}

/** `true` bila {@link validasiKoreksi} tidak menemukan galat. */
export function koreksiValid(g: GalatKoreksi): boolean {
  return !g.teks && !g.sumber && !g.baris;
}

/**
 * Rakit body tinjauan. `narasi_versi_id` selalu versi yang sedang ditampilkan; aktor tidak
 * pernah disertakan.
 *
 * @param aksi - Keputusan.
 * @param versiId - Id versi yang sedang ditampilkan.
 * @param catatan - Catatan mentah (dikirim bila tidak kosong setelah dipangkas).
 * @param koreksi - Isian koreksi; dipakai hanya untuk `KOREKSI`.
 */
export function bodyTinjauan(
  aksi: AksiTinjauan,
  versiId: string,
  catatan: string,
  koreksi?: IsianKoreksi,
): TinjauanCreate {
  const body: TinjauanCreate = { aksi, narasi_versi_id: versiId };
  const c = catatan.trim();
  if (c) body.catatan = c;
  if (aksi === "KOREKSI" && koreksi) {
    body.teks = koreksi.teks;
    body.sumber = koreksi.sumber.map((b) => ({
      sumber_id: b.sumber_id,
      source_span: b.source_span.trim() || null,
      basis_relation: b.basis_relation,
    }));
  }
  return body;
}

/**
 * Pesan sukses setelah keputusan tercatat. Menyebut status baru dari respons; tidak memakai
 * kata "rilis", "final", atau "fakta" untuk status yang hanya berarti diperiksa tim.
 *
 * @param keStatus - `ke_status` dari `NarasiEventRead`.
 */
export function pesanSelesaiTinjauan(keStatus: string): string {
  return `Keputusan tercatat. Status kasus sekarang: ${labelStatus(keStatus)}.`;
}

/**
 * Tampilkan nilai bebas (`unknown`) dari metadata AI sebagai teks: teks apa adanya, nilai
 * lain diserialisasi JSON berindentasi.
 *
 * @param nilai - Nilai dari respons.
 */
export function teksNilai(nilai: unknown): string {
  if (typeof nilai === "string") return nilai;
  return JSON.stringify(nilai, null, 2) ?? String(nilai);
}

/** `true` bila nilai bebas kosong (null, undefined, `[]`, `{}`, atau teks kosong). */
export function nilaiKosong(nilai: unknown): boolean {
  if (nilai === null || nilai === undefined || nilai === "") return true;
  if (Array.isArray(nilai)) return nilai.length === 0;
  if (typeof nilai === "object") return Object.keys(nilai as object).length === 0;
  return false;
}
