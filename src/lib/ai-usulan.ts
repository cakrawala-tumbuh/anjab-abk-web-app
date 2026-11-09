/**
 * Logika murni layar "Usulan AI" (Tim Kajian): label fungsi/sasaran, pembacaan filter dari
 * `searchParams`, perakitan domain `POST /api/v1/ai/usulan/search`, dan validasi putusan.
 */
import type { AiUsulanPutusanCreate, PutusanUsulan, TingkatKoreksi } from "@/lib/api/schema";

/** Label fungsi AI yang dikenal klien; kode lain tampil apa adanya. */
export const LABEL_FUNGSI: Record<string, string> = {
  P01: "Ekstraksi sumber",
  P04: "Pertanyaan bukti",
  P09: "Kritik draf",
  P10: "Draf narasi",
};

/** Jenis sasaran yang dikenal (urut penyajian pada filter). */
export const JENIS_SASARAN = ["NARASI_KASUS", "NARASI_SUMBER"] as const;

/** Label Indonesia jenis sasaran yang dikenal. */
export const LABEL_SASARAN: Record<string, string> = {
  NARASI_KASUS: "Kasus narasi",
  NARASI_SUMBER: "Sumber narasi",
};

/** Label hasil serap yang dikenal. */
export const LABEL_HASIL_SERAP: Record<string, string> = {
  USULAN_DIBUAT: "Usulan dibuat",
  EVIDENCE_GAP: "Bukti belum cukup",
  MANUAL: "Perlu penanganan manual",
};

/** Opsi tingkat koreksi, urut penyajian. */
export const TINGKAT_KOREKSI: ReadonlyArray<TingkatKoreksi> = ["MINOR", "MAJOR", "CRITICAL"];

/** Opsi putusan, urut penyajian. */
export const OPSI_PUTUSAN: ReadonlyArray<PutusanUsulan> = ["APPROVE", "REVISE", "REJECT"];

/** Batas minimum karakter `catatan` untuk REJECT (cermin backend). */
export const CATATAN_MIN = 5;

/**
 * Label fungsi: kode plus nama bila dikenal.
 *
 * @param kode - Kode fungsi dari backend (mis. `P09`, atau `P99` yang tak dikenal).
 * @returns `"P09 — Kritik draf"`, atau `kode` apa adanya bila tak dikenal. Tidak melempar.
 */
export function labelFungsi(kode: string): string {
  const nama = LABEL_FUNGSI[kode];
  return nama ? `${kode} — ${nama}` : kode;
}

/**
 * Label jenis sasaran.
 *
 * @param jenis - Nilai `sasaran_jenis` dari backend.
 * @returns Label Indonesia bila dikenal, `jenis` apa adanya bila tidak. Tidak melempar.
 */
export function labelSasaran(jenis: string): string {
  return LABEL_SASARAN[jenis] ?? jenis;
}

/**
 * Label hasil serap.
 *
 * @param hasil - Nilai `hasil_serap`; `null` berarti run belum diserap.
 * @returns Label Indonesia; `"Belum diserap"` bila `null`; nilai asing apa adanya.
 */
export function labelHasilSerap(hasil: string | null | undefined): string {
  if (!hasil) return "Belum diserap";
  return LABEL_HASIL_SERAP[hasil] ?? hasil;
}

/**
 * Tautan ke objek sasaran bila dikenal.
 *
 * @param jenis - Jenis sasaran.
 * @param id - Id objek sasaran.
 * @returns Path layar `/narasi/kasus/{id}` untuk `NARASI_KASUS`; `null` untuk lainnya.
 */
export function hrefSasaran(jenis: string, id: string): string | null {
  return jenis === "NARASI_KASUS" ? `/narasi/kasus/${encodeURIComponent(id)}` : null;
}

/** Filter index usulan; `null` = tidak difilter. */
export interface FilterUsulan {
  fungsi: string | null;
  sasaran_jenis: string | null;
}

type NilaiQuery = string | string[] | undefined;

function pertama(v: NilaiQuery): string | null {
  const raw = Array.isArray(v) ? v[0] : v;
  const t = raw?.trim();
  return t ? t : null;
}

/**
 * Baca filter index dari `searchParams`.
 *
 * @param sp - `searchParams` halaman.
 * @returns Filter aktif; `fungsi` dibatasi 20 karakter, `sasaran_jenis` 50.
 */
export function bacaFilterUsulan(sp: Record<string, NilaiQuery>): FilterUsulan {
  return {
    fungsi: pertama(sp.fungsi)?.slice(0, 20) ?? null,
    sasaran_jenis: pertama(sp.sasaran)?.slice(0, 50) ?? null,
  };
}

/**
 * @param f - Filter aktif.
 * @returns `true` bila minimal satu filter terisi.
 */
export function adaFilterUsulan(f: FilterUsulan): boolean {
  return f.fungsi !== null || f.sasaran_jenis !== null;
}

/**
 * Susun query string URL dari filter (hanya key terisi).
 *
 * @param f - Filter aktif.
 * @returns Query tanpa `?`; `""` bila kosong.
 */
export function queryFilterUsulan(f: FilterUsulan): string {
  const sp = new URLSearchParams();
  if (f.fungsi) sp.set("fungsi", f.fungsi);
  if (f.sasaran_jenis) sp.set("sasaran", f.sasaran_jenis);
  return sp.toString();
}

/** Satu kondisi domain `[field, "=", nilai]`. */
export type DomainUsulanTerm = [string, "=", string];

/**
 * Rakit domain `POST /api/v1/ai/usulan/search` dari filter. Hanya field `fungsi` dan
 * `sasaran_jenis` (backend tidak menerima filter putusan).
 *
 * @param f - Filter aktif.
 * @returns Kondisi untuk filter terisi saja; `[]` bila tanpa filter.
 */
export function domainUsulan(f: FilterUsulan): DomainUsulanTerm[] {
  const d: DomainUsulanTerm[] = [];
  if (f.fungsi) d.push(["fungsi", "=", f.fungsi]);
  if (f.sasaran_jenis) d.push(["sasaran_jenis", "=", f.sasaran_jenis]);
  return d;
}

/** Isian form putusan. */
export interface IsianPutusan {
  putusan: PutusanUsulan | "";
  tingkat_koreksi: TingkatKoreksi | "";
  catatan: string;
  teks_koreksi: string;
}

/** Isian kosong awal form putusan. */
export const ISIAN_PUTUSAN_KOSONG: IsianPutusan = {
  putusan: "",
  tingkat_koreksi: "",
  catatan: "",
  teks_koreksi: "",
};

/** Galat validasi per field; kosong = sah. */
export type GalatPutusan = Partial<Record<keyof IsianPutusan, string>>;

/**
 * Validasi isian putusan terhadap kombinasi sah backend: `APPROVE` polos; `REVISE` wajib
 * `teks_koreksi` dan `tingkat_koreksi`; `REJECT` wajib `catatan` (min. 5 karakter setelah
 * pangkas) dan `tingkat_koreksi`, tanpa `teks_koreksi`.
 *
 * @param i - Isian form.
 * @returns Pesan galat per field; `{}` bila kombinasi sah.
 */
export function validasiPutusan(i: IsianPutusan): GalatPutusan {
  const g: GalatPutusan = {};
  if (!i.putusan) {
    g.putusan = "Pilih putusan.";
    return g;
  }
  if (i.putusan === "APPROVE") {
    if (i.tingkat_koreksi) g.tingkat_koreksi = "APPROVE tidak memakai tingkat koreksi.";
    if (i.teks_koreksi.trim()) g.teks_koreksi = "APPROVE tidak memakai teks koreksi.";
    return g;
  }
  if (!i.tingkat_koreksi) g.tingkat_koreksi = "Tingkat koreksi wajib untuk REVISE dan REJECT.";
  if (i.putusan === "REVISE") {
    if (!i.teks_koreksi.trim()) g.teks_koreksi = "Teks koreksi wajib untuk REVISE.";
  } else {
    if (i.catatan.trim().length < CATATAN_MIN) {
      g.catatan = `Catatan wajib minimal ${CATATAN_MIN} karakter untuk REJECT.`;
    }
    if (i.teks_koreksi.trim()) g.teks_koreksi = "Teks koreksi hanya untuk REVISE.";
  }
  return g;
}

/**
 * Bangun body `POST .../putusan` dari isian yang SUDAH lolos {@link validasiPutusan}.
 * Field kosong tidak dikirim; aktor tidak pernah dikirim.
 *
 * @param i - Isian form yang sah (`putusan` terisi).
 * @returns Body bertipe kontrak backend.
 */
export function bodyPutusan(i: IsianPutusan): AiUsulanPutusanCreate {
  const body: AiUsulanPutusanCreate = { putusan: i.putusan as PutusanUsulan };
  if (i.putusan !== "APPROVE" && i.tingkat_koreksi) body.tingkat_koreksi = i.tingkat_koreksi;
  if (i.catatan.trim()) body.catatan = i.catatan.trim();
  if (i.putusan === "REVISE") body.teks_koreksi = i.teks_koreksi;
  return body;
}
