/**
 * Kosakata dan validasi klien untuk alternatif redesain (selaras 422 backend).
 */
import type {
  AlternatifCreate,
  EstimasiDelta,
  KeputusanPerubahanCreate,
  KesiapanCreate,
  StatusKesiapan,
} from "@/lib/api/schema";

/** Judul bagian alternatif; teks pemisah dari skor K1–K4 bersifat tetap. */
export const JUDUL_ALTERNATIF =
  "Alternatif redesain — BUKAN BAGIAN DARI SKOR K1–K4 — prioritas tinggi bukan izin memindahkan tugas";

/** Nilai kosakata `opsi` alternatif. */
export const OPSI_ALTERNATIF = [
  "Pertahankan",
  "Sederhanakan",
  "Hilangkan pengulangan terbukti",
  "Perjelas kewenangan",
  "Perbaiki alat/dukungan",
  "Uji terbatas",
  "Alihkan tugas bersyarat",
] as const;

/** Nilai kosakata `gap_penerima`. */
export const GAP_PENERIMA = ["Ya", "Tidak", "Belum tahu"] as const;

/** Nilai kosakata `status_telaah` (hanya berubah lewat pilihan pengguna). */
export const STATUS_TELAAH = [
  "Belum ditelaah",
  "Siap telaah",
  "Bersyarat",
  "Tunda gap material",
  "Ditolak",
  "Uji disetujui terpisah",
] as const;

/** Bagian isian yang divalidasi {@link validasiAlternatif}. */
export interface IsianAlternatif {
  opsi: AlternatifCreate["opsi"];
  status_telaah: AlternatifCreate["status_telaah"];
  keputusan: string;
  pemutus_kode_orang: string;
  pihak_penerima_jabatan_id: string;
}

/**
 * Validasi bersyarat sisi klien yang selaras dengan 422 backend.
 *
 * - `Uji disetujui terpisah` mewajibkan `keputusan` dan `pemutus_kode_orang`.
 * - `Alihkan tugas bersyarat` mewajibkan `pihak_penerima_jabatan_id`.
 *
 * @param v - Isian form.
 * @returns Daftar pesan galat (kosong bila valid).
 */
export function validasiAlternatif(v: IsianAlternatif): string[] {
  const galat: string[] = [];
  if (v.status_telaah === "Uji disetujui terpisah") {
    if (!v.keputusan.trim()) galat.push("Status Uji disetujui terpisah mewajibkan keputusan.");
    if (!v.pemutus_kode_orang)
      galat.push("Status Uji disetujui terpisah mewajibkan pemutus (kode orang).");
  }
  if (v.opsi === "Alihkan tugas bersyarat" && !v.pihak_penerima_jabatan_id) {
    galat.push("Opsi Alihkan tugas bersyarat mewajibkan pihak penerima.");
  }
  return galat;
}

// ---------------------------------------------------------------------------------------------
// Kesiapan penerima per periode dan keputusan perubahan (ChangeDecision)
// ---------------------------------------------------------------------------------------------

/** Pola periode kesiapan yang diterima backend, mis. `2026/27`. */
export const POLA_PERIODE = /^\d{4}\/\d{2}$/;

/** Teks tampilan delta yang tidak dapat diestimasi (tidak pernah ditampilkan sebagai 0). */
export const TEKS_TIDAK_DAPAT_DIESTIMASI = "Tidak dapat diestimasi";

/** Teks tampilan baris matriks yang belum pernah dinilai pada periode terpilih. */
export const TEKS_BELUM_DINILAI = "Belum dinilai";

/** Judul panel keputusan perubahan; sengaja terpisah dari panel keputusan prioritas. */
export const JUDUL_KEPUTUSAN_PERUBAHAN = "Keputusan perubahan (ChangeDecision)";

/** Nilai `status` kesiapan yang dapat dipilih. */
export const STATUS_KESIAPAN: readonly StatusKesiapan[] = ["READY", "CONDITIONAL", "HOLD"];

/** Nilai `keputusan` perubahan yang dapat dipilih. */
export const OPSI_KEPUTUSAN_PERUBAHAN: readonly KeputusanPerubahanCreate["keputusan"][] = [
  "APPROVE",
  "CONDITIONAL",
  "HOLD",
  "REJECT",
];

/** Ketiga sisi delta beban kerja pada penilaian kesiapan. */
export const SISI_DELTA = ["asal", "penerima", "organisasi"] as const;

/** Salah satu sisi dari {@link SISI_DELTA}. */
export type SisiDelta = (typeof SISI_DELTA)[number];

/**
 * Tahun ajaran berjalan dalam format `YYYY/YY` (tahun ajaran dimulai Juli).
 *
 * @param sekarang - Tanggal acuan (bawaan: hari ini).
 * @returns Mis. `2026/27` untuk November 2026 dan `2025/26` untuk Mei 2026.
 */
export function periodeBerjalan(sekarang: Date = new Date()): string {
  const tahun = sekarang.getFullYear();
  const awal = sekarang.getMonth() >= 6 ? tahun : tahun - 1;
  return `${awal}/${String((awal + 1) % 100).padStart(2, "0")}`;
}

/**
 * Apakah teks cocok dengan format periode `YYYY/YY` yang diterima backend.
 *
 * @param periode - Teks periode.
 */
export function periodeValid(periode: string): boolean {
  return POLA_PERIODE.test(periode);
}

/**
 * Format satu delta beban kerja (jam kerja efektif per periode) untuk tampilan.
 *
 * `NOT_ESTIMABLE` selalu tampil sebagai {@link TEKS_TIDAK_DAPAT_DIESTIMASI}, tidak pernah 0.
 * Angka 0 tetap "0". Baris yang belum dinilai (estimasi `null`) tampil "—".
 *
 * @param jam - Nilai dari backend (desimal sebagai string) atau `null`.
 * @param estimasi - Penanda estimasi, atau `null` bila belum dinilai.
 * @returns Teks siap tampil, mis. `12,5 jam`.
 */
export function formatDelta(
  jam: string | number | null | undefined,
  estimasi: EstimasiDelta | null | undefined,
): string {
  if (estimasi === "NOT_ESTIMABLE") return TEKS_TIDAK_DAPAT_DIESTIMASI;
  if (estimasi == null || jam == null || jam === "") return "—";
  const angka = Number(jam);
  if (!Number.isFinite(angka)) return "—";
  return `${String(angka).replace(".", ",")} jam`;
}

/** Isian satu sisi delta pada form kesiapan: angka atau tidak dapat diestimasi. */
export interface IsianDelta {
  mode: "ANGKA" | "NOT_ESTIMABLE";
  jam: string;
}

/** Isian form kesiapan yang divalidasi {@link validasiKesiapan}. */
export interface IsianKesiapan {
  penerima_id: string;
  /** Kosong (`""`) = belum dipilih; tidak ada status bawaan. */
  status: StatusKesiapan | "";
  syarat: string;
  alasan_hold: string;
  delta: Record<SisiDelta, IsianDelta>;
}

/** Isian awal form kesiapan: tanpa status, tiap delta mode angka kosong. */
export function isianKesiapanAwal(): IsianKesiapan {
  const kosong = (): IsianDelta => ({ mode: "ANGKA", jam: "" });
  return {
    penerima_id: "",
    status: "",
    syarat: "",
    alasan_hold: "",
    delta: { asal: kosong(), penerima: kosong(), organisasi: kosong() },
  };
}

/**
 * Validasi form kesiapan sisi klien (selaras 422 backend).
 *
 * - Penerima dan status wajib; status tidak punya nilai bawaan.
 * - `syarat` wajib bila CONDITIONAL, `alasan_hold` wajib bila HOLD.
 * - Tiap delta mode angka wajib berisi angka; mode tidak dapat diestimasi tidak mengirim angka.
 *
 * @param v - Isian form.
 * @returns Daftar pesan galat (kosong bila valid).
 */
export function validasiKesiapan(v: IsianKesiapan): string[] {
  const galat: string[] = [];
  if (!v.penerima_id) galat.push("Pilih penerima.");
  if (!v.status) galat.push("Pilih status kesiapan.");
  if (v.status === "CONDITIONAL" && !v.syarat.trim())
    galat.push("Status CONDITIONAL mewajibkan syarat.");
  if (v.status === "HOLD" && !v.alasan_hold.trim())
    galat.push("Status HOLD mewajibkan alasan hold.");
  for (const sisi of SISI_DELTA) {
    const d = v.delta[sisi];
    if (d.mode === "ANGKA" && (d.jam.trim() === "" || !Number.isFinite(Number(d.jam)))) {
      galat.push(`Delta ${sisi}: isi angka jam atau pilih "${TEKS_TIDAK_DAPAT_DIESTIMASI}".`);
    }
  }
  return galat;
}

/**
 * Bangun badan `POST .../kesiapan` dari isian yang sudah valid.
 *
 * @param v - Isian form (harus lolos {@link validasiKesiapan}).
 * @param periode - Periode `YYYY/YY` terpilih.
 */
export function payloadKesiapan(v: IsianKesiapan, periode: string): KesiapanCreate {
  const sisi = (s: SisiDelta) => ({
    jam: v.delta[s].mode === "ANGKA" ? Number(v.delta[s].jam) : null,
    estimasi: (v.delta[s].mode === "ANGKA" ? "ESTIMATED" : "NOT_ESTIMABLE") as EstimasiDelta,
  });
  const a = sisi("asal");
  const p = sisi("penerima");
  const o = sisi("organisasi");
  return {
    penerima_id: v.penerima_id,
    periode,
    status: v.status as StatusKesiapan,
    delta_asal_jam: a.jam,
    delta_asal_estimasi: a.estimasi,
    delta_penerima_jam: p.jam,
    delta_penerima_estimasi: p.estimasi,
    delta_organisasi_jam: o.jam,
    delta_organisasi_estimasi: o.estimasi,
    syarat: v.status === "CONDITIONAL" ? v.syarat.trim() : null,
    alasan_hold: v.status === "HOLD" ? v.alasan_hold.trim() : null,
  };
}

/**
 * Pilihan keputusan perubahan yang aktif menurut `status_opsi` matriks.
 *
 * APPROVE hanya bila opsi READY; CONDITIONAL tidak boleh saat opsi HOLD; HOLD dan REJECT
 * selalu boleh. Backend tetap menjadi penegak (409 ditampilkan apa adanya).
 *
 * @param statusOpsi - Status opsi dari matriks kesiapan.
 */
export function opsiKeputusanAktif(
  statusOpsi: StatusKesiapan,
): Record<KeputusanPerubahanCreate["keputusan"], boolean> {
  return {
    APPROVE: statusOpsi === "READY",
    CONDITIONAL: statusOpsi !== "HOLD",
    HOLD: true,
    REJECT: true,
  };
}

/** Isian form keputusan perubahan. */
export interface IsianKeputusanPerubahan {
  keputusan: KeputusanPerubahanCreate["keputusan"] | "";
  alasan: string;
  stop_rule: string;
}

/**
 * Validasi form keputusan perubahan: keputusan dipilih, alasan ≥ 5 karakter (tanpa spasi
 * tepi), `stop_rule` wajib bila CONDITIONAL.
 *
 * @param v - Isian form.
 * @returns Daftar pesan galat (kosong bila valid).
 */
export function validasiKeputusanPerubahan(v: IsianKeputusanPerubahan): string[] {
  const galat: string[] = [];
  if (!v.keputusan) galat.push("Pilih keputusan.");
  if (v.alasan.trim().length < 5) galat.push("Alasan minimal 5 karakter.");
  if (v.keputusan === "CONDITIONAL" && !v.stop_rule.trim())
    galat.push("Keputusan CONDITIONAL mewajibkan stop rule.");
  return galat;
}

/**
 * Bangun badan `POST .../keputusan-perubahan` dari isian yang sudah valid.
 *
 * @param v - Isian form (harus lolos {@link validasiKeputusanPerubahan}).
 * @param periode - Periode `YYYY/YY` terpilih.
 */
export function payloadKeputusanPerubahan(
  v: IsianKeputusanPerubahan,
  periode: string,
): KeputusanPerubahanCreate {
  return {
    periode,
    keputusan: v.keputusan as KeputusanPerubahanCreate["keputusan"],
    alasan: v.alasan.trim(),
    stop_rule: v.keputusan === "CONDITIONAL" ? v.stop_rule.trim() : null,
  };
}
