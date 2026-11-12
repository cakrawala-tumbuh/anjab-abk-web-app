/**
 * Logika murni panel metrik alur narasi (UX-13, Tim Kajian): rentang tanggal, filter
 * `narrative_kind`, dan pemformatan angka.
 *
 * Rentang tanggal inklusif dan dihitung dalam hari UTC, mencerminkan `periksa_rentang`
 * backend (`dari` > `sampai` atau lebih dari 366 hari ditolak). Klien menolaknya lebih dulu
 * agar permintaan tidak dikirim.
 */
import type { NarrativeKind } from "@/lib/api/schema";

/** Rentang terpanjang yang diterima backend, dalam hari (inklusif). */
export const MAKS_HARI_RENTANG = 366;

/** Panjang rentang bawaan (hari terakhir termasuk hari ini). */
export const HARI_RENTANG_BAWAAN = 30;

/** Tampilan metrik yang tidak punya penyebut (bukan 0%). */
export const TEKS_BELUM_ADA_DATA = "Belum ada data";

/** Nilai filter "tanpa saringan jenis narasi" pada URL dan `<select>`. */
export const KIND_SEMUA = "SEMUA";

/** Jenis narasi yang dapat disaring, beserta keterangan Indonesia. */
export const KETERANGAN_KIND: Record<NarrativeKind, string> = {
  F1_FORMAL: "F1 · Formal",
  F2_ACTUAL: "F2 · Aktual",
  F3_HANDOFF: "F3 · Serah terima",
  F4_ANALYTICAL: "F4 · Analitis",
  F5_RESEARCH: "F5 · Riset",
};

/** Urutan jenis narasi pada pilihan filter. */
export const DAFTAR_KIND = Object.keys(KETERANGAN_KIND) as NarrativeKind[];

/** Filter aktif panel metrik. */
export interface FilterMetrik {
  /** Tanggal awal inklusif `YYYY-MM-DD`. */
  dari: string;
  /** Tanggal akhir inklusif `YYYY-MM-DD`. */
  sampai: string;
  /** Jenis narasi, atau `null` untuk semua. */
  narrative_kind: NarrativeKind | null;
}

const POLA_TANGGAL = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Urai `YYYY-MM-DD` menjadi epoch milidetik UTC.
 *
 * @param nilai - Teks tanggal.
 * @returns Epoch ms awal hari UTC, atau `null` bila bukan tanggal kalender yang sah
 *   (mis. `2026-02-30`).
 */
export function uraiTanggal(nilai: string): number | null {
  const m = POLA_TANGGAL.exec(nilai);
  if (!m) return null;
  const [t, b, h] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(t, b - 1, h);
  const d = new Date(ms);
  if (d.getUTCFullYear() !== t || d.getUTCMonth() !== b - 1 || d.getUTCDate() !== h) return null;
  return ms;
}

/**
 * Format epoch milidetik UTC menjadi `YYYY-MM-DD`.
 *
 * @param ms - Epoch milidetik.
 */
export function formatTanggal(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Validasi rentang tanggal sebelum permintaan dikirim.
 *
 * @param dari - Tanggal awal `YYYY-MM-DD`.
 * @param sampai - Tanggal akhir `YYYY-MM-DD`.
 * @returns Pesan galat Indonesia, atau `null` bila rentang sah.
 */
export function validasiRentang(dari: string, sampai: string): string | null {
  const a = uraiTanggal(dari);
  const b = uraiTanggal(sampai);
  if (a === null || b === null) return "Isi kedua tanggal dengan format yang sah.";
  if (a > b) return "Tanggal awal tidak boleh melewati tanggal akhir.";
  const hari = Math.round((b - a) / 86_400_000) + 1;
  if (hari > MAKS_HARI_RENTANG) {
    return `Rentang paling panjang ${MAKS_HARI_RENTANG} hari (dipilih ${hari} hari).`;
  }
  return null;
}

/**
 * Rentang bawaan: {@link HARI_RENTANG_BAWAAN} hari terakhir, hari ini (UTC) termasuk.
 *
 * @param sekarang - Waktu acuan (disuntikkan agar teruji).
 */
export function rentangBawaan(sekarang: Date): { dari: string; sampai: string } {
  const hariIni = Date.UTC(
    sekarang.getUTCFullYear(),
    sekarang.getUTCMonth(),
    sekarang.getUTCDate(),
  );
  return {
    dari: formatTanggal(hariIni - (HARI_RENTANG_BAWAAN - 1) * 86_400_000),
    sampai: formatTanggal(hariIni),
  };
}

function satuNilai(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Baca filter metrik dari `searchParams`; yang kosong memakai {@link rentangBawaan}.
 * Nilai `narrative_kind` yang tak dikenal diperlakukan sebagai "semua".
 *
 * @param sp - `searchParams` halaman.
 * @param sekarang - Waktu acuan rentang bawaan.
 */
export function bacaFilterMetrik(
  sp: Record<string, string | string[] | undefined>,
  sekarang: Date,
): FilterMetrik {
  const bawaan = rentangBawaan(sekarang);
  const kind = satuNilai(sp.narrative_kind);
  return {
    dari: satuNilai(sp.dari) || bawaan.dari,
    sampai: satuNilai(sp.sampai) || bawaan.sampai,
    narrative_kind: DAFTAR_KIND.includes(kind as NarrativeKind) ? (kind as NarrativeKind) : null,
  };
}

/**
 * Rakit query string URL halaman metrik dari filter.
 *
 * @param f - Filter aktif.
 */
export function queryFilterMetrik(f: FilterMetrik): string {
  const p = new URLSearchParams({ dari: f.dari, sampai: f.sampai });
  if (f.narrative_kind) p.set("narrative_kind", f.narrative_kind);
  return p.toString();
}

/**
 * Format rasio 0-1 sebagai persen satu desimal berkoma (`0.3333` menjadi `33,3%`).
 *
 * @param nilai - Rasio, atau `null`/`undefined` bila penyebut 0.
 * @returns Teks persen; `null` menjadi {@link TEKS_BELUM_ADA_DATA}, BUKAN `0,0%`.
 */
export function formatPersen(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined) return TEKS_BELUM_ADA_DATA;
  return `${(nilai * 100).toFixed(1).replace(".", ",")}%`;
}

/**
 * Format jumlah menit (bilangan bulat berpemisah ribuan Indonesia; pecahan satu desimal).
 *
 * @param nilai - Menit, atau `null`/`undefined` bila belum ada.
 * @returns Teks "N menit"; `null` menjadi {@link TEKS_BELUM_ADA_DATA}.
 */
export function formatMenit(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined) return TEKS_BELUM_ADA_DATA;
  const teks = Number.isInteger(nilai)
    ? String(nilai).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : nilai.toFixed(1).replace(".", ",");
  return `${teks} menit`;
}
