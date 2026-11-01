/**
 * Kosakata dan validasi klien untuk alternatif redesain (selaras 422 backend).
 */
import type { AlternatifCreate } from "@/lib/api/schema";

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
