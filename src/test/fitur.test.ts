import { describe, it, expect, vi } from "vitest";
import { fiturAktif } from "@/lib/fitur";
import { ApiError } from "@/lib/api/errors";

type Klien = Parameters<typeof fiturAktif>[0];

function klien(res: unknown): Klien {
  return { GET: vi.fn().mockResolvedValue(res) } as unknown as Klien;
}

describe("fiturAktif", () => {
  it("true bila kode aktif, false bila nonaktif", async () => {
    const data = {
      items: [
        { kode: "WCP_DCS_SCORING", aktif: false, keterangan: "x" },
        { kode: "RESEARCH_EXPORT", aktif: true, keterangan: "y" },
      ],
    };
    const res = { data, response: { status: 200, headers: { get: () => null } } };
    expect(await fiturAktif(klien(res), "WCP_DCS_SCORING")).toBe(false);
    expect(await fiturAktif(klien(res), "RESEARCH_EXPORT")).toBe(true);
  });

  it("GET /system/fitur gagal 500 → melempar ApiError, bukan false", async () => {
    const res = {
      data: undefined,
      error: { error: "internal", message: "boom" },
      response: { status: 500, headers: { get: () => "req-1" } },
    };
    await expect(fiturAktif(klien(res), "WCP_DCS_SCORING")).rejects.toBeInstanceOf(ApiError);
  });
});
