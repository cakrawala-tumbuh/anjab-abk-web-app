/**
 * Fungsi murni sisi Tim Kajian untuk konfirmasi sekolah (WEB-4b): domain pencarian,
 * penyaringan versi digantikan, syarat tombol angkat masalah, dan payload isian luring.
 *
 * Kosakata pilihan dan pemetaan pesan 422 dipakai ulang dari `redesain-konfirmasi.ts`
 * (sisi sekolah) agar tidak ada kosakata tandingan.
 */
import { ApiError } from "@/lib/api/errors";
import type { KonfirmasiDaftarRead, KonfirmasiLuringCreate } from "@/lib/api/schema";
import { LABEL_FIELD, fieldKurang } from "@/lib/redesain-konfirmasi";

/** Domain daftar eskalasi: masalah yang `eskalasi_pada`-nya terisi. */
export const DOMAIN_ESKALASI: [string, "!=", null][] = [["eskalasi_pada", "!=", null]];

/** Urutan daftar eskalasi: `eskalasi_pada` terbaru dulu. */
export const URUTAN_ESKALASI: [string, "asc" | "desc"][] = [["eskalasi_pada", "desc"]];

/** Domain pencarian konfirmasi satu masalah. */
export function domainKonfirmasiMasalah(masalahId: string): [string, "=", string][] {
  return [["masalah_id", "=", masalahId]];
}

/**
 * Himpunan id konfirmasi yang dianggap "digantikan" untuk tampilan Tim Kajian.
 *
 * Berbeda dengan field backend `digantikan` (yang sudah true begitu ada ralat draf),
 * bagi Tim sebuah versi baru digantikan bila penggantinya sudah `terkirim`; selama
 * ralat masih draf, versi terkirim tetap sah dan tetap bisa diangkat masalahnya.
 *
 * @param daftar - Seluruh konfirmasi satu masalah (bagian yang relevan).
 * @returns Himpunan id yang `menggantikan_id`-nya dirujuk baris ber-status `terkirim`.
 */
export function idDigantikanTerkirim(
  daftar: ReadonlyArray<Pick<KonfirmasiDaftarRead, "status" | "menggantikan_id">>,
): Set<string> {
  const hasil = new Set<string>();
  for (const k of daftar) {
    if (k.status === "terkirim" && k.menggantikan_id) hasil.add(k.menggantikan_id);
  }
  return hasil;
}

/**
 * Saring konfirmasi untuk tampilan: versi yang sudah digantikan ralat terkirim
 * disembunyikan kecuali diminta.
 *
 * @param daftar - Seluruh konfirmasi masalah.
 * @param digantikan - Himpunan dari {@link idDigantikanTerkirim}.
 * @param tampilkanDigantikan - True bila toggle "tampilkan versi digantikan" menyala.
 */
export function saringKonfirmasi<T extends { id: string }>(
  daftar: ReadonlyArray<T>,
  digantikan: ReadonlySet<string>,
  tampilkanDigantikan: boolean,
): T[] {
  return daftar.filter((k) => tampilkanDigantikan || !digantikan.has(k.id));
}

/**
 * Tombol "Angkat masalah" hanya untuk konfirmasi `terkirim` dengan `masalah_baru` terisi.
 *
 * @param k - Konfirmasi (bagian yang relevan).
 */
export function bisaAngkatMasalah(
  k: Pick<KonfirmasiDaftarRead, "status" | "masalah_baru">,
): boolean {
  return k.status === "terkirim" && !!k.masalah_baru?.trim();
}

/** Isian form luring (semua string; kosong = tidak diisi). */
export interface IsianLuring {
  kode_orang: string;
  sekolah_id: string;
  tanggal: string;
  peran: string;
  cerita_sebelum: string;
  kesesuaian: string;
  koreksi: string;
  masalah_baru: string;
  alasan_k: string;
  bukti_dapat_diperiksa: string;
  hal_belum_jelas: string;
  catatan_independensi: string;
  catatan_akses: string;
  k1: string;
  k2: string;
  k3: string;
  k4: string;
  indikasi_risiko: string;
}

/** Isian kosong untuk form luring. */
export function isianLuringKosong(sekolahId = ""): IsianLuring {
  return {
    kode_orang: "",
    sekolah_id: sekolahId,
    tanggal: "",
    peran: "",
    cerita_sebelum: "",
    kesesuaian: "",
    koreksi: "",
    masalah_baru: "",
    alasan_k: "",
    bukti_dapat_diperiksa: "",
    hal_belum_jelas: "",
    catatan_independensi: "",
    catatan_akses: "",
    k1: "",
    k2: "",
    k3: "",
    k4: "",
    indikasi_risiko: "",
  };
}

/**
 * Bangun body `POST /konfirmasi/luring`. Field kosong dikirim kosong (bukan dibuang)
 * untuk field wajib agar backend yang memutuskan 422; field opsional kosong dibuang.
 *
 * @param masalahId - Masalah yang dikonfirmasi.
 * @param i - Isian form.
 */
export function payloadLuring(masalahId: string, i: IsianLuring): KonfirmasiLuringCreate {
  const opsional = (v: string) => (v.trim() === "" ? undefined : v);
  return {
    masalah_id: masalahId,
    kode_orang: i.kode_orang,
    sekolah_id: i.sekolah_id,
    peran: i.peran,
    tanggal: opsional(i.tanggal),
    cerita_sebelum: opsional(i.cerita_sebelum),
    kesesuaian: i.kesesuaian as KonfirmasiLuringCreate["kesesuaian"],
    koreksi: opsional(i.koreksi),
    masalah_baru: opsional(i.masalah_baru),
    alasan_k: opsional(i.alasan_k),
    bukti_dapat_diperiksa: opsional(i.bukti_dapat_diperiksa),
    hal_belum_jelas: opsional(i.hal_belum_jelas),
    catatan_independensi: opsional(i.catatan_independensi),
    catatan_akses: opsional(i.catatan_akses),
    k1: i.k1 as KonfirmasiLuringCreate["k1"],
    k2: i.k2 as KonfirmasiLuringCreate["k2"],
    k3: i.k3 as KonfirmasiLuringCreate["k3"],
    k4: i.k4 as KonfirmasiLuringCreate["k4"],
    indikasi_risiko: i.indikasi_risiko as KonfirmasiLuringCreate["indikasi_risiko"],
  };
}

/** Kolom wajib formulir isian luring (field non-opsional `KonfirmasiLuringCreate`). */
export const KOLOM_WAJIB_LURING = [
  "kode_orang",
  "sekolah_id",
  "peran",
  "kesesuaian",
  "indikasi_risiko",
] as const;

/**
 * Label kolom wajib luring yang masih kosong, berurutan menurut {@link KOLOM_WAJIB_LURING}.
 *
 * @param i - Isian form.
 * @returns Daftar label (kosong bila lengkap).
 */
export function kolomWajibLuringKosong(i: IsianLuring): string[] {
  return KOLOM_WAJIB_LURING.filter((k) => i[k].trim() === "").map((k) => LABEL_LURING[k] ?? k);
}

/** Label field luring tambahan di luar {@link LABEL_FIELD}. */
export const LABEL_LURING: Readonly<Record<string, string>> = {
  ...LABEL_FIELD,
  kode_orang: "Kode orang pemberi keterangan",
  sekolah_id: "Sekolah",
  masalah_id: "Masalah",
  tanggal: "Tanggal",
};

/**
 * Pesan siap-tampil untuk kegagalan isian luring: 422 menyebut field yang kurang;
 * 409 (pasangan masalah & kode orang sudah ada) dan lainnya memakai pesan backend.
 *
 * @param err - Error dari panggilan API.
 */
export function pesanGagalLuring(err: unknown): string {
  if (err instanceof ApiError && err.status === 422) {
    const f = fieldKurang(err);
    if (f.length > 0) return `Belum lengkap: ${f.map((x) => LABEL_LURING[x] ?? x).join(", ")}.`;
  }
  return err instanceof Error ? err.message : "Terjadi kesalahan.";
}
