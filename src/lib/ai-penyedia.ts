/**
 * Logika murni layar pengaturan penyedia AI (`/sistem/ai/penyedia`).
 *
 * Tanpa React dan tanpa pemanggilan API: berisi label, teks keterangan fakta, dan penentu
 * peringatan yang dapat diuji langsung. Daftar opsi mode dan effort TIDAK ditulis di sini:
 * keduanya selalu berasal dari `mode_tersedia` dan `effort_tersedia` yang dikirim API.
 */
import type { AiPenyediaRead } from "@/lib/api/schema";

/** Panjang minimum `alasan` yang diterima backend untuk setiap aksi penyedia. */
export const ALASAN_MIN_PENYEDIA = 5;

/** Panjang minimum kunci API (setelah spasi pengapit dibuang) yang diterima backend. */
export const KUNCI_API_MIN = 20;

/** Nilai `mode` yang memakai paket langganan Anthropic. */
export const MODE_LANGGANAN = "LANGGANAN_CLAUDE";

/** Perintah yang dijalankan operator di dalam kontainer untuk masuk ke CLI langganan. */
export const PERINTAH_MASUK_CLI = "claude auth login";

/**
 * Keterangan fakta pada bagian mode langganan. Ditampilkan apa adanya, tanpa kalimat larangan.
 */
export const KETERANGAN_LANGGANAN =
  "Mode ini memakai paket langganan Anthropic (Pro, Max, dan sejenisnya), bukan Anthropic API. " +
  "Tanggung jawab atas pemakaian ada pada pemilik akun. Paket konsumen dapat memakai data untuk " +
  "pelatihan model bila pengaturan akun aktif, dengan retensi sampai 5 tahun. Tidak ada jaminan " +
  "lokasi pemrosesan atau Zero Data Retention.";

/** Tautan rujukan yang mengiringi {@link KETERANGAN_LANGGANAN}. */
export const TAUTAN_LANGGANAN: ReadonlyArray<{ href: string; label: string }> = [
  { href: "https://claude.ai/settings/data-privacy-controls", label: "Pengaturan akun" },
  { href: "https://code.claude.com/docs/en/data-usage.md", label: "Pemakaian data" },
  {
    href: "https://code.claude.com/docs/en/legal-and-compliance.md",
    label: "Hukum dan kepatuhan",
  },
];

const LABEL_MODE: Record<string, string> = {
  MATI: "Mati",
  API_ANTHROPIC: "Anthropic API",
  LANGGANAN_CLAUDE: "Langganan Anthropic (Pro/Max)",
};

/**
 * Label tampilan sebuah mode penyedia.
 *
 * @param mode - Nilai `mode` dari API.
 * @returns Label berbahasa Indonesia; nilai tak dikenal dikembalikan apa adanya supaya mode
 *   baru dari backend tetap terbaca dan dapat dipilih.
 */
export function labelMode(mode: string): string {
  return LABEL_MODE[mode] ?? mode;
}

/**
 * Apakah CLI langganan siap dipakai (terpasang dan sudah masuk).
 *
 * @param p - Pengaturan penyedia dari API.
 * @returns `true` bila `langganan_cli_terpasang` dan `langganan_cli_masuk` keduanya benar.
 */
export function cliLanggananSiap(
  p: Pick<AiPenyediaRead, "langganan_cli_terpasang" | "langganan_cli_masuk">,
): boolean {
  return p.langganan_cli_terpasang && p.langganan_cli_masuk;
}

/**
 * Apakah peringatan "panggilan model akan gagal" perlu tampil.
 *
 * Hanya bila mode terpilih adalah langganan dan CLI belum siap. Peringatan ini informasi,
 * bukan pemblokiran: memilih mode langganan tetap diizinkan.
 *
 * @param p - Pengaturan penyedia dari API.
 */
export function perluPeringatanCli(
  p: Pick<AiPenyediaRead, "mode" | "langganan_cli_terpasang" | "langganan_cli_masuk">,
): boolean {
  return p.mode === MODE_LANGGANAN && !cliLanggananSiap(p);
}

/**
 * Teks status kunci API yang aman ditampilkan: hanya `Terpasang` dan empat karakter akhir.
 *
 * @param p - Pengaturan penyedia dari API.
 * @returns `Terpasang …abcd` atau `Belum terpasang`. Nilai kunci tidak pernah ada di API.
 */
export function teksStatusKunci(
  p: Pick<AiPenyediaRead, "kredensial_terpasang" | "kredensial_akhiran">,
): string {
  if (!p.kredensial_terpasang) return "Belum terpasang";
  return p.kredensial_akhiran ? `Terpasang …${p.kredensial_akhiran}` : "Terpasang";
}
