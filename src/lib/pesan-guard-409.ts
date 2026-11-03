import { ApiError } from "@/lib/api/errors";

/** Kode 409 backend → pesan tetap layar untuk penolakan guard integritas data. */
export const PESAN_GUARD_409: Readonly<Record<string, string>> = {
  instrument_has_responses:
    "Instrumen sudah berisi jawaban — ubah item ditolak untuk menjaga data.",
  catalog_in_use: "Katalog masih dipakai sesi TI atau OPM — purge ditolak.",
};

/**
 * Petakan penolakan guard 409 backend ke `ApiError` berpesan tetap.
 *
 * `code`, `details`, dan `requestId` dipertahankan agar `X-Request-ID` tetap tampil di
 * toast gagal; hanya pesannya yang diganti.
 *
 * @param err - Error hasil panggilan API.
 * @returns `ApiError` baru berpesan tetap bila kodenya dikenal; `err` apa adanya bila tidak
 *   (sehingga pesan backend dipakai).
 */
export function petakanGuard409(err: unknown): unknown {
  if (!(err instanceof ApiError)) return err;
  const pesan = PESAN_GUARD_409[err.code];
  if (!pesan) return err;
  return new ApiError(
    { code: err.code, message: pesan, details: err.details },
    err.requestId,
    err.status,
  );
}
