/**
 * Logika murni fungsi P11 (Pengusul Konteks) di web: validasi pengajuan, penentuan panel
 * "Terapkan kandidat", pembacaan kandidat dari `isi` usulan, dan validasi/body aksi Terapkan.
 */
import type { PengajuanP11, TerapkanKonteks } from "@/lib/api/schema";
import { GELOMBANG } from "@/lib/redesain-register";

/** Batas jumlah kandidat yang boleh diminta (cermin backend). */
export const JUMLAH_KANDIDAT_MIN = 1;
/** @see JUMLAH_KANDIDAT_MIN */
export const JUMLAH_KANDIDAT_MAX = 5;
/** Bawaan jumlah kandidat. */
export const JUMLAH_KANDIDAT_BAWAAN = 3;
/** Pola kode konteks (`K-NN`). */
export const POLA_KODE_KONTEKS = /^K-\d{2}$/;
/** Batas panjang `tema` (cermin backend). */
export const TEMA_MAKS = 200;

/** Isian tombol "Usulkan dengan AI". */
export interface IsianPengajuan {
  sertakan_masalah: boolean;
  /** Teks mentah dari kotak angka. */
  jumlah_kandidat: string;
}

/**
 * Validasi isian pengajuan.
 *
 * @param i - Isian form.
 * @returns Pesan galat untuk `jumlah_kandidat`, atau `null` bila sah (bilangan bulat 1-5).
 */
export function validasiPengajuan(i: IsianPengajuan): string | null {
  const t = i.jumlah_kandidat.trim();
  const n = Number(t);
  if (t === "" || !Number.isInteger(n) || n < JUMLAH_KANDIDAT_MIN || n > JUMLAH_KANDIDAT_MAX) {
    return `Jumlah kandidat harus bilangan bulat ${JUMLAH_KANDIDAT_MIN}-${JUMLAH_KANDIDAT_MAX}.`;
  }
  return null;
}

/**
 * Bangun body `POST /api/v1/redesain/konteks/usulan-ai` dari isian yang sudah lolos
 * {@link validasiPengajuan}. `sumber_dokumen_ids` selalu `[]` (pemilihan dokumen tidak ada di web).
 *
 * @param i - Isian sah.
 * @returns Body bertipe kontrak backend.
 */
export function bodyPengajuan(i: IsianPengajuan): PengajuanP11 {
  return {
    sertakan_masalah: i.sertakan_masalah,
    jumlah_kandidat: Number(i.jumlah_kandidat.trim()),
    sumber_dokumen_ids: [],
  };
}

/**
 * Apakah panel "Terapkan kandidat" ditampilkan.
 *
 * @param fungsi - Kode fungsi usulan.
 * @param isi - `isi` usulan (null/undefined bila belum diserap).
 * @param putusanTerakhir - Putusan terbaru (`APPROVE`/`REVISE`/`REJECT`) atau null/undefined.
 * @returns `true` hanya untuk `P11` ber-`isi` dengan putusan terakhir `APPROVE` atau `REVISE`.
 */
export function panelTerapkanTampil(
  fungsi: string,
  isi: unknown,
  putusanTerakhir: string | null | undefined,
): boolean {
  if (fungsi !== "P11") return false;
  if (isi === null || isi === undefined) return false;
  return putusanTerakhir === "APPROVE" || putusanTerakhir === "REVISE";
}

/** Satu kandidat konteks dari `isi.konteks_candidates`, sudah dinormalkan. */
export interface KandidatKonteks {
  /** Indeks pada `konteks_candidates` (mulai 0). */
  indeks: number;
  tema: string;
  ruang_dugaan: string;
  sumber_draft: string;
  batas_pemeriksaan: string;
  /** Gelombang saran AI bila salah satu nilai sah; selain itu `"Belum dijadwalkan"`. */
  gelombang_saran: (typeof GELOMBANG)[number];
  /** Kode konteks yang mirip (informasi), bisa kosong. */
  mirip_kode: string[];
}

function teks(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * Baca kandidat dari `isi` usulan P11 secara defensif (bentuk tak dikenal tidak melempar).
 *
 * @param isi - `isi` usulan (nilai JSON apa pun).
 * @returns Kandidat berurutan sesuai indeks; `[]` bila `isi` tak memuat `konteks_candidates` larik.
 */
export function kandidatDariIsi(isi: unknown): KandidatKonteks[] {
  if (typeof isi !== "object" || isi === null) return [];
  const daftar = (isi as Record<string, unknown>).konteks_candidates;
  if (!Array.isArray(daftar)) return [];
  return daftar.map((k, indeks) => {
    const o = (typeof k === "object" && k !== null ? k : {}) as Record<string, unknown>;
    const g = teks(o.gelombang_saran);
    const gelombang = (GELOMBANG as readonly string[]).includes(g)
      ? (g as (typeof GELOMBANG)[number])
      : "Belum dijadwalkan";
    return {
      indeks,
      tema: teks(o.tema),
      ruang_dugaan: teks(o.ruang_dugaan),
      sumber_draft: teks(o.sumber_draft),
      batas_pemeriksaan: teks(o.batas_pemeriksaan),
      gelombang_saran: gelombang,
      mirip_kode: Array.isArray(o.mirip_kode)
        ? o.mirip_kode.filter((x) => typeof x === "string")
        : [],
    };
  });
}

/** Pasangan konteks yang sudah diterapkan: `ai_kandidat_indeks` -> kode. */
export interface KonteksTerapan {
  ai_kandidat_indeks?: number | null;
  kode: string;
}

/**
 * Petakan konteks hasil Terapkan menurut indeks kandidat asalnya.
 *
 * @param konteks - Hasil `POST /redesain/konteks/search` domain `ai_usulan_id = id`.
 * @returns Peta indeks kandidat -> kode konteks; konteks tanpa indeks diabaikan.
 */
export function petaKandidatTerapan(konteks: readonly KonteksTerapan[]): Map<number, string> {
  const m = new Map<number, string>();
  for (const k of konteks) {
    if (typeof k.ai_kandidat_indeks === "number") m.set(k.ai_kandidat_indeks, k.kode);
  }
  return m;
}

/** Isian form Terapkan satu kandidat. */
export interface IsianTerapkan {
  kode: string;
  gelombang: string;
  tema: string;
  ruang_dugaan: string;
  sumber_draft: string;
  batas_pemeriksaan: string;
}

/** Galat validasi per field Terapkan; kosong = sah. */
export type GalatTerapkan = Partial<Record<keyof IsianTerapkan, string>>;

/**
 * Isian awal form Terapkan dari kandidat: kode kosong, gelombang saran, empat isian kandidat.
 *
 * @param k - Kandidat.
 * @returns Isian awal yang bisa disunting.
 */
export function isianAwalTerapkan(k: KandidatKonteks): IsianTerapkan {
  return {
    kode: "",
    gelombang: k.gelombang_saran,
    tema: k.tema,
    ruang_dugaan: k.ruang_dugaan,
    sumber_draft: k.sumber_draft,
    batas_pemeriksaan: k.batas_pemeriksaan,
  };
}

/**
 * Validasi isian Terapkan: kode `K-NN`, gelombang salah satu nilai sah, dan keempat isian
 * terisi (tema maksimal {@link TEMA_MAKS} karakter).
 *
 * @param i - Isian form.
 * @returns Pesan galat per field; `{}` bila sah.
 */
export function validasiTerapkan(i: IsianTerapkan): GalatTerapkan {
  const g: GalatTerapkan = {};
  if (!POLA_KODE_KONTEKS.test(i.kode.trim())) g.kode = "Kode harus berpola K-NN, mis. K-15.";
  if (!(GELOMBANG as readonly string[]).includes(i.gelombang)) g.gelombang = "Pilih gelombang.";
  if (!i.tema.trim()) g.tema = "Tema wajib diisi.";
  else if (i.tema.trim().length > TEMA_MAKS) g.tema = `Tema maksimal ${TEMA_MAKS} karakter.`;
  if (!i.ruang_dugaan.trim()) g.ruang_dugaan = "Ruang dugaan wajib diisi.";
  if (!i.sumber_draft.trim()) g.sumber_draft = "Sumber draf wajib diisi.";
  if (!i.batas_pemeriksaan.trim()) g.batas_pemeriksaan = "Batas pemeriksaan wajib diisi.";
  return g;
}

/**
 * Bangun body `POST .../terapkan-konteks` dari isian yang sudah lolos {@link validasiTerapkan}.
 * Keempat isian selalu dikirim lengkap (aman untuk putusan `REVISE`).
 *
 * @param indeks - Indeks kandidat pada `konteks_candidates`.
 * @param i - Isian sah.
 * @returns Body bertipe kontrak backend.
 */
export function bodyTerapkan(indeks: number, i: IsianTerapkan): TerapkanKonteks {
  return {
    indeks_kandidat: indeks,
    kode: i.kode.trim(),
    gelombang: i.gelombang as TerapkanKonteks["gelombang"],
    tema: i.tema.trim(),
    ruang_dugaan: i.ruang_dugaan.trim(),
    sumber_draft: i.sumber_draft.trim(),
    batas_pemeriksaan: i.batas_pemeriksaan.trim(),
  };
}
