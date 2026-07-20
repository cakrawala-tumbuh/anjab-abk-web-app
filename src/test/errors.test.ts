import { describe, expect, it } from "vitest";
import { ApiError, apiErrorDari, toApiError } from "@/lib/api/errors";

// Format envelope backend: { "error": "code_string", "message": "...", "details": [...] }

describe("toApiError", () => {
  it("memetakan envelope error backend ke ApiError", () => {
    const envelope = { error: "not_found", message: "Partisipan tidak ditemukan." };
    const err = toApiError(envelope, "req-123");
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("not_found");
    expect(err.message).toBe("Partisipan tidak ditemukan.");
    expect(err.requestId).toBe("req-123");
  });

  it("mengembalikan unknown_error bila bukan envelope backend", () => {
    const err = toApiError("bukan envelope", null);
    expect(err.code).toBe("unknown_error");
    expect(err.requestId).toBeNull();
  });

  it("menyertakan details bila ada", () => {
    const envelope = {
      error: "validation_error",
      message: "Payload tidak valid.",
      details: [{ loc: ["email"], msg: "Format email tidak valid." }],
    };
    const err = toApiError(envelope, null);
    expect(err.details).toHaveLength(1);
  });
});

describe("apiErrorDari (issue #21: pengganti toApiError(null, reqId) di jalur baca)", () => {
  it("mempertahankan pesan backend, status HTTP, dan X-Request-ID sekaligus", () => {
    const res = {
      error: {
        error: "validation_error",
        message: "Jumlah anggota SME panel (11) melebihi max_responden (10).",
      },
      response: { status: 422, headers: { get: () => "req-422" } } as unknown as Response,
    };
    const err = apiErrorDari(res);
    expect(err.message).toBe("Jumlah anggota SME panel (11) melebihi max_responden (10).");
    expect(err.status).toBe(422);
    expect(err.requestId).toBe("req-422");
  });

  it("status null bila response tidak tersedia; requestId null bila header tidak ada", () => {
    const res = {
      error: { error: "not_found", message: "Tidak ditemukan." },
      response: { status: 404, headers: { get: () => null } } as unknown as Response,
    };
    const err = apiErrorDari(res);
    expect(err.status).toBe(404);
    expect(err.requestId).toBeNull();
  });
});
