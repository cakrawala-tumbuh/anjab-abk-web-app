import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api/errors";

// ── Mock auth & API client ──────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(async () => ({ user: { groups: ["admin"] }, accessToken: "tok" })),
  isAdmin: () => true,
}));

const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get }),
}));

import JabatanPage from "@/app/(auth)/master-data/jabatan/page";

beforeEach(() => {
  get.mockReset();
});

/**
 * Representatif untuk 24 berkas jalur baca yang dimigrasikan `toApiError(null, reqId)`
 * → `apiErrorDari(res)` di issue #21 — perilakunya identik di seluruh berkas (pola
 * `const res = await client.GET(...); if (!res.data) throw apiErrorDari(res);`), jadi
 * satu representasi cukup membuktikan migrasinya bekerja end-to-end lewat komponen
 * halaman sungguhan (bukan hanya unit `apiErrorDari` yang sudah dites di errors.test.ts).
 */
describe("Jalur baca yang dimigrasikan (issue #21): pesan & status backend utuh sampai ApiError", () => {
  it("422 dari backend (mis. backlog 028) tampil utuh via ApiError, bukan pesan generik", async () => {
    get.mockResolvedValueOnce({
      data: undefined,
      error: {
        error: "validation_error",
        message: "Jumlah anggota SME panel (11) melebihi max_responden (10).",
      },
      response: { status: 422, headers: { get: () => "req-422" } },
    });

    const err = await JabatanPage({ searchParams: Promise.resolve({}) }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe(
      "Jumlah anggota SME panel (11) melebihi max_responden (10).",
    );
    expect((err as ApiError).status).toBe(422);
    expect((err as ApiError).requestId).toBe("req-422");
  });

  it("401 dari backend membawa status 401 (bukan status null seperti toApiError(null, reqId) lama)", async () => {
    get.mockResolvedValueOnce({
      data: undefined,
      error: { error: "unauthorized", message: "Sesi kedaluwarsa." },
      response: { status: 401, headers: { get: () => "req-401" } },
    });

    const err = await JabatanPage({ searchParams: Promise.resolve({}) }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
  });
});
