import { describe, expect, it } from "vitest";
import { ApiError, toApiError } from "@/lib/api/errors";

describe("toApiError", () => {
  it("memetakan envelope error backend ke ApiError", () => {
    const envelope = {
      error: { code: "not_found", message: "Partisipan tidak ditemukan." },
    };
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
      error: {
        code: "validation_error",
        message: "Payload tidak valid.",
        details: [{ loc: ["email"], msg: "Format email tidak valid." }],
      },
    };
    const err = toApiError(envelope, null);
    expect(err.details).toHaveLength(1);
  });
});
