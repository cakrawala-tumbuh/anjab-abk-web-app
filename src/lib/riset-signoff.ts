/**
 * Logika murni sign-off PI/etik protokol riset (OD-09): validasi formulir unggah, perakitan
 * `FormData` untuk Route Handler, pemetaan galat backend ke pesan Indonesia, dan keterangan
 * gerbang P08. Batas mencerminkan backend (`riset_signoff_max_bytes` = 5 MiB, `pi_nama` ≤ 200,
 * `nomor_persetujuan_etik` ≤ 100).
 */
import { ApiError } from "@/lib/api/errors";
import { pesanGagal } from "@/lib/notify";
import { galatField422, type Galat } from "@/lib/riset";

/** Batas ukuran lampiran PDF dalam byte (5 MiB, cermin backend). */
export const BATAS_BERKAS_BYTE = 5 * 1024 * 1024;

/** Batas karakter tiap isian teks (cermin backend). */
export const BATAS_SIGNOFF = { piNama: 200, nomor: 100 } as const;

/** Teks konfirmasi sebelum sign-off dikirim (sign-off tidak bisa diubah). */
export const KONFIRMASI_SIGNOFF =
  "Sign-off PI/etik tidak dapat diubah atau diganti setelah disimpan. Lanjutkan?";

/** Nama field formulir yang dapat dipetakan dari galat 422 backend. */
export const FIELD_SIGNOFF = [
  "pi_nama",
  "tanggal_persetujuan_etik",
  "nomor_persetujuan_etik",
  "lampiran",
] as const;

/** Nama field formulir sign-off. */
export type FieldSignoff = (typeof FIELD_SIGNOFF)[number];

/** Berkas terpilih (subset `File` yang dibutuhkan validasi). */
export interface BerkasTerpilih {
  name: string;
  type: string;
  size: number;
}

/** Isian formulir sign-off. */
export interface IsianSignoff {
  pi_nama: string;
  tanggal_persetujuan_etik: string;
  nomor_persetujuan_etik: string;
  berkas: BerkasTerpilih | null;
}

/**
 * Format tanggal lokal `YYYY-MM-DD` (bukan UTC, agar sama dengan nilai `<input type="date">`).
 *
 * @param d - Tanggal yang diformat; bawaan sekarang.
 * @returns String `YYYY-MM-DD`.
 */
export function tanggalLokal(d: Date = new Date()): string {
  const dua = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
}

/**
 * Format ukuran berkas untuk manusia (B, KiB, MiB; desimal koma).
 *
 * @param byte - Ukuran dalam byte.
 * @returns Mis. `340 KiB` atau `1,5 MiB`.
 */
export function formatUkuran(byte: number): string {
  if (byte < 1024) return `${byte} B`;
  const angka = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  if (byte < 1024 * 1024) return `${angka(byte / 1024)} KiB`;
  return `${angka(byte / (1024 * 1024))} MiB`;
}

/** Berkas dianggap PDF bila MIME `application/pdf`, atau MIME kosong dengan ekstensi `.pdf`. */
function adalahPdf(b: BerkasTerpilih): boolean {
  if (b.type) return b.type === "application/pdf";
  return b.name.toLowerCase().endsWith(".pdf");
}

/**
 * Validasi formulir sign-off sebelum dikirim.
 *
 * Aturan: nama PI wajib (≤ 200), tanggal persetujuan etik wajib, sah, dan tidak di masa
 * depan; nomor opsional (≤ 100); berkas wajib, PDF, tidak kosong, dan ≤ 5 MiB. Backend tetap
 * penentu akhir (memeriksa isi berkas sebenarnya).
 *
 * @param i - Isian formulir.
 * @param hariIni - Tanggal hari ini `YYYY-MM-DD` (bawaan {@link tanggalLokal}).
 * @returns Peta field → pesan; kosong bila valid.
 */
export function validasiSignoff(
  i: IsianSignoff,
  hariIni: string = tanggalLokal(),
): Galat<FieldSignoff> {
  const e: Galat<FieldSignoff> = {};
  const nama = i.pi_nama.trim();
  if (!nama) e.pi_nama = "Nama PI wajib diisi.";
  else if (nama.length > BATAS_SIGNOFF.piNama) {
    e.pi_nama = `Nama PI maksimal ${BATAS_SIGNOFF.piNama} karakter.`;
  }

  const tgl = i.tanggal_persetujuan_etik.trim();
  if (!tgl) e.tanggal_persetujuan_etik = "Tanggal persetujuan etik wajib diisi.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(tgl) || Number.isNaN(Date.parse(`${tgl}T00:00:00Z`))) {
    e.tanggal_persetujuan_etik = "Tanggal persetujuan etik tidak sah.";
  } else if (tgl > hariIni) {
    e.tanggal_persetujuan_etik = "Tanggal persetujuan etik tidak boleh di masa depan.";
  }

  if (i.nomor_persetujuan_etik.trim().length > BATAS_SIGNOFF.nomor) {
    e.nomor_persetujuan_etik = `Nomor persetujuan maksimal ${BATAS_SIGNOFF.nomor} karakter.`;
  }

  if (!i.berkas) e.lampiran = "Berkas PDF persetujuan etik wajib dipilih.";
  else if (!adalahPdf(i.berkas)) e.lampiran = "Berkas harus berformat PDF.";
  else if (i.berkas.size === 0) e.lampiran = "Berkas kosong.";
  else if (i.berkas.size > BATAS_BERKAS_BYTE) {
    e.lampiran = `Berkas melebihi 5 MiB (ukuran ${formatUkuran(i.berkas.size)}).`;
  }
  return e;
}

/**
 * Rakit `FormData` untuk `POST /api/riset/protokol/{id}/sign-off`. Nomor kosong tidak
 * dikirim sama sekali.
 *
 * @param i - Isian yang sudah lolos {@link validasiSignoff}.
 * @param berkas - Berkas PDF terpilih.
 * @returns `FormData` multipart.
 */
export function formSignoff(i: IsianSignoff, berkas: File): FormData {
  const fd = new FormData();
  fd.set("pi_nama", i.pi_nama.trim());
  fd.set("tanggal_persetujuan_etik", i.tanggal_persetujuan_etik.trim());
  const nomor = i.nomor_persetujuan_etik.trim();
  if (nomor) fd.set("nomor_persetujuan_etik", nomor);
  fd.set("lampiran", berkas);
  return fd;
}

/**
 * Petakan galat unggah sign-off ke pesan Indonesia spesifik. Kode dikenali: 409
 * `SIGNOFF_SUDAH_ADA`, 409 `PROTOKOL_BELUM_TERKUNCI`, 422 `LAMPIRAN_BUKAN_PDF`, 422
 * `LAMPIRAN_TERLALU_BESAR`, dan status 413 (body melebihi batas). Selain itu pesan backend
 * dipakai apa adanya.
 *
 * @param err - Galat hasil unggah.
 * @returns Pesan siap tampil.
 */
export function pesanGalatSignoff(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "SIGNOFF_SUDAH_ADA") {
      return "Protokol ini sudah punya sign-off PI/etik; sign-off tidak dapat diubah atau diganti.";
    }
    if (err.code === "PROTOKOL_BELUM_TERKUNCI") {
      return "Kunci protokol dulu sebelum mencatat sign-off PI/etik.";
    }
    if (err.code === "LAMPIRAN_BUKAN_PDF") return "Berkas yang diunggah bukan PDF yang sah.";
    if (err.code === "LAMPIRAN_TERLALU_BESAR" || err.status === 413) {
      return "Berkas melebihi batas 5 MiB.";
    }
  }
  return pesanGagal(err);
}

/**
 * Peta galat 422 validasi form backend ke field (`loc` terakhir). Tidak memetakan kode
 * `LAMPIRAN_*` (itu ditangani {@link pesanGalatSignoff}).
 *
 * @param err - Galat hasil unggah.
 * @returns Peta field → pesan; kosong bila bukan 422 validasi.
 */
export function galatFieldSignoff(err: unknown): Galat<FieldSignoff> {
  return galatField422(err, FIELD_SIGNOFF);
}

/**
 * Keterangan mengapa tombol sintesis P08 nonaktif.
 *
 * @param signoffAda - Protokol sudah punya sign-off PI/etik.
 * @param jumlahTerverifikasi - Jumlah statistik `TERVERIFIKASI`.
 * @returns Teks penjelas, atau `undefined` bila tombol boleh aktif.
 */
export function alasanNonaktifP08(
  signoffAda: boolean,
  jumlahTerverifikasi: number,
): string | undefined {
  const alasan: string[] = [];
  if (!signoffAda) alasan.push("Butuh sign-off PI/etik (catat di bagian Sign-off PI/etik).");
  if (jumlahTerverifikasi < 1) alasan.push("Butuh minimal satu statistik terverifikasi.");
  return alasan.length > 0 ? alasan.join(" ") : undefined;
}

/** Path publik unduhan lampiran sign-off (Route Handler dengan Bearer dari sesi server). */
export function pathUnduhSignoff(protokolId: string): string {
  return `/api/riset/protokol/${encodeURIComponent(protokolId)}/sign-off/lampiran`;
}
