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

  constructor(body: ApiErrorBody, requestId: string | null) {
    super(body.message);
    this.name = "ApiError";
    this.code = body.code;
    this.details = body.details ?? [];
    this.requestId = requestId;
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

export function toApiError(error: unknown, requestId: string | null): ApiError {
  if (isErrorEnvelope(error)) {
    return new ApiError(
      { code: error.error, message: error.message, details: error.details },
      requestId,
    );
  }
  return new ApiError(
    { code: "unknown_error", message: "Terjadi kesalahan tak terduga." },
    requestId,
  );
}
