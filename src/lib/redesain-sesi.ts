/**
 * Logika murni register Sesi partisipasi redesain: kosakata isian, pembacaan filter dari
 * `searchParams`, perakitan domain `POST .../sesi/search`, dan format menit rekap.
 */
import type { MasalahRead, KonteksRead } from "@/lib/api/schema";

/** Nilai kosakata `jenis_kegiatan` (urutan sama dengan backend). */
export const JENIS_KEGIATAN = [
  "Klarifikasi",
  "Serah terima",
  "Telaah sumber",
  "Pemeriksaan pimpinan",
  "Forum bersama",
  "Telaah yayasan",
  "Lainnya",
] as const;

/** Nilai kosakata `status_izin` (informasi saja; tidak pernah memblokir). */
export const STATUS_IZIN = [
  "Belum ditetapkan",
  "Sudah sesuai izin",
  "Perlu peninjauan izin",
  "Tidak diotorisasi",
] as const;

/** Pesan saat pasangan `kode_sesi`+`kode_orang` sudah ada (HTTP 409). */
export const PESAN_SESI_GANDA = "Orang ini sudah tercatat di sesi tersebut";

/** Teks tetap di halaman sesi dan rekap. */
export const TEKS_BUKAN_TIME_STUDY = "Catatan ini BUKAN Time Study";

/** Teks tetap di samping field status izin. */
export const TEKS_STATUS_IZIN_INFORMASI =
  "Status izin hanya informasi; tidak menghalangi pencatatan";

type NilaiQuery = string | string[] | undefined;

/** Filter register sesi; `null` = tidak difilter. */
export interface FilterSesi {
  kodeSesi: string | null;
  kodeOrang: string | null;
  jenisKegiatan: string | null;
  statusIzin: string | null;
}

function satu(value: NilaiQuery): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const t = raw?.trim();
  return t ? t : null;
}

/**
 * Baca filter sesi dari `searchParams` (`?sesi=`, `?orang=`, `?jenis=`, `?izin=`).
 *
 * @param sp - `searchParams` Next.js apa adanya.
 */
export function bacaFilterSesi(sp: Record<string, NilaiQuery>): FilterSesi {
  return {
    kodeSesi: satu(sp.sesi),
    kodeOrang: satu(sp.orang),
    jenisKegiatan: satu(sp.jenis),
    statusIzin: satu(sp.izin),
  };
}

/** Satu kondisi domain `[field, "=", value]`. */
export type DomainSesiTerm = [string, "=", string];

/**
 * Rakit {@link FilterSesi} menjadi domain `POST /api/v1/redesain/sesi/search`.
 *
 * @param f - Filter aktif.
 * @returns Kondisi untuk filter terisi saja; `[]` bila tanpa filter.
 */
export function domainSesi(f: FilterSesi): DomainSesiTerm[] {
  const d: DomainSesiTerm[] = [];
  if (f.kodeSesi) d.push(["kode_sesi", "=", f.kodeSesi]);
  if (f.kodeOrang) d.push(["kode_orang", "=", f.kodeOrang]);
  if (f.jenisKegiatan) d.push(["jenis_kegiatan", "=", f.jenisKegiatan]);
  if (f.statusIzin) d.push(["status_izin", "=", f.statusIzin]);
  return d;
}

/**
 * Susun query string dari filter (hanya key terisi).
 *
 * @param f - Filter aktif.
 * @returns Query tanpa `?`; `""` bila kosong.
 */
export function querySesi(f: FilterSesi): string {
  const sp = new URLSearchParams();
  if (f.kodeSesi) sp.set("sesi", f.kodeSesi);
  if (f.kodeOrang) sp.set("orang", f.kodeOrang);
  if (f.jenisKegiatan) sp.set("jenis", f.jenisKegiatan);
  if (f.statusIzin) sp.set("izin", f.statusIzin);
  return sp.toString();
}

/**
 * Tampilkan menit: `null`/`undefined` → `—` (tidak pernah `0`), angka apa adanya.
 *
 * @param n - Nilai menit atau null.
 */
export function formatMenit(n: number | null | undefined): string {
  return n === null || n === undefined ? "—" : String(n);
}

/**
 * Label masalah untuk pilihan tautan: `kode — tema konteks` (jatuh ke kode bila konteks
 * tak ditemukan).
 *
 * @param m - Masalah.
 * @param peta - Peta id konteks → konteks.
 */
export function labelMasalahTema(
  m: Pick<MasalahRead, "kode" | "konteks_id">,
  peta: Map<string, KonteksRead>,
): string {
  const k = peta.get(m.konteks_id);
  return k ? `${m.kode} — ${k.tema}` : m.kode;
}
