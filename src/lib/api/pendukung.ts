/**
 * Data PENDUKUNG di jalur BACA Server Component.
 *
 * Data pendukung = daftar yang hanya dipakai untuk **mengisi dropdown** atau
 * **melabeli ID** (daftar jabatan, sekolah, partisipan, …) — bukan data inti
 * halaman. Perlakuannya berbeda dari data inti:
 *
 * - **Data inti gagal** → `throw apiErrorDari(res)` (halaman tidak dirender).
 * - **Data pendukung gagal** → halaman **tetap** dirender, TAPI kegagalannya
 *   WAJIB terlihat lewat `<GagalMuatSebagian>` — dropdown kosong atau label
 *   yang jatuh ke ID mentah TIDAK BOLEH tak terbedakan dari "memang belum ada
 *   data" (itu notifikasi bohong; lihat backlog 017/026/029/031).
 *
 * Toleransi ini **hanya** untuk data pendukung yang murni kosmetik (pelabelan).
 * Bila daftar itu menjadi **satu-satunya sumber pilihan sebuah formulir**,
 * kegagalannya membuat formulir mustahil diisi dengan benar → perlakukan
 * sebagai data inti dan **lempar**.
 *
 * ```ts
 * const jabatan = pendukungList<JabatanRead>("Daftar jabatan", jabatanRes);
 * return { ..., jabatan: jabatan.data, gagalPendukung: bagianGagal(jabatan) };
 * ```
 */
import { apiErrorDari, type ApiError, type ApiResult } from "./errors";

/** Satu bagian data pendukung yang gagal diambil. */
export interface BagianGagal {
  /** Nama bagian sebagaimana dilihat user. Mis. `"Daftar jabatan"`. */
  nama: string;
  err: ApiError;
}

export interface HasilPendukung<T> {
  /** Isi daftar; `[]` bila gagal (dan `gagal` terisi) ATAU bila memang kosong. */
  data: T[];
  /** `null` bila sukses. Terisi bila fetch-nya gagal — WAJIB dirender ke user. */
  gagal: BagianGagal | null;
}

/** Bentuk minimal respons daftar berpaginasi dari `openapi-fetch`. */
type ListResult = ApiResult & { data?: { items?: unknown[] } };

/**
 * Ambil daftar pendukung dari respons `openapi-fetch`, sambil **mempertahankan**
 * kegagalannya (tidak menelannya) agar bisa ditampilkan ke user.
 */
export function pendukungList<T>(nama: string, res: ListResult): HasilPendukung<T> {
  if (!res.data) return { data: [], gagal: { nama, err: apiErrorDari(res) } };
  return { data: (res.data.items ?? []) as T[], gagal: null };
}

/** Kumpulkan bagian-bagian yang gagal dari beberapa `pendukungList`. */
export function bagianGagal(...hasil: HasilPendukung<unknown>[]): BagianGagal[] {
  return hasil.map((h) => h.gagal).filter((g): g is BagianGagal => g !== null);
}
