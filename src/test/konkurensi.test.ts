import { describe, it, expect } from "vitest";
import { ApiError } from "@/lib/api/errors";
import {
  PESAN_DATA_BERUBAH,
  PESAN_MASIH_DIPROSES,
  bacaEtag,
  headerIdempotencyKey,
  headerIfMatch,
  petakanKonkurensi,
} from "@/lib/konkurensi";

const err = (status: number, code: string, message = "pesan backend") =>
  new ApiError({ code, message }, "req_9", status);

describe("konkurensi", () => {
  it("412 precondition_failed → pesan tetap, requestId tetap", () => {
    const hasil = petakanKonkurensi(err(412, "precondition_failed")) as ApiError;
    expect(hasil.message).toBe(PESAN_DATA_BERUBAH);
    expect(hasil.requestId).toBe("req_9");
    expect(hasil.status).toBe(412);
  });

  it("409 conflict hanya dipetakan bila idempoten", () => {
    expect((petakanKonkurensi(err(409, "conflict"), true) as ApiError).message).toBe(
      PESAN_MASIH_DIPROSES,
    );
    expect((petakanKonkurensi(err(409, "conflict")) as ApiError).message).toBe("pesan backend");
  });

  it("409 kode lain dan error non-ApiError dibiarkan", () => {
    const lain = err(409, "instrument_has_responses");
    expect(petakanKonkurensi(lain, true)).toBe(lain);
    const biasa = new Error("x");
    expect(petakanKonkurensi(biasa, true)).toBe(biasa);
  });

  it("header: If-Match hanya bila ada ETag; Idempotency-Key selalu", () => {
    expect(headerIfMatch('"abc"')).toEqual({ "If-Match": '"abc"' });
    expect(headerIfMatch(null)).toEqual({});
    expect(headerIdempotencyKey("k1")).toEqual({ "Idempotency-Key": "k1" });
  });

  it("bacaEtag membaca header etag, null bila tak ada", () => {
    expect(bacaEtag({ headers: { get: (n) => (n === "etag" ? '"e1"' : null) } })).toBe('"e1"');
    expect(bacaEtag({ headers: { get: () => null } })).toBeNull();
  });
});
