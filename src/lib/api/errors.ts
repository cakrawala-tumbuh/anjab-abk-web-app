/**
 * Pemetaan error backend → tipe error klien.
 *
 * Backend mengembalikan envelope: { "error": { "code": "...", "message": "...", "details": [...] } }
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

  constructor(body: ApiErrorBody, requestId: string | null) {
    super(body.message);
    this.name = "ApiError";
    this.code = body.code;
    this.details = body.details ?? [];
    this.requestId = requestId;
  }
}

function isErrorEnvelope(value: unknown): value is { error: ApiErrorBody } {
  if (typeof value !== "object" || value === null) return false;
  const err = (value as Record<string, unknown>).error;
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;
  return typeof e.code === "string" && typeof e.message === "string";
}

export function toApiError(error: unknown, requestId: string | null): ApiError {
  if (isErrorEnvelope(error)) {
    return new ApiError(error.error, requestId);
  }
  return new ApiError(
    { code: "unknown_error", message: "Terjadi kesalahan tak terduga." },
    requestId,
  );
}
