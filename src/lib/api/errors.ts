/**
 * Pemetaan error backend → tipe error klien.
 *
 * Backend mengembalikan envelope: { "error": "code_string", "message": "...", "details": [...] }
 * disertai header `X-Request-ID` untuk korelasi dengan log backend.
 */

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown[];
}

export class ApiError extends Error {
  readonly code: string;
  readonly details: unknown[];
  readonly requestId: string | null;
  /** Status HTTP respons yang gagal; `null` bila tidak diketahui. */
  readonly status: number | null;

  constructor(body: ApiErrorBody, requestId: string | null, status: number | null = null) {
    super(body.message);
    this.name = "ApiError";
    this.code = body.code;
    this.details = body.details ?? [];
    this.requestId = requestId;
    this.status = status;
  }
}

// Backend mengirim: { "error": "code_string", "message": "...", "details": [...] }
function isErrorEnvelope(
  value: unknown,
): value is { error: string; message: string; details?: unknown[] } {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.error === "string" && typeof v.message === "string";
}

export function toApiError(
  error: unknown,
  requestId: string | null,
  status: number | null = null,
): ApiError {
  if (isErrorEnvelope(error)) {
    return new ApiError(
      { code: error.error, message: error.message, details: error.details },
      requestId,
      status,
    );
  }
  return new ApiError(
    { code: "unknown_error", message: "Terjadi kesalahan tak terduga." },
    requestId,
    status,
  );
}

/** Bentuk minimal hasil `openapi-fetch` yang dibutuhkan untuk membangun `ApiError`. */
export interface ApiResult {
  error?: unknown;
  response: Response;
}

/**
 * Bangun `ApiError` dari respons `openapi-fetch` yang GAGAL — lengkap dengan
 * pesan backend, status HTTP, dan `X-Request-ID`.
 *
 * Ini pintu wajib jalur BACA di Server Component:
 *
 * ```ts
 * const res = await client.GET("/api/v1/...");
 * if (!res.data) throw apiErrorDari(res);
 * ```
 *
 * DILARANG memakai `res.data ?? []` untuk data kritis — array kosong hasil
 * kegagalan tidak terbedakan dari array kosong yang sah, sehingga halaman
 * merender formulir kosong yang tampak sah (notifikasi bohong).
 */
export function apiErrorDari(res: ApiResult): ApiError {
  const requestId = res.response?.headers?.get("x-request-id") ?? null;
  return toApiError(res.error ?? null, requestId, res.response?.status ?? null);
}

/**
 * `true` bila error adalah penolakan akses/identitas (401/403) atau data tidak
 * ditemukan (404) — kondisi yang layak ditampilkan sebagai halaman "tidak berhak"
 * yang rapi, bukan sebagai kegagalan sistem.
 */
export function isTidakBerhak(err: unknown): err is ApiError {
  return (
    err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 404)
  );
}
