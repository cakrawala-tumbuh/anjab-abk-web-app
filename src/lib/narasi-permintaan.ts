/**
 * Logika murni panel permintaan draf AI atas kasus narasi (Tim Kajian): pemetaan status
 * permintaan, pesan galat 409/422, dan pemilihan sumber. Tanpa efek samping.
 *
 * INVARIAN: tak satu pun teks keluaran memuat kata "berhasil" atau "selesai". Permintaan yang
 * belum diserap belum menghasilkan apa pun; hanya `hasil_serap` yang menyatakan akhir proses.
 */
import { ApiError } from "@/lib/api/errors";
import type { PermintaanAiRead } from "@/lib/api/schema";

/** Status kasus yang boleh diajukan ke AI (cermin `STATUS_BOLEH_AJUKAN` backend). */
export const STATUS_KASUS_BOLEH_AJUKAN = ["SOURCE_CHECKED", "NEED_FACT"] as const;

/** Peringatan bila `sumber_ids` kosong (R11-003): tetap boleh dikirim. */
export const PERINGATAN_TANPA_SUMBER =
  "Tanpa sumber, permintaan tetap dikirim tetapi hasilnya NEED_FACT: kasus meminta fakta atau sumber tambahan, bukan draf teks.";

/** Pesan setelah respons 202. Permintaan diterima; draf belum ada. */
export const PESAN_DITERIMA =
  "Permintaan diterima dan masuk antrean (AI_PENDING). Draf belum tersedia; status di bawah diperbarui otomatis.";

/** Pengingat bahwa jalur manual selalu tersedia. */
export const PESAN_JALUR_MANUAL =
  "Jalur manual tetap tersedia: tulis revisi manual bersumber di bawah, kapan pun.";

/** Kode status tampilan satu permintaan. */
export type KodeStatusPermintaan =
  | "AI_PENDING"
  | "GAGAL"
  | "MENUNGGU_SERAP"
  | "MANUAL_REVIEW"
  | "DRAF_TERSEDIA"
  | "NEED_FACT"
  | "TAK_DIKENAL";

/** Hasil pemetaan {@link statusPermintaanAi}. */
export interface TampilanPermintaan {
  /** Kode status tampilan. */
  kode: KodeStatusPermintaan;
  /** Judul pendek status. */
  judul: string;
  /** Keterangan satu kalimat untuk pembaca awam. */
  keterangan: string;
  /** Kode galat/serap yang perlu ditampilkan (kosong bila tak ada). */
  kodeTeknis: string[];
  /** `true` bila hasil run sudah diserap (`diserap_at` terisi). */
  diserap: boolean;
  /** `true` bila ada draf yang menunggu tinjauan sehingga tautan antrean relevan. */
  tautanAntrean: boolean;
}

/** Bentuk minimal permintaan yang dibaca pemetaan. */
export type ItemPermintaan = Pick<
  PermintaanAiRead,
  "job_status" | "job_error_code" | "diserap_at" | "hasil_serap" | "kode_serap"
>;

/**
 * Satu-satunya pemetaan status permintaan draf AI.
 *
 * Belum diserap (`diserap_at` kosong): `PENDING`/`RUNNING` → `AI_PENDING`; `FAILED` → gagal
 * (menunggu percobaan ulang atau jalur manual, dengan `job_error_code`); `SUCCEEDED` →
 * menunggu penyerapan, BUKAN sukses; `MANUAL_REVIEW` → `MANUAL_REVIEW`. Sudah diserap:
 * `VERSI_DIBUAT` → draf tersedia belum ditinjau; `NEED_FACT` → butuh fakta; `MANUAL` →
 * `MANUAL_REVIEW` beserta `kode_serap`.
 *
 * @param item - Permintaan dari `GET .../permintaan-ai`.
 * @returns Tampilan status; nilai tak dikenal menjadi `TAK_DIKENAL` (tidak pernah tampak sukses).
 */
export function statusPermintaanAi(item: ItemPermintaan): TampilanPermintaan {
  const diserap = item.diserap_at != null;
  if (!diserap) {
    switch (item.job_status) {
      case "PENDING":
      case "RUNNING":
        return {
          kode: "AI_PENDING",
          judul: "AI_PENDING",
          keterangan: "Permintaan sedang menunggu atau diproses. Belum ada draf.",
          kodeTeknis: [],
          diserap: false,
          tautanAntrean: false,
        };
      case "FAILED":
        return {
          kode: "GAGAL",
          judul: "Gagal diproses",
          keterangan:
            "Pemrosesan gagal. Permintaan dapat dicoba ulang oleh sistem; Anda juga bisa memakai jalur manual.",
          kodeTeknis: item.job_error_code ? [item.job_error_code] : [],
          diserap: false,
          tautanAntrean: false,
        };
      case "SUCCEEDED":
        return {
          kode: "MENUNGGU_SERAP",
          judul: "Menunggu penyerapan hasil",
          keterangan:
            "Pemrosesan di sisi AI berhenti, tetapi hasilnya belum diserap ke kasus. Belum ada draf.",
          kodeTeknis: [],
          diserap: false,
          tautanAntrean: false,
        };
      case "MANUAL_REVIEW":
        return {
          kode: "MANUAL_REVIEW",
          judul: "MANUAL_REVIEW",
          keterangan: "Permintaan dialihkan ke jalur manual. Tulis revisi manual bersumber.",
          kodeTeknis: item.job_error_code ? [item.job_error_code] : [],
          diserap: false,
          tautanAntrean: false,
        };
      default:
        return takDikenal(item, false);
    }
  }
  switch (item.hasil_serap) {
    case "VERSI_DIBUAT":
      return {
        kode: "DRAF_TERSEDIA",
        judul: "Draf tersedia, belum ditinjau",
        keterangan:
          "Satu versi draf AI sudah masuk ke kasus. Draf ini kandidat dan belum diperiksa siapa pun.",
        kodeTeknis: [],
        diserap: true,
        tautanAntrean: true,
      };
    case "NEED_FACT":
      return {
        kode: "NEED_FACT",
        judul: "Butuh fakta",
        keterangan: "AI tidak membuat draf: fakta atau sumber belum memadai.",
        kodeTeknis: [],
        diserap: true,
        tautanAntrean: false,
      };
    case "MANUAL":
      return {
        kode: "MANUAL_REVIEW",
        judul: "MANUAL_REVIEW",
        keterangan: "Hasil tidak dapat dipakai sebagai draf. Lanjutkan lewat jalur manual.",
        kodeTeknis: item.kode_serap ?? [],
        diserap: true,
        tautanAntrean: false,
      };
    default:
      return takDikenal(item, true);
  }
}

function takDikenal(item: ItemPermintaan, diserap: boolean): TampilanPermintaan {
  return {
    kode: "TAK_DIKENAL",
    judul: "Status tidak dikenal",
    keterangan: "Status permintaan tidak dikenali halaman ini. Anggap belum ada draf.",
    kodeTeknis: [String(diserap ? item.hasil_serap : item.job_status)],
    diserap,
    tautanAntrean: false,
  };
}

/** `true` bila setidaknya satu permintaan belum diserap (halaman perlu terus disegarkan). */
export function adaBelumDiserap(items: readonly Pick<PermintaanAiRead, "diserap_at">[]): boolean {
  return items.some((i) => i.diserap_at == null);
}

/** Pesan tetap untuk kode 409 yang dikenal. */
export const PESAN_409: Record<string, string> = {
  feature_disabled:
    "AI belum dinyalakan di sistem ini, sehingga permintaan tidak dikirim. Lanjutkan lewat jalur manual.",
  pii_mode_belum_didukung:
    "Mode pengamanan data pribadi yang berlaku belum didukung untuk permintaan draf AI.",
  narasi_status_tidak_sah:
    "Status kasus saat ini tidak mengizinkan permintaan draf AI. Hanya SOURCE_CHECKED atau NEED_FACT.",
  permintaan_berjalan:
    "Kasus ini masih punya permintaan yang hasilnya belum diserap. Tunggu sampai diserap.",
  izin_sumber_tidak_ada:
    "Ada sumber yang dipilih tanpa izin AI. Lepas sumber itu atau ubah izinnya lebih dulu.",
  fungsi_belum_aktif:
    "Fungsi draf AI belum diaktifkan di sistem ini. Lanjutkan lewat jalur manual.",
};

/**
 * Pesan galat siap-tampil untuk kegagalan pengajuan.
 *
 * 409 dengan kode dikenal memakai {@link PESAN_409}; 422 memakai pesan backend (menyebut
 * sumber yang tak dikenal); selain itu pesan galat apa adanya.
 *
 * @param err - Galat yang ditangkap dari pemanggilan.
 */
export function pesanGagalPengajuan(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 409 && PESAN_409[err.code]) return PESAN_409[err.code];
    if (err.status === 422) return `Permintaan ditolak: ${err.message}`;
    return err.message;
  }
  return err instanceof Error ? err.message : "Permintaan gagal dikirim.";
}

/** Bentuk minimal sumber untuk pemilih. */
export interface OpsiSumberAi {
  id: string;
  judul: string;
  versi: string;
  periode: string;
  izin_ai: boolean;
}

/** Label izin AI satu sumber untuk pemilih. */
export function labelIzinAi(izin: boolean): string {
  return izin ? "berizin AI" : "tanpa izin AI";
}

/** Daftar id sumber terpilih tanpa duplikat, urut pemilihan. */
export function bodyPengajuan(terpilih: readonly string[]): { sumber_ids: string[] } {
  return { sumber_ids: Array.from(new Set(terpilih)) };
}
