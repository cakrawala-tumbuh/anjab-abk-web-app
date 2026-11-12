/**
 * Logika murni layar antrean klarifikasi (Tim Kajian): kosakata, filter URL, aksi yang tersedia
 * menurut state, validasi form, pemetaan galat 409/422, dan penentuan panel "Terapkan ke register"
 * untuk usulan P04.
 */
import type { KlarifikasiCreate, KlarifikasiDariUsulan, KlarifikasiRead } from "@/lib/api/schema";
import { ApiError } from "@/lib/api/errors";

/** Disposisi yang dapat disaring, urut penyajian. */
export const DISPOSISI = ["TERBUKA", "TERJAWAB", "DIBATALKAN", "DITOLAK"] as const;
/** Tipe nilai disposisi. */
export type DisposisiKlarifikasi = (typeof DISPOSISI)[number];

/** Keterangan Indonesia tiap disposisi. */
export const KETERANGAN_DISPOSISI: Record<DisposisiKlarifikasi, string> = {
  TERBUKA: "Terbuka — belum dijawab",
  TERJAWAB: "Terjawab",
  DIBATALKAN: "Dibatalkan",
  DITOLAK: "Ditolak reviewer",
};

/** Keterangan Indonesia tiap status persetujuan reviewer. */
export const KETERANGAN_PERSETUJUAN: Record<string, string> = {
  MENUNGGU: "Menunggu persetujuan",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};

/** Keterangan Indonesia tiap aksi pada riwayat. */
export const KETERANGAN_AKSI: Record<string, string> = {
  DIBUAT: "Dibuat",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  JAWABAN_DICATAT: "Jawaban dicatat",
  DIBATALKAN: "Dibatalkan",
};

/** Keterangan Indonesia nilai paparan (`exposure`). */
export const KETERANGAN_EXPOSURE: Record<string, string> = {
  TIDAK_BERLAKU: "Tidak berlaku",
  BELUM_TERPAPAR: "Belum terpapar",
  LOCKED_PRE_EXPOSURE: "Terkunci sebelum paparan",
  EXPOSED: "Sudah terpapar",
  TIDAK_DIKETAHUI: "Tidak diketahui",
};

/** Teks tampil sebuah nilai enum: keterangan Indonesia bila dikenal, nilai apa adanya bila tidak. */
export function labelDari(peta: Record<string, string>, nilai: string): string {
  return peta[nilai] ?? nilai;
}

/** Nilai `exposure` yang sah menurut kontrak. */
export const NILAI_EXPOSURE = [
  "TIDAK_BERLAKU",
  "BELUM_TERPAPAR",
  "LOCKED_PRE_EXPOSURE",
  "EXPOSED",
  "TIDAK_DIKETAHUI",
] as const;

/** Tipe nilai `exposure`. */
export type NilaiExposure = (typeof NILAI_EXPOSURE)[number];

/**
 * Turunkan `exposure` register dari `paparan` antrean kasus. Nilai di luar himpunan sah, atau
 * kasus yang tidak berada dalam antrean (`paparan` `null`), menjadi `TIDAK_DIKETAHUI`.
 *
 * @param paparan - Nilai `paparan` dari detail antrean, atau `null`.
 */
export function exposureDariPaparan(paparan: string | null | undefined): NilaiExposure {
  return (NILAI_EXPOSURE as readonly string[]).includes(paparan ?? "")
    ? (paparan as NilaiExposure)
    : "TIDAK_DIKETAHUI";
}

/** Satu baris metadata pada `<dl>` detail: label Indonesia dan nama metadata HO. */
export interface BarisMetadata {
  kunci: Extract<keyof KlarifikasiRead, string>;
  label: string;
}

/** Ke-13 metadata register (HO butir 6) berurutan; nama HO dalam kurung. */
export const METADATA_KLARIFIKASI: ReadonlyArray<BarisMetadata> = [
  { kunci: "id", label: "ID pertanyaan (Question_ID)" },
  { kunci: "claim_id", label: "Klaim yang ditanyakan (Claim_ID)" },
  { kunci: "source_ids_checked", label: "Sumber yang sudah dicek (Source_IDs_checked)" },
  { kunci: "materiality_reason", label: "Alasan material (MaterialityReason)" },
  { kunci: "alternative_hypothesis", label: "Hipotesis alternatif (AlternativeHypothesis)" },
  { kunci: "intended_decision", label: "Keputusan yang dibantu (IntendedDecision)" },
  { kunci: "recipient_role", label: "Peran penerima (RecipientRole)" },
  { kunci: "periode", label: "Periode (Period)" },
  { kunci: "exposure", label: "Paparan (Exposure)" },
  { kunci: "due_trigger", label: "Pemicu batas waktu (DueTrigger)" },
  { kunci: "reviewer_approval", label: "Persetujuan reviewer (ReviewerApproval)" },
  { kunci: "response_ref", label: "Rujukan jawaban (ResponseRef)" },
  { kunci: "disposition", label: "Disposisi (Disposition)" },
];

/**
 * Teks nilai metadata untuk `<dl>`: larik digabung koma, enum diberi keterangan Indonesia,
 * `null`/kosong menjadi "—".
 *
 * @param k - Klarifikasi yang ditampilkan.
 * @param kunci - Kunci metadata.
 */
export function teksMetadata(k: KlarifikasiRead, kunci: keyof KlarifikasiRead): string {
  const v = k[kunci];
  if (Array.isArray(v)) return v.length > 0 ? v.join(", ") : "—";
  if (v === null || v === undefined || v === "") return "—";
  const s = String(v);
  if (kunci === "exposure") return `${s} — ${labelDari(KETERANGAN_EXPOSURE, s)}`;
  if (kunci === "reviewer_approval") return `${s} — ${labelDari(KETERANGAN_PERSETUJUAN, s)}`;
  if (kunci === "disposition") return `${s} — ${labelDari(KETERANGAN_DISPOSISI, s)}`;
  return s;
}

/** Filter indeks yang aktif; `disposition` `null` = semua disposisi. */
export interface FilterKlarifikasi {
  disposition: DisposisiKlarifikasi | null;
  narasi_id: string | null;
}

/** Nilai `disposition` pada URL yang berarti "tanpa saringan". */
export const DISPOSISI_SEMUA = "SEMUA";

type NilaiQuery = string | string[] | undefined;

function pertama(v: NilaiQuery): string | null {
  const raw = Array.isArray(v) ? v[0] : v;
  const t = raw?.trim();
  return t ? t : null;
}

/**
 * Baca filter dari `searchParams`. Bila `disposition` tidak ada, bawaannya `TERBUKA`;
 * `SEMUA` mematikan saringan; nilai asing diabaikan (kembali ke bawaan).
 *
 * @param sp - `searchParams` halaman.
 */
export function bacaFilterKlarifikasi(sp: Record<string, NilaiQuery>): FilterKlarifikasi {
  const d = pertama(sp.disposition);
  let disposition: DisposisiKlarifikasi | null = "TERBUKA";
  if (d === DISPOSISI_SEMUA) disposition = null;
  else if (d && (DISPOSISI as readonly string[]).includes(d)) {
    disposition = d as DisposisiKlarifikasi;
  }
  return { disposition, narasi_id: pertama(sp.narasi_id)?.slice(0, 36) ?? null };
}

/** `true` bila filter menyimpang dari bawaan (`TERBUKA`, tanpa `narasi_id`). */
export function adaFilterKlarifikasi(f: FilterKlarifikasi): boolean {
  return f.disposition !== "TERBUKA" || f.narasi_id !== null;
}

/**
 * Susun query string filter (tanpa `hlm`). Bawaan `TERBUKA` tidak ditulis; "semua" ditulis `SEMUA`.
 *
 * @param f - Filter yang dicerminkan ke URL.
 */
export function queryFilterKlarifikasi(f: FilterKlarifikasi): string {
  const q = new URLSearchParams();
  if (f.disposition === null) q.set("disposition", DISPOSISI_SEMUA);
  else if (f.disposition !== "TERBUKA") q.set("disposition", f.disposition);
  if (f.narasi_id) q.set("narasi_id", f.narasi_id);
  return q.toString();
}

/** Aksi yang boleh ditampilkan pada detail. */
export type AksiKlarifikasi = "setujui" | "tolak" | "salin" | "catat_jawaban" | "batalkan";

/**
 * Aksi yang tersedia menurut state: `MENUNGGU` → Setujui/Tolak; `DISETUJUI`+`TERBUKA` → Salin
 * pertanyaan dan Catat jawaban; seluruh baris `TERBUKA` → Batalkan. Disposisi akhir tanpa aksi.
 *
 * @param k - Subset `reviewer_approval` dan `disposition`.
 */
export function aksiTersedia(
  k: Pick<KlarifikasiRead, "reviewer_approval" | "disposition">,
): AksiKlarifikasi[] {
  if (k.disposition !== "TERBUKA") return [];
  const aksi: AksiKlarifikasi[] = [];
  if (k.reviewer_approval === "MENUNGGU") aksi.push("setujui", "tolak");
  if (k.reviewer_approval === "DISETUJUI") aksi.push("salin", "catat_jawaban");
  aksi.push("batalkan");
  return aksi;
}

/** Panjang minimum catatan Tolak/Batalkan (cermin backend). */
export const CATATAN_MIN = 5;

/** Pesan galat per field. */
export type GalatForm<K extends string> = Partial<Record<K, string>>;

/**
 * Validasi catatan Tolak/Batalkan: wajib, minimal {@link CATATAN_MIN} karakter.
 *
 * @returns Pesan galat atau `null` bila sah.
 */
export function validasiCatatan(catatan: string): string | null {
  return catatan.trim().length >= CATATAN_MIN
    ? null
    : `Catatan wajib diisi, minimal ${CATATAN_MIN} karakter.`;
}

/** Isian form "Catat jawaban". */
export interface IsianJawaban {
  response_ref: string;
  jawaban_mentah: string;
}

/** Validasi form Catat jawaban: kedua isian wajib. */
export function validasiJawaban(i: IsianJawaban): GalatForm<keyof IsianJawaban> {
  const g: GalatForm<keyof IsianJawaban> = {};
  if (!i.response_ref.trim()) g.response_ref = "Rujukan jawaban (ResponseRef) wajib diisi.";
  if (!i.jawaban_mentah.trim()) g.jawaban_mentah = "Jawaban mentah wajib diisi.";
  return g;
}

/** Isian form buat klarifikasi manual. */
export interface IsianBuat {
  claim_id: string;
  /** Id sumber yang dicentang. */
  source_ids_checked: string[];
  materiality_reason: string;
  alternative_hypothesis: string;
  intended_decision: string;
  recipient_role: string;
  periode: string;
  due_trigger: string;
  question_text: string;
}

/** Isian kosong form buat. */
export const ISIAN_BUAT_KOSONG: IsianBuat = {
  claim_id: "",
  source_ids_checked: [],
  materiality_reason: "",
  alternative_hypothesis: "",
  intended_decision: "",
  recipient_role: "",
  periode: "",
  due_trigger: "",
  question_text: "",
};

const MAKS = { claim_id: 100, recipient_role: 100, periode: 20 } as const;

/**
 * Validasi form buat: semua isian wajib, minimal satu sumber, batas panjang cermin backend,
 * dan paling banyak satu tanda tanya pada pertanyaan.
 */
export function validasiBuat(i: IsianBuat): GalatForm<keyof IsianBuat> {
  const g: GalatForm<keyof IsianBuat> = {};
  const wajib: Array<[keyof IsianBuat, string]> = [
    ["claim_id", "Klaim"],
    ["materiality_reason", "Alasan material"],
    ["alternative_hypothesis", "Hipotesis alternatif"],
    ["intended_decision", "Keputusan yang dibantu"],
    ["recipient_role", "Peran penerima"],
    ["periode", "Periode"],
    ["due_trigger", "Pemicu batas waktu"],
    ["question_text", "Pertanyaan"],
  ];
  for (const [k, nama] of wajib) {
    if (!(i[k] as string).trim()) g[k] = `${nama} wajib diisi.`;
  }
  if (i.source_ids_checked.length === 0) {
    g.source_ids_checked = "Pilih minimal satu sumber yang sudah dicek.";
  }
  for (const [k, maks] of Object.entries(MAKS) as Array<[keyof typeof MAKS, number]>) {
    if (!g[k] && i[k].trim().length > maks) g[k] = `Paling banyak ${maks} karakter.`;
  }
  if (!g.question_text && (i.question_text.match(/\?/g) ?? []).length > 1) {
    g.question_text = "Hanya satu pertanyaan: paling banyak satu tanda tanya.";
  }
  return g;
}

/**
 * Bangun body `POST /api/v1/narasi/klarifikasi`. `exposure` selalu nilai `paparan` antrean
 * kasus (baca-saja), bukan isian pengguna.
 *
 * @param narasiId - Id kasus.
 * @param exposure - Nilai paparan kasus.
 * @param i - Isian yang lolos {@link validasiBuat}.
 */
export function bodyBuat(
  narasiId: string,
  exposure: KlarifikasiCreate["exposure"],
  i: IsianBuat,
): KlarifikasiCreate {
  return {
    narasi_id: narasiId,
    claim_id: i.claim_id.trim(),
    source_ids_checked: i.source_ids_checked,
    materiality_reason: i.materiality_reason.trim(),
    alternative_hypothesis: i.alternative_hypothesis.trim(),
    intended_decision: i.intended_decision.trim(),
    recipient_role: i.recipient_role.trim(),
    periode: i.periode.trim(),
    exposure,
    due_trigger: i.due_trigger.trim(),
    question_text: i.question_text.trim(),
  };
}

/** Isian panel "Terapkan ke register klarifikasi" (usulan P04). */
export interface IsianDariUsulan {
  claim_id: string;
  due_trigger: string;
  /** Kosong = pakai `why_ask` usulan. */
  intended_decision: string;
}

/** Validasi panel P04: klaim (maks 100) dan pemicu wajib. */
export function validasiDariUsulan(i: IsianDariUsulan): GalatForm<keyof IsianDariUsulan> {
  const g: GalatForm<keyof IsianDariUsulan> = {};
  if (!i.claim_id.trim()) g.claim_id = "Klaim wajib diisi.";
  else if (i.claim_id.trim().length > MAKS.claim_id) {
    g.claim_id = `Paling banyak ${MAKS.claim_id} karakter.`;
  }
  if (!i.due_trigger.trim()) g.due_trigger = "Pemicu batas waktu wajib diisi.";
  return g;
}

/** Bangun body `POST .../dari-usulan/{ai_usulan_id}`; keputusan kosong tidak dikirim (`null`). */
export function bodyDariUsulan(
  exposure: KlarifikasiDariUsulan["exposure"],
  i: IsianDariUsulan,
): KlarifikasiDariUsulan {
  return {
    claim_id: i.claim_id.trim(),
    due_trigger: i.due_trigger.trim(),
    exposure,
    intended_decision: i.intended_decision.trim() || null,
  };
}

/**
 * Apakah panel "Terapkan ke register klarifikasi" tampil: usulan `P04` yang sudah diserap
 * (`isi`), `isi.material === true`, dan putusan terakhir `APPROVE`/`REVISE`.
 *
 * @param fungsi - Kode fungsi usulan.
 * @param isi - `isi` usulan (null/undefined bila belum diserap).
 * @param putusanTerakhir - Putusan terbaru atau null/undefined.
 */
export function panelTerapkanP04Tampil(
  fungsi: string,
  isi: unknown,
  putusanTerakhir: string | null | undefined,
): boolean {
  if (fungsi !== "P04") return false;
  if (typeof isi !== "object" || isi === null) return false;
  if ((isi as Record<string, unknown>).material !== true) return false;
  return putusanTerakhir === "APPROVE" || putusanTerakhir === "REVISE";
}

/** Pesan Indonesia spesifik per kode galat 409/422 backend register klarifikasi. */
export const PESAN_GALAT_KLARIFIKASI: Readonly<Record<string, string>> = {
  REVIEWER_TIDAK_INDEPENDEN:
    "Penyusun pertanyaan tidak boleh menyetujui pertanyaannya sendiri. Minta reviewer lain.",
  KLARIFIKASI_GANDA:
    "Sudah ada klarifikasi terbuka untuk klaim ini. Selesaikan atau batalkan yang lama dulu.",
  KLARIFIKASI_BELUM_DISETUJUI:
    "Pertanyaan belum disetujui reviewer, jawabannya belum dapat dicatat.",
  KLARIFIKASI_TIDAK_TERBUKA: "Klarifikasi ini sudah tidak terbuka; muat ulang halaman.",
  PERSETUJUAN_SUDAH_ADA: "Pertanyaan ini sudah diputuskan reviewer; muat ulang halaman.",
  USULAN_BELUM_DITERIMA: "Usulan belum diterima reviewer (putusan APPROVE/REVISE).",
  USULAN_SUDAH_DITERAPKAN: "Usulan ini sudah diterapkan ke register klarifikasi.",
  USULAN_BUKAN_P04: "Usulan ini bukan usulan P04 atas kasus narasi.",
  USULAN_TIDAK_MATERIAL: "Usulan P04 ini tidak material atau tanpa pertanyaan.",
  PERIODE_TAK_ADA: "Periode usulan tidak ditemukan.",
  ISIAN_USULAN_KURANG:
    "Usulan tanpa peran penerima atau tanpa alasan bertanya; isi keputusan yang dibantu.",
};

/**
 * Ganti pesan galat dengan pesan Indonesia spesifik bila kodenya dikenal; `code`, `details`,
 * `requestId`, dan `status` dipertahankan agar `X-Request-ID` tetap tampil.
 *
 * @param err - Galat hasil panggilan API.
 * @returns `ApiError` berpesan spesifik, atau `err` apa adanya.
 */
export function petakanGalatKlarifikasi(err: unknown): unknown {
  if (!(err instanceof ApiError)) return err;
  const pesan = PESAN_GALAT_KLARIFIKASI[err.code];
  if (!pesan) return err;
  return new ApiError(
    { code: err.code, message: pesan, details: err.details },
    err.requestId,
    err.status,
  );
}

/**
 * Ambil id klarifikasi yang sudah ada dari galat 409 `USULAN_SUDAH_DITERAPKAN`
 * (`details[0].msg`).
 *
 * @returns Id, atau `null` bila galat bukan itu / `details` tak memuatnya.
 */
export function idKlarifikasiSudahAda(err: unknown): string | null {
  if (!(err instanceof ApiError) || err.code !== "USULAN_SUDAH_DITERAPKAN") return null;
  const d = err.details[0];
  if (typeof d === "object" && d !== null) {
    const msg = (d as Record<string, unknown>).msg;
    if (typeof msg === "string" && msg) return msg;
  }
  return null;
}
