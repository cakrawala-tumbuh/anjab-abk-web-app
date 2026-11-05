/**
 * Logika murni layar sumber narasi (Tim Kajian): kosakata isian, pembacaan filter dari
 * `searchParams`, validasi sisi klien, dan pemetaan 422 backend ke field.
 */
import { ApiError } from "@/lib/api/errors";

/** Batas karakter `teks` pada satu sumber narasi (cermin `BATAS_TEKS` backend). */
export const BATAS_TEKS = 200_000;

/** Jenis sumber yang sah pada tahap ini (K-3); nilai lain ditolak backend dengan 422. */
export const JENIS_SUMBER = ["SINTETIS", "DOKUMEN_RESMI"] as const;

/** Tipe nilai `jenis` sumber narasi. */
export type JenisSumber = (typeof JENIS_SUMBER)[number];

/** Label manusiawi tiap jenis sumber. */
export const LABEL_JENIS: Record<JenisSumber, string> = {
  SINTETIS: "Sintetis",
  DOKUMEN_RESMI: "Dokumen resmi",
};

/** Keterangan tetap di bawah kotak centang `izin_ai`: hanya catatan, tidak menyalakan AI. */
export const KETERANGAN_IZIN_AI =
  "Hanya catatan izin pemakaian. Mencentang ini tidak menyalakan AI dan tidak memicu pemrosesan apa pun.";

/** Filter daftar sumber yang sedang aktif; `null` = tidak difilter. */
export interface FilterSumber {
  jenis: JenisSumber | null;
  periode: string | null;
}

type NilaiQuery = string | string[] | undefined;

function pertama(v: NilaiQuery): string | null {
  const raw = Array.isArray(v) ? v[0] : v;
  const t = raw?.trim();
  return t ? t : null;
}

/**
 * Baca filter daftar sumber dari `searchParams`. `jenis` di luar kosakata diabaikan
 * (tidak pernah diteruskan ke backend); `periode` dipangkas dan dibatasi 20 karakter.
 *
 * @param sp - `searchParams` halaman.
 * @returns Filter aktif.
 */
export function bacaFilterSumber(sp: Record<string, NilaiQuery>): FilterSumber {
  const j = pertama(sp.jenis);
  const jenis = (JENIS_SUMBER as readonly string[]).includes(j ?? "") ? (j as JenisSumber) : null;
  const periode = pertama(sp.periode)?.slice(0, 20) ?? null;
  return { jenis, periode };
}

/** `true` bila ada filter yang aktif. */
export function adaFilterSumber(f: FilterSumber): boolean {
  return f.jenis !== null || f.periode !== null;
}

/** Isian formulir sumber (nilai teks mentah dari input). */
export interface IsianSumber {
  judul: string;
  jenis: JenisSumber;
  versi: string;
  periode: string;
  teks: string;
  izin_ai: boolean;
  izin_catatan: string;
}

/** Nama field formulir. */
export type FieldSumber = keyof IsianSumber;

/**
 * Validasi sisi klien. Aturan yang mengikat backend: `izin_ai` tercentang mewajibkan
 * `izin_catatan` berisi; semua field teks wajib dan `teks` ≤ {@link BATAS_TEKS}.
 *
 * @param i - Isian formulir.
 * @returns Peta field → pesan; kosong bila valid.
 */
export function validasiSumber(i: IsianSumber): Partial<Record<FieldSumber, string>> {
  const e: Partial<Record<FieldSumber, string>> = {};
  if (!i.judul.trim()) e.judul = "Judul wajib diisi.";
  if (!i.versi.trim()) e.versi = "Versi wajib diisi.";
  if (!i.periode.trim()) e.periode = "Periode wajib diisi.";
  if (!i.teks.trim()) e.teks = "Teks sumber wajib diisi.";
  else if (i.teks.length > BATAS_TEKS) e.teks = `Teks melebihi ${BATAS_TEKS} karakter.`;
  if (i.izin_ai && !i.izin_catatan.trim()) {
    e.izin_catatan = "Catatan izin wajib diisi bila izin AI dicentang.";
  }
  return e;
}

/**
 * Rakit body `POST /api/v1/narasi/sumber` dari isian. `izin_catatan` hanya dikirim bila
 * `izin_ai` tercentang; `menggantikan_id` hanya bila ada.
 *
 * @param i - Isian yang sudah lolos {@link validasiSumber}.
 * @param menggantikanId - ID sumber yang digantikan (mode revisi).
 */
export function bodySumber(i: IsianSumber, menggantikanId?: string | null) {
  return {
    judul: i.judul.trim(),
    jenis: i.jenis,
    versi: i.versi.trim(),
    periode: i.periode.trim(),
    teks: i.teks,
    izin_ai: i.izin_ai,
    izin_catatan: i.izin_ai ? i.izin_catatan.trim() : null,
    menggantikan_id: menggantikanId ?? null,
  };
}

/**
 * Petakan `details` 422 backend ke pesan per field (`loc` terakhir → `msg`). Detail tanpa
 * field yang dikenal diabaikan; pemanggil menampilkan pesan umum sebagai gantinya.
 *
 * @param err - Error hasil panggilan API.
 * @returns Peta field → pesan; kosong bila bukan 422 atau tak ada field dikenal.
 */
export function galatField422(err: unknown): Partial<Record<FieldSumber, string>> {
  const hasil: Partial<Record<FieldSumber, string>> = {};
  if (!(err instanceof ApiError) || err.status !== 422) return hasil;
  const dikenal = [
    "judul",
    "jenis",
    "versi",
    "periode",
    "teks",
    "izin_ai",
    "izin_catatan",
  ] as const;
  for (const d of err.details) {
    const { loc, msg } = d as { loc?: unknown; msg?: unknown };
    if (!Array.isArray(loc) || loc.length === 0) continue;
    const f = String(loc[loc.length - 1]);
    const nama = dikenal.find((k) => k === f);
    if (nama && !hasil[nama]) hasil[nama] = typeof msg === "string" ? msg : "Isian tidak valid.";
  }
  return hasil;
}
