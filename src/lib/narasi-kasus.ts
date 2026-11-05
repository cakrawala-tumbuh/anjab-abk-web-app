/**
 * Logika murni layar kasus narasi (Tim Kajian, jalur manual F1): kosakata status, pembacaan
 * filter dari `searchParams`, validasi sisi klien, perakitan body, dan pemetaan 422 ke field.
 */
import { ApiError } from "@/lib/api/errors";

/** Jenis narasi yang dibuka pada tahap ini; ditetapkan tetap, bukan isian pengguna. */
export const NARRATIVE_KIND_TETAP = "F1_FORMAL" as const;

/** Kelas kepekaan yang dibuka pada tahap ini; ditetapkan tetap, bukan isian pengguna. */
export const SENSITIVITY_CLASS_TETAP = "NONPRIBADI" as const;

/** Batas karakter `teks` pada satu revisi manual (cermin `BATAS_TEKS_REVISI` backend). */
export const BATAS_TEKS_REVISI = 200_000;

/** Kode galat 409 untuk lingkup kasus yang sudah ada. */
export const KODE_LINGKUP_GANDA = "narasi_lingkup_ganda";

/** Kode galat 409 untuk `supersedes_id` yang sudah basi. */
export const KODE_VERSI_BASI = "versi_basi";

/** Seluruh status kasus narasi menurut backend (14 nilai), urut siklus tinjauan. */
export const STATUS_KASUS = [
  "SOURCE_CHECKED",
  "AI_DRAFT",
  "NEED_FACT",
  "TEAM_REVIEW",
  "TEAM_VERIFIED",
  "SUBJECT_REVIEW",
  "SUBJECT_CONFIRMED",
  "SUBJECT_CORRECTION",
  "SUBJECT_REJECTED",
  "SUBJECT_UNCERTAIN",
  "FINAL_TEAM_REVIEW",
  "RELEASED_FACT",
  "RELEASED_LIMITED",
  "RETURN_FOR_CLARIFICATION",
] as const;

/** Tipe nilai status kasus. */
export type StatusKasus = (typeof STATUS_KASUS)[number];

/**
 * Keterangan Indonesia tiap status. `TEAM_VERIFIED` sengaja tidak memakai kata rilis, final,
 * atau fakta: status itu hanya berarti tim sudah memeriksa, belum disahkan pihak mana pun.
 */
export const KETERANGAN_STATUS: Record<StatusKasus, string> = {
  SOURCE_CHECKED: "Sumber sudah dicek; belum ada versi teks",
  AI_DRAFT: "Draf dari AI; menunggu tinjauan tim",
  NEED_FACT: "Perlu fakta atau sumber tambahan",
  TEAM_REVIEW: "Menunggu tinjauan Tim Kajian",
  TEAM_VERIFIED: "Sudah diperiksa Tim Kajian; belum ditinjau subjek",
  SUBJECT_REVIEW: "Menunggu tanggapan subjek",
  SUBJECT_CONFIRMED: "Dikonfirmasi subjek",
  SUBJECT_CORRECTION: "Subjek meminta koreksi",
  SUBJECT_REJECTED: "Ditolak subjek",
  SUBJECT_UNCERTAIN: "Subjek belum yakin",
  FINAL_TEAM_REVIEW: "Menunggu keputusan akhir tim",
  RELEASED_FACT: "Dilepas sebagai fakta",
  RELEASED_LIMITED: "Dilepas terbatas",
  RETURN_FOR_CLARIFICATION: "Dikembalikan untuk klarifikasi",
};

/**
 * Label status untuk tampilan: enum internal plus keterangan Indonesia.
 *
 * @param status - Nilai status dari backend (nilai tak dikenal ditampilkan apa adanya).
 */
export function labelStatus(status: string): string {
  const ket = (KETERANGAN_STATUS as Record<string, string | undefined>)[status];
  return ket ? `${status} — ${ket}` : status;
}

/** Hubungan kutipan sumber terhadap isi versi. */
export const BASIS_RELATION = ["DIRECT", "CONTEXT", "CONTRADICTS", "UNKNOWN"] as const;

/** Tipe nilai `basis_relation`. */
export type BasisRelation = (typeof BASIS_RELATION)[number];

/** Keterangan Indonesia tiap hubungan dasar. */
export const KETERANGAN_BASIS: Record<BasisRelation, string> = {
  DIRECT: "Langsung mendukung",
  CONTEXT: "Konteks",
  CONTRADICTS: "Bertentangan",
  UNKNOWN: "Belum diketahui",
};

/** Filter daftar kasus yang aktif; `null` = tidak difilter. */
export interface FilterKasus {
  status: StatusKasus | null;
  instrument_id: string | null;
  periode: string | null;
}

type NilaiQuery = string | string[] | undefined;

function pertama(v: NilaiQuery): string | null {
  const raw = Array.isArray(v) ? v[0] : v;
  const t = raw?.trim();
  return t ? t : null;
}

/**
 * Baca filter daftar kasus dari `searchParams`. `status` di luar kosakata diabaikan;
 * `instrument_id` dibatasi 50 dan `periode` 20 karakter (batas backend).
 *
 * @param sp - `searchParams` halaman.
 * @returns Filter aktif.
 */
export function bacaFilterKasus(sp: Record<string, NilaiQuery>): FilterKasus {
  const s = pertama(sp.status);
  const status = (STATUS_KASUS as readonly string[]).includes(s ?? "") ? (s as StatusKasus) : null;
  return {
    status,
    instrument_id: pertama(sp.instrument_id)?.slice(0, 50) ?? null,
    periode: pertama(sp.periode)?.slice(0, 20) ?? null,
  };
}

/** `true` bila ada filter yang aktif. */
export function adaFilterKasus(f: FilterKasus): boolean {
  return f.status !== null || f.instrument_id !== null || f.periode !== null;
}

/** Isian formulir kasus (teks mentah dari input). */
export interface IsianKasus {
  instrument_id: string;
  field_key: string;
  peran_ref: string;
  periode: string;
  sekolah_id: string;
  assignment_ref: string;
  target_subject_ref: string;
  konteks_kode: string;
  intended_use: string;
  permission_scope: string;
}

/** Nama field formulir kasus. */
export type FieldKasus = keyof IsianKasus;

/** Field kasus yang wajib diisi. */
export const FIELD_KASUS_WAJIB = [
  "instrument_id",
  "field_key",
  "peran_ref",
  "periode",
  "intended_use",
  "permission_scope",
] as const satisfies readonly FieldKasus[];

/** Seluruh field kasus yang dikenal (dasar pemetaan 422). */
export const FIELD_KASUS = [
  ...FIELD_KASUS_WAJIB,
  "sekolah_id",
  "assignment_ref",
  "target_subject_ref",
  "konteks_kode",
] as const satisfies readonly FieldKasus[];

/** Batas panjang tiap field kasus (cermin backend). */
export const BATAS_FIELD_KASUS: Record<FieldKasus, number> = {
  instrument_id: 50,
  field_key: 100,
  peran_ref: 100,
  periode: 20,
  sekolah_id: 40,
  assignment_ref: 100,
  target_subject_ref: 100,
  konteks_kode: 100,
  intended_use: 200,
  permission_scope: 200,
};

/**
 * Validasi sisi klien isian kasus: field wajib terisi.
 *
 * @param i - Isian formulir.
 * @returns Peta field → pesan; kosong bila valid.
 */
export function validasiKasus(i: IsianKasus): Partial<Record<FieldKasus, string>> {
  const e: Partial<Record<FieldKasus, string>> = {};
  for (const k of FIELD_KASUS_WAJIB) {
    if (!i[k].trim()) e[k] = "Wajib diisi.";
  }
  return e;
}

/**
 * Rakit body `POST /api/v1/narasi/kasus`. Field opsional yang kosong dikirim `null`
 * (bukan string kosong); `narrative_kind` dan `sensitivity_class` selalu nilai tetap.
 *
 * @param i - Isian yang sudah lolos {@link validasiKasus}.
 */
export function bodyKasus(i: IsianKasus) {
  const opsional = (v: string) => (v.trim() ? v.trim() : null);
  return {
    instrument_id: i.instrument_id.trim(),
    field_key: i.field_key.trim(),
    peran_ref: i.peran_ref.trim(),
    periode: i.periode.trim(),
    sekolah_id: opsional(i.sekolah_id),
    assignment_ref: opsional(i.assignment_ref),
    target_subject_ref: opsional(i.target_subject_ref),
    konteks_kode: opsional(i.konteks_kode),
    narrative_kind: NARRATIVE_KIND_TETAP,
    intended_use: i.intended_use.trim(),
    permission_scope: i.permission_scope.trim(),
    sensitivity_class: SENSITIVITY_CLASS_TETAP,
  };
}

/** Satu baris sumber pada formulir revisi. */
export interface BarisSumberRevisi {
  sumber_id: string;
  source_span: string;
  basis_relation: BasisRelation;
}

/** Isian formulir revisi manual. */
export interface IsianRevisi {
  teks: string;
  sumber: BarisSumberRevisi[];
}

/** Hasil validasi revisi: pesan untuk teks, daftar sumber, dan per baris sumber. */
export interface GalatRevisi {
  teks?: string;
  sumber?: string;
  baris?: Record<number, string>;
}

/**
 * Validasi revisi: `teks` wajib dan ≤ {@link BATAS_TEKS_REVISI}; minimal satu baris sumber,
 * tiap baris wajib memilih sumber.
 *
 * @param i - Isian formulir revisi.
 * @returns Galat per bagian; objek kosong bila valid.
 */
export function validasiRevisi(i: IsianRevisi): GalatRevisi {
  const e: GalatRevisi = {};
  if (!i.teks.trim()) e.teks = "Teks revisi wajib diisi.";
  else if (i.teks.length > BATAS_TEKS_REVISI) {
    e.teks = `Teks melebihi ${BATAS_TEKS_REVISI} karakter.`;
  }
  if (i.sumber.length === 0) e.sumber = "Minimal satu sumber wajib dicantumkan.";
  else {
    i.sumber.forEach((b, idx) => {
      if (!b.sumber_id) (e.baris ??= {})[idx] = "Pilih sumber.";
    });
  }
  return e;
}

/** `true` bila hasil {@link validasiRevisi} tidak memuat galat. */
export function revisiValid(e: GalatRevisi): boolean {
  return !e.teks && !e.sumber && !e.baris;
}

/**
 * Rakit body `POST /api/v1/narasi/kasus/{id}/revisi`.
 *
 * @param i - Isian yang sudah lolos {@link validasiRevisi}.
 * @param supersedesId - Id versi terbaru yang dimuat; `null` untuk versi pertama.
 */
export function bodyRevisi(i: IsianRevisi, supersedesId: string | null) {
  return {
    teks: i.teks,
    sumber: i.sumber.map((b) => ({
      sumber_id: b.sumber_id,
      source_span: b.source_span.trim() ? b.source_span.trim() : null,
      basis_relation: b.basis_relation,
    })),
    supersedes_id: supersedesId,
  };
}

/**
 * Petakan `details` 422 backend ke pesan per field kasus (`loc` terakhir → `msg`).
 *
 * @param err - Error hasil panggilan API.
 * @returns Peta field → pesan; kosong bila bukan 422 atau tak ada field dikenal.
 */
export function galatField422Kasus(err: unknown): Partial<Record<FieldKasus, string>> {
  const hasil: Partial<Record<FieldKasus, string>> = {};
  if (!(err instanceof ApiError) || err.status !== 422) return hasil;
  for (const d of err.details) {
    const { loc, msg } = d as { loc?: unknown; msg?: unknown };
    if (!Array.isArray(loc) || loc.length === 0) continue;
    const nama = FIELD_KASUS.find((k) => k === String(loc[loc.length - 1]));
    if (nama && !hasil[nama]) hasil[nama] = typeof msg === "string" ? msg : "Isian tidak valid.";
  }
  return hasil;
}

/**
 * Susun tautan penelusuran kasus berlingkup sama (dipakai pesan 409 lingkup ganda).
 *
 * @param i - Isian formulir kasus.
 * @returns Path daftar kasus terfilter `instrument_id` dan `periode`.
 */
export function tautanPenelusuran(i: Pick<IsianKasus, "instrument_id" | "periode">): string {
  const q = new URLSearchParams();
  if (i.instrument_id.trim()) q.set("instrument_id", i.instrument_id.trim());
  if (i.periode.trim()) q.set("periode", i.periode.trim());
  const s = q.toString();
  return s ? `/narasi/kasus?${s}` : "/narasi/kasus";
}
