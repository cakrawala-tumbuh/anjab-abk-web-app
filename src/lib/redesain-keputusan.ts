/**
 * Fungsi murni keputusan prioritas final redesain (WEB-5b): opsi, pratinjau peringatan,
 * dan validasi klien. Web TIDAK menghitung saran prioritas; peringatan resmi datang dari
 * `peringatan[]` respons backend, pratinjau di sini hanya petunjuk sebelum simpan.
 */
import type { PenilaianPutuskan, PenilaianRead } from "@/lib/api/schema";

/** Opsi `prioritas_final` (urutan tampil). */
export const OPSI_PRIORITAS_FINAL = [
  "P0 - Eskalasi",
  "K - Klarifikasi",
  "P1 - Utama",
  "P2 - Berikutnya",
  "P3 - Pantau",
  "Ditunda",
] as const;

/** Opsi status penilaian yang boleh dipilih manual (`Telah diputuskan` hanya lewat putuskan). */
export const OPSI_STATUS_PILIHAN = [
  "Belum ditelaah",
  "Perlu klarifikasi",
  "Siap untuk telaah yayasan",
  "Ditunda",
] as const;

/** Teks tetap pada dialog keputusan. */
export const TEKS_PENCATAT_KEPUTUSAN =
  "Dicatat Tim Kajian atas keputusan pemutus; yayasan tidak mengisi di aplikasi.";

/** Pratinjau peringatan P1–P3 pada bukti yang belum diperkuat untuk klaim (PT-2). */
export const TEKS_PERINGATAN_PRATINJAU =
  "Prioritas P1–P3 pada bukti yang belum diperkuat untuk klaim — alasan wajib menjelaskannya";

/** Kode peringatan backend yang dikenali. */
export const KODE_PRIORITAS_TANPA_BUKTI = "PRIORITAS_TANPA_BUKTI";
export const KODE_BERBEDA_DARI_SARAN = "BERBEDA_DARI_SARAN";

/**
 * Apakah pilihan prioritas ∈ P1–P3 (bukan P0/K/Ditunda).
 *
 * @param prioritas - Nilai `prioritas_final` terpilih.
 */
export function adalahP1ke3(prioritas: string): boolean {
  return /^P[123] - /.test(prioritas);
}

/**
 * Pratinjau peringatan PT-2: tampil bila prioritas ∈ P1–P3 dan bukti belum diperkuat.
 *
 * @param prioritas - Prioritas final terpilih (`""` bila belum).
 * @param statusBukti - `status_bukti` penilaian.
 * @returns `true` bila pratinjau peringatan harus ditampilkan (tidak memblokir simpan).
 */
export function perluPeringatanPratinjau(prioritas: string, statusBukti: string): boolean {
  return adalahP1ke3(prioritas) && statusBukti !== "Diperkuat untuk klaim";
}

/**
 * Tanggal hari ini (acuan WIB) dalam format `YYYY-MM-DD`.
 *
 * @param sekarang - Waktu acuan (default: sekarang); parameter ini untuk pengujian.
 */
export function hariIniWib(sekarang: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(sekarang);
}

/** Isian dialog keputusan (semua string agar cocok dengan kontrol form). */
export interface IsianKeputusan {
  prioritas_final: string;
  alasan_final: string;
  pemutus_kode_orang: string;
  pemutus_jabatan: string;
  tanggal_keputusan: string;
}

/** Galat validasi per field (hanya field bermasalah yang ada). */
export type GalatKeputusan = Partial<Record<keyof IsianKeputusan, string>>;

/**
 * Validasi klien isian keputusan: kelimanya wajib, tanggal tidak di masa depan.
 *
 * @param isian - Isian dialog.
 * @param hariIni - Tanggal acuan `YYYY-MM-DD` (default: {@link hariIniWib}).
 * @returns Peta galat; kosong bila valid.
 */
export function validasiKeputusan(
  isian: IsianKeputusan,
  hariIni: string = hariIniWib(),
): GalatKeputusan {
  const g: GalatKeputusan = {};
  if (!isian.prioritas_final) g.prioritas_final = "Pilih prioritas final.";
  if (!isian.alasan_final.trim()) g.alasan_final = "Alasan wajib diisi.";
  if (!isian.pemutus_kode_orang) g.pemutus_kode_orang = "Pilih kode orang pemutus.";
  if (!isian.pemutus_jabatan.trim()) g.pemutus_jabatan = "Jabatan pemutus wajib diisi.";
  if (!isian.tanggal_keputusan) g.tanggal_keputusan = "Tanggal keputusan wajib diisi.";
  else if (isian.tanggal_keputusan > hariIni)
    g.tanggal_keputusan = "Tanggal keputusan tidak boleh di masa depan.";
  return g;
}

/**
 * Rakit payload `putuskan` dari isian yang sudah valid.
 *
 * @param isian - Isian dialog (sudah lolos {@link validasiKeputusan}).
 */
export function payloadPutuskan(isian: IsianKeputusan): PenilaianPutuskan {
  return {
    prioritas_final: isian.prioritas_final as PenilaianPutuskan["prioritas_final"],
    alasan_final: isian.alasan_final.trim(),
    pemutus_kode_orang: isian.pemutus_kode_orang,
    pemutus_jabatan: isian.pemutus_jabatan.trim(),
    tanggal_keputusan: isian.tanggal_keputusan,
  };
}

/**
 * Pemutus untuk tampilan: kode + jabatan, TIDAK pernah nama.
 *
 * @param p - Penilaian.
 * @returns `"O-0001 — Ketua"`, atau `"—"` bila belum diputuskan.
 */
export function labelPemutus(
  p: Pick<PenilaianRead, "pemutus_kode_orang" | "pemutus_jabatan">,
): string {
  if (!p.pemutus_kode_orang) return "—";
  return p.pemutus_jabatan
    ? `${p.pemutus_kode_orang} — ${p.pemutus_jabatan}`
    : p.pemutus_kode_orang;
}
