/**
 * Konstanta & fungsi murni wizard konfirmasi sekolah (modul Redesain Pekerjaan).
 *
 * Seluruh kosakata pilihan dan pemetaan pesan 409/422 backend dikumpulkan di sini supaya
 * dapat diuji langsung tanpa merender komponen.
 */
import { ApiError } from "@/lib/api/errors";

/** Pilihan `kesesuaian` (langkah 2). */
export const OPSI_KESESUAIAN = ["Ya", "Sebagian", "Tidak", "Belum bisa memastikan"] as const;

/** Pilihan skala `k1`…`k4` (langkah 3). "Belum tahu" bukan "Rendah". */
export const OPSI_SKALA = ["Tinggi", "Sedang", "Rendah", "Belum tahu"] as const;

/** Pilihan `indikasi_risiko` (langkah 4); kosakata A-2 hanya untuk field ini. */
export const OPSI_INDIKASI = ["Ada indikasi", "Tidak terlihat", "Belum tahu"] as const;

/** Teks tetap bila `indikasi_risiko` = "Ada indikasi". */
export const TEKS_ESKALASI = "Tim Kajian akan segera menindaklanjuti tanpa menunggu penilaian";

/** Rubrik bantuan K1–K4 (langkah 3), dari lampiran riset backlog. */
export const RUBRIK_K: ReadonlyArray<{
  kode: "k1" | "k2" | "k3" | "k4";
  label: string;
  pertanyaan: string;
  tinggi: string;
  sedang: string;
  rendah: string;
}> = [
  {
    kode: "k1",
    label: "K1",
    pertanyaan: "Apa akibatnya bagi murid, guru, orang tua, atau kegiatan sekolah?",
    tinggi: "Layanan/kegiatan penting benar-benar terganggu.",
    sedang: "Ada gangguan, tetapi terbatas.",
    rendah: "Dampaknya kecil.",
  },
  {
    kode: "k2",
    label: "K2",
    pertanyaan: "Apa yang terganggu kalau masalah ini tidak segera diperbaiki?",
    tinggi: "Bila ditunda, kewajiban atau tenggat penting terancam.",
    sedang: "Masih bisa ditangani tanpa akibat besar.",
    rendah: "Tidak mendesak menurut yang diketahui.",
  },
  {
    kode: "k3",
    label: "K3",
    pertanyaan: "Siapa saja yang terkena dampaknya?",
    tinggi: "Beberapa pihak/tahap penting terdampak berarti.",
    sedang: "Beberapa pihak, tetapi terbatas.",
    rendah: "Hanya bagian kecil.",
  },
  {
    kode: "k4",
    label: "K4",
    pertanyaan: "Apakah pekerjaan harus diulang, tertunda, salah, atau sulit diselesaikan?",
    tinggi: "Pengulangan, penantian, atau kesalahan menghambat secara berarti.",
    sedang: "Hambatan sesekali, masih tertangani.",
    rendah: "Hambatan kecil.",
  },
];

/** Label manusiawi field yang bisa disebut backend pada 422 `kirim`. */
export const LABEL_FIELD: Readonly<Record<string, string>> = {
  peran: "Jabatan/peran",
  kesesuaian: "Kesesuaian dugaan",
  k1: "K1",
  k2: "K2",
  k3: "K3",
  k4: "K4",
  indikasi_risiko: "Indikasi risiko",
  cerita_sebelum: "Cerita",
};

/** Posisi langkah wizard (1–5). */
export type Langkah = 1 | 2 | 3 | 4 | 5;

/** Bagian cap waktu/status konfirmasi yang menentukan langkah. */
export interface PenentuLangkah {
  status: string;
  cerita_dikunci_pada?: string | null;
  dugaan_ditampilkan_pada?: string | null;
}

/**
 * Langkah terjauh yang boleh dibuka, diturunkan dari cap waktu server.
 *
 * `terkirim` → 5 (semua read-only); belum dikunci → 1; dikunci tapi dugaan belum
 * ditampilkan → 2; selainnya → 5.
 */
export function langkahMaks(k: PenentuLangkah): Langkah {
  if (k.status === "terkirim") return 5;
  if (!k.cerita_dikunci_pada) return 1;
  if (!k.dugaan_ditampilkan_pada) return 2;
  return 5;
}

/** Langkah awal yang ditampilkan saat halaman dimuat. */
export function langkahAwal(k: PenentuLangkah): Langkah {
  if (k.status === "terkirim") return 5;
  if (!k.cerita_dikunci_pada) return 1;
  if (!k.dugaan_ditampilkan_pada) return 2;
  return 3;
}

/**
 * Pemetaan kode 409 backend ke pesan layar; `null` bila bukan kode yang dikenal.
 *
 * @param err - Error dari panggilan API.
 * @returns Pesan Bahasa Indonesia, atau `null` agar pemanggil memakai pesan backend.
 */
export function pesanKode409(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  switch (err.code) {
    case "CERITA_SUDAH_DIKUNCI":
      return "Cerita sudah dikunci dan tidak dapat diubah";
    case "CERITA_BELUM_DIKUNCI":
    case "DUGAAN_BELUM_DITAMPILKAN":
      return "Selesaikan langkah sebelumnya dahulu";
    default:
      return null;
  }
}

/** Ambil nama field dari `details` 422 (`loc` terakhir), tanpa duplikat. */
export function fieldKurang(err: ApiError): string[] {
  const hasil: string[] = [];
  for (const d of err.details) {
    const loc = (d as { loc?: unknown }).loc;
    if (!Array.isArray(loc) || loc.length === 0) continue;
    const f = String(loc[loc.length - 1]);
    if (f !== "body" && !hasil.includes(f)) hasil.push(f);
  }
  return hasil;
}

/**
 * Pesan siap-tampil untuk kegagalan mutasi wizard.
 *
 * 409 berkode dikenal → pesan pemetaan; 422 → menyebut field yang kurang (label manusiawi);
 * lainnya → pesan backend apa adanya.
 */
export function pesanGagalWizard(err: unknown): string {
  const p409 = pesanKode409(err);
  if (p409) return p409;
  if (err instanceof ApiError && err.status === 422) {
    const f = fieldKurang(err);
    if (f.length > 0) {
      return `Belum lengkap: ${f.map((x) => LABEL_FIELD[x] ?? x).join(", ")}.`;
    }
  }
  return err instanceof Error ? err.message : "Terjadi kesalahan.";
}

/** Bagian baris `konfirmasi/saya` yang dibutuhkan untuk menentukan pergantian versi. */
export interface PenentuGanti {
  id: string;
  menggantikan_id?: string | null;
}

/**
 * Kumpulkan id record yang sudah DIGANTIKAN: ada record lain di daftar yang
 * `menggantikan_id`-nya menunjuk record itu. Dihitung di web karena respons
 * `konfirmasi/saya` tidak memuat `digantikan`.
 *
 * @param daftar - Seluruh isian milik pemanggil.
 * @returns Himpunan id record yang telah digantikan.
 */
export function idDigantikan(daftar: ReadonlyArray<PenentuGanti>): Set<string> {
  const hasil = new Set<string>();
  for (const k of daftar) if (k.menggantikan_id) hasil.add(k.menggantikan_id);
  return hasil;
}

/** Pesan layar untuk ralat yang dijawab 409. */
export const PESAN_RALAT_409 = "Isian ini sudah diralat atau masih draf";
