/**
 * Logika murni layar riset (Tim Kajian): kosakata status, filter daftar protokol dari
 * `searchParams`, validasi sisi klien tiga formulir (protokol, statistik, kasus negatif),
 * dan pemetaan 422 backend ke field. Batas panjang mencerminkan `openapi.json`.
 */
import { ApiError } from "@/lib/api/errors";
import type { StatusProtokol, StatusStatistik } from "@/lib/api/schema";

/** Nilai `status` protokol yang sah sebagai filter. */
export const STATUS_PROTOKOL = ["DRAF", "TERKUNCI"] as const;

/** Label manusiawi status protokol. */
export const LABEL_STATUS_PROTOKOL: Record<StatusProtokol, string> = {
  DRAF: "Draf",
  TERKUNCI: "Terkunci",
};

/** Label manusiawi status statistik. */
export const LABEL_STATUS_STATISTIK: Record<StatusStatistik, string> = {
  DRAF: "Draf",
  TERVERIFIKASI: "Terverifikasi",
};

/** Pola `kode` protokol (cermin backend): tanpa spasi. */
export const POLA_KODE = /^[A-Za-z0-9_.:-]+$/;

/** Batas panjang tiap field (cermin `openapi.json`). */
export const BATAS = {
  kode: 40,
  judul: 200,
  isi: 100_000,
  namaAnalisis: 200,
  keluaran: 200_000,
  kodeSumberRef: 500,
  ringkasan: 5_000,
  alasanNegatif: 5_000,
  sumberRef: 500,
} as const;

type NilaiQuery = string | string[] | undefined;

/**
 * Baca filter status daftar protokol dari `searchParams`. Nilai di luar kosakata
 * (`DRAF`/`TERKUNCI`) diabaikan dan tidak pernah diteruskan ke backend.
 *
 * @param sp - `searchParams` halaman.
 * @returns Status yang difilter, atau `null` bila tanpa filter.
 */
export function bacaFilterStatus(sp: Record<string, NilaiQuery>): StatusProtokol | null {
  const raw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const t = raw?.trim() ?? "";
  return (STATUS_PROTOKOL as readonly string[]).includes(t) ? (t as StatusProtokol) : null;
}

/** Peta field → pesan galat. */
export type Galat<F extends string> = Partial<Record<F, string>>;

/** Isian formulir protokol. */
export interface IsianProtokol {
  kode: string;
  judul: string;
  isi: string;
}

/**
 * Validasi formulir protokol: ketiga isian wajib, `kode` memakai pola tanpa spasi dan
 * dibatasi panjangnya.
 *
 * @param i - Isian formulir.
 * @returns Peta field → pesan; kosong bila valid.
 */
export function validasiProtokol(i: IsianProtokol): Galat<keyof IsianProtokol> {
  const e: Galat<keyof IsianProtokol> = {};
  const kode = i.kode.trim();
  if (!kode) e.kode = "Kode wajib diisi.";
  else if (kode.length > BATAS.kode) e.kode = `Kode maksimal ${BATAS.kode} karakter.`;
  else if (!POLA_KODE.test(kode)) {
    e.kode = "Kode hanya boleh huruf, angka, dan _ . : - (tanpa spasi).";
  }
  const judul = i.judul.trim();
  if (!judul) e.judul = "Judul wajib diisi.";
  else if (judul.length > BATAS.judul) e.judul = `Judul maksimal ${BATAS.judul} karakter.`;
  if (!i.isi.trim()) e.isi = "Isi protokol wajib diisi.";
  else if (i.isi.length > BATAS.isi) e.isi = `Isi melebihi ${BATAS.isi} karakter.`;
  return e;
}

/** Rakit body `POST /api/v1/riset/protokol` dari isian yang sudah valid. */
export function bodyProtokol(i: IsianProtokol) {
  return { kode: i.kode.trim(), judul: i.judul.trim(), isi: i.isi };
}

/** Isian formulir statistik. */
export interface IsianStatistik {
  nama_analisis: string;
  keluaran: string;
  kode_sumber_ref: string;
}

/**
 * Validasi formulir statistik: ketiga isian wajib tak kosong dan dalam batas panjang.
 *
 * @param i - Isian formulir.
 * @returns Peta field → pesan; kosong bila valid.
 */
export function validasiStatistik(i: IsianStatistik): Galat<keyof IsianStatistik> {
  const e: Galat<keyof IsianStatistik> = {};
  const nama = i.nama_analisis.trim();
  if (!nama) e.nama_analisis = "Nama analisis wajib diisi.";
  else if (nama.length > BATAS.namaAnalisis) {
    e.nama_analisis = `Nama analisis maksimal ${BATAS.namaAnalisis} karakter.`;
  }
  if (!i.keluaran.trim()) e.keluaran = "Keluaran wajib diisi.";
  else if (i.keluaran.length > BATAS.keluaran) {
    e.keluaran = `Keluaran melebihi ${BATAS.keluaran} karakter.`;
  }
  const ref = i.kode_sumber_ref.trim();
  if (!ref) e.kode_sumber_ref = "Rujukan kode sumber wajib diisi.";
  else if (ref.length > BATAS.kodeSumberRef) {
    e.kode_sumber_ref = `Rujukan maksimal ${BATAS.kodeSumberRef} karakter.`;
  }
  return e;
}

/** Rakit body `POST .../statistik` dari isian yang sudah valid. */
export function bodyStatistik(i: IsianStatistik) {
  return {
    nama_analisis: i.nama_analisis.trim(),
    keluaran: i.keluaran,
    kode_sumber_ref: i.kode_sumber_ref.trim(),
  };
}

/** Isian formulir kasus negatif. */
export interface IsianKasusNegatif {
  ringkasan: string;
  alasan_negatif: string;
  sumber_ref: string;
}

/**
 * Validasi formulir kasus negatif: `ringkasan` dan `alasan_negatif` wajib; `sumber_ref`
 * boleh kosong (dikirim `null`).
 *
 * @param i - Isian formulir.
 * @returns Peta field → pesan; kosong bila valid.
 */
export function validasiKasusNegatif(i: IsianKasusNegatif): Galat<keyof IsianKasusNegatif> {
  const e: Galat<keyof IsianKasusNegatif> = {};
  if (!i.ringkasan.trim()) e.ringkasan = "Ringkasan wajib diisi.";
  else if (i.ringkasan.length > BATAS.ringkasan) {
    e.ringkasan = `Ringkasan melebihi ${BATAS.ringkasan} karakter.`;
  }
  if (!i.alasan_negatif.trim()) e.alasan_negatif = "Alasan negatif wajib diisi.";
  else if (i.alasan_negatif.length > BATAS.alasanNegatif) {
    e.alasan_negatif = `Alasan melebihi ${BATAS.alasanNegatif} karakter.`;
  }
  if (i.sumber_ref.trim().length > BATAS.sumberRef) {
    e.sumber_ref = `Rujukan maksimal ${BATAS.sumberRef} karakter.`;
  }
  return e;
}

/** Rakit body `POST .../kasus-negatif`; `sumber_ref` kosong dikirim `null`. */
export function bodyKasusNegatif(i: IsianKasusNegatif) {
  const ref = i.sumber_ref.trim();
  return {
    ringkasan: i.ringkasan,
    alasan_negatif: i.alasan_negatif,
    sumber_ref: ref ? ref : null,
  };
}

/**
 * Petakan `details` 422 backend ke pesan per field (`loc` terakhir → `msg`). Hanya field
 * dalam `dikenal` yang dipetakan; sisanya diabaikan (pemanggil memakai pesan umum).
 *
 * @param err - Error hasil panggilan API.
 * @param dikenal - Nama field formulir yang boleh dipetakan.
 * @returns Peta field → pesan; kosong bila bukan 422 atau tak ada field dikenal.
 */
export function galatField422<F extends string>(err: unknown, dikenal: readonly F[]): Galat<F> {
  const hasil: Galat<F> = {};
  if (!(err instanceof ApiError) || err.status !== 422) return hasil;
  for (const d of err.details) {
    const { loc, msg } = d as { loc?: unknown; msg?: unknown };
    if (!Array.isArray(loc) || loc.length === 0) continue;
    const nama = dikenal.find((k) => k === String(loc[loc.length - 1]));
    if (nama && !hasil[nama]) hasil[nama] = typeof msg === "string" ? msg : "Isian tidak valid.";
  }
  return hasil;
}
