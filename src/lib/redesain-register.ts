/**
 * Logika murni register Tim redesain: kosakata isian konteks/masalah, pembacaan filter
 * register masalah dari `searchParams`, dan perakitan domain `POST .../masalah/search`.
 */
import type { KonteksRead, MasalahRead, SekolahRead } from "@/lib/api/schema";

/** Nilai kosakata `gelombang` (urutan sama dengan backend). */
export const GELOMBANG = ["G1", "G2", "G3", "G3 - klarifikasi", "Belum dijadwalkan"] as const;

/** Nilai kosakata `status_awal` masalah (urutan sama dengan backend). */
export const STATUS_AWAL = [
  "Hipotesis",
  "Keterangan kasus",
  "Diperkuat untuk klaim",
  "Diperselisihkan",
] as const;

/** Pesan saat kode konteks sudah dipakai (HTTP 409 pada tambah konteks). */
export const PESAN_KODE_KONTEKS_DUPLIKAT = "Kode konteks sudah dipakai";

/** Label tetap pada judul halaman konteks: isi katalog bukan temuan resmi. */
export const LABEL_BELUM_TEMUAN = "BELUM MENJADI TEMUAN";

/** Teks sekolah bila `sekolah_id` null dan `keterangan_sekolah` kosong. */
export const TEKS_SEKOLAH_BELUM = "Belum ditetapkan";

type NilaiQuery = string | string[] | undefined;

/** Filter register masalah yang sedang aktif; `null` = tidak difilter. */
export interface FilterMasalah {
  konteksId: string | null;
  sekolahId: string | null;
  statusAwal: string | null;
  gelombang: string | null;
  /** `true` = hanya yang dibuka, `false` = hanya yang tertutup, `null` = semua. */
  dibuka: boolean | null;
}

function satu(value: NilaiQuery): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw !== undefined && raw.length > 0 ? raw : null;
}

/**
 * Baca filter register masalah dari `searchParams` mentah
 * (`?konteks=`, `?sekolah=`, `?status=`, `?gelombang=`, `?dibuka=ya|tidak`).
 *
 * @param sp - `searchParams` Next.js apa adanya.
 * @returns Filter terstruktur; nilai kosong/tidak dikenal untuk `dibuka` dibaca `null`.
 */
export function bacaFilterMasalah(sp: Record<string, NilaiQuery>): FilterMasalah {
  const d = satu(sp.dibuka);
  return {
    konteksId: satu(sp.konteks),
    sekolahId: satu(sp.sekolah),
    statusAwal: satu(sp.status),
    gelombang: satu(sp.gelombang),
    dibuka: d === "ya" ? true : d === "tidak" ? false : null,
  };
}

/** Satu kondisi domain ala Odoo `[field, "=", value]`. */
export type DomainMasalahTerm = [string, "=", string | boolean];

/**
 * Rakit {@link FilterMasalah} menjadi domain `POST /api/v1/redesain/masalah/search`.
 *
 * Hanya filter terisi yang menyumbang kondisi (digabung AND oleh backend).
 *
 * @param f - Filter aktif.
 * @returns Daftar kondisi; `[]` bila tanpa filter.
 */
export function domainMasalah(f: FilterMasalah): DomainMasalahTerm[] {
  const d: DomainMasalahTerm[] = [];
  if (f.konteksId) d.push(["konteks_id", "=", f.konteksId]);
  if (f.sekolahId) d.push(["sekolah_id", "=", f.sekolahId]);
  if (f.statusAwal) d.push(["status_awal", "=", f.statusAwal]);
  if (f.gelombang) d.push(["gelombang", "=", f.gelombang]);
  if (f.dibuka !== null) d.push(["dibuka_untuk_konfirmasi", "=", f.dibuka]);
  return d;
}

/**
 * Susun query string dari filter (hanya key terisi). Dipakai kontrol filter klien.
 *
 * @param f - Filter aktif.
 * @returns Query tanpa `?`, `""` bila kosong.
 */
export function queryFilterMasalah(f: FilterMasalah): string {
  const sp = new URLSearchParams();
  if (f.konteksId) sp.set("konteks", f.konteksId);
  if (f.sekolahId) sp.set("sekolah", f.sekolahId);
  if (f.statusAwal) sp.set("status", f.statusAwal);
  if (f.gelombang) sp.set("gelombang", f.gelombang);
  if (f.dibuka !== null) sp.set("dibuka", f.dibuka ? "ya" : "tidak");
  return sp.toString();
}

/**
 * Label konteks `kode — tema`; bila konteks tak ditemukan, jatuh ke id mentah.
 *
 * @param konteksId - ID konteks pada masalah.
 * @param peta - Peta id → konteks.
 */
export function labelKonteks(konteksId: string, peta: Map<string, KonteksRead>): string {
  const k = peta.get(konteksId);
  return k ? `${k.kode} — ${k.tema}` : konteksId;
}

/**
 * Teks sekolah sebuah masalah: nama sekolah master, atau `keterangan_sekolah`, atau
 * {@link TEKS_SEKOLAH_BELUM}.
 *
 * @param m - Masalah.
 * @param peta - Peta id → sekolah master.
 */
export function labelSekolah(
  m: Pick<MasalahRead, "sekolah_id" | "keterangan_sekolah">,
  peta: Map<string, SekolahRead>,
): string {
  if (m.sekolah_id) return peta.get(m.sekolah_id)?.nama ?? m.sekolah_id;
  return m.keterangan_sekolah?.trim() || TEKS_SEKOLAH_BELUM;
}
