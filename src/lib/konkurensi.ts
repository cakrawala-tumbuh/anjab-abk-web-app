import { ApiError } from "@/lib/api/errors";

/** Pesan tetap toast untuk 412 `precondition_failed` (If-Match tidak cocok). */
export const PESAN_DATA_BERUBAH =
  "Data telah berubah oleh pengguna lain. Muat ulang halaman sebelum menyimpan.";

/** Pesan tetap toast untuk 409 `conflict` dari Idempotency-Key yang masih diproses. */
export const PESAN_MASIH_DIPROSES = "Permintaan sebelumnya masih diproses.";

/**
 * Bangun header `If-Match` untuk opsi `headers` klien bertipe.
 *
 * @param etag - ETag terakhir yang diketahui klien; `null`/`undefined`/kosong → tanpa header
 *   (kunci optimistik bersifat opsional di backend).
 * @returns Objek header (kosong bila tidak ada ETag).
 */
export function headerIfMatch(etag: string | null | undefined): Record<string, string> {
  return etag ? { "If-Match": etag } : {};
}

/**
 * Bangun header `Idempotency-Key` untuk opsi `headers` klien bertipe.
 *
 * @param key - Key dari `useIdempotencyKey().key`.
 * @returns Objek header berisi key tersebut.
 */
export function headerIdempotencyKey(key: string): Record<string, string> {
  return { "Idempotency-Key": key };
}

/**
 * Baca header `ETag` dari respons `fetch`.
 *
 * @param response - Objek `Response` hasil `openapi-fetch`.
 * @returns Nilai ETag, atau `null` bila header tidak ada.
 */
export function bacaEtag(response: {
  headers?: { get?: (n: string) => string | null };
}): string | null {
  const v = response?.headers?.get?.("etag") ?? null;
  return v && v.length > 0 ? v : null;
}

/**
 * Petakan error konkurensi backend ke `ApiError` berpesan tetap.
 *
 * - 412 `precondition_failed` → {@link PESAN_DATA_BERUBAH}.
 * - 409 `conflict` → {@link PESAN_MASIH_DIPROSES}, hanya bila `idempoten` true (rute POST
 *   ber-`Idempotency-Key`); kode 409 lain (mis. `instrument_has_responses`) dibiarkan.
 *
 * `code`, `details`, `requestId`, dan `status` dipertahankan agar `X-Request-ID` tetap tampil.
 *
 * @param err - Error hasil panggilan API.
 * @param idempoten - `true` untuk rute POST ber-Idempotency-Key.
 * @returns `ApiError` baru berpesan tetap bila cocok; `err` apa adanya bila tidak.
 */
export function petakanKonkurensi(err: unknown, idempoten = false): unknown {
  if (!(err instanceof ApiError)) return err;
  let pesan: string | null = null;
  if (err.status === 412 || err.code === "precondition_failed") pesan = PESAN_DATA_BERUBAH;
  else if (idempoten && err.status === 409 && err.code === "conflict") pesan = PESAN_MASIH_DIPROSES;
  if (!pesan) return err;
  return new ApiError(
    { code: err.code, message: pesan, details: err.details },
    err.requestId,
    err.status,
  );
}
