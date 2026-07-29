import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api/errors";

// ── Mock klien API ──────────────────────────────────────────────────────────
const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post }),
}));

import { fetchUraianTugasData } from "@/app/(auth)/master-data/uraian-tugas/data";

/** Respons sukses openapi-fetch. */
function ok(data: unknown) {
  return { data, error: undefined, response: { status: 200, headers: { get: () => "req-ok" } } };
}

/** Respons GAGAL openapi-fetch. */
function gagal(status: number, code: string, message: string, reqId = "req-err") {
  return {
    data: undefined,
    error: { error: code, message },
    response: { status, headers: { get: () => reqId } },
  };
}

const emptyFilter = { jabatanId: null, tugasPokokId: null, detilTugasId: null };

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

describe("fetchUraianTugasData — body POST /search", () => {
  it("mengirim domain kosong + limit/offset yang benar tanpa filter", async () => {
    post.mockResolvedValueOnce(ok({ items: [], total: 0 }));
    get
      .mockResolvedValueOnce(ok({ items: [], total: 0 })) // jabatan
      .mockResolvedValueOnce(ok({ items: [], total: 0 })) // tugas pokok
      .mockResolvedValueOnce(ok({ items: [], total: 0 })); // detil tugas

    await fetchUraianTugasData("tok", emptyFilter, 20);

    expect(post).toHaveBeenCalledWith("/api/v1/task-inventory/uraian-tugas/search", {
      body: { domain: [], order: [], limit: 20, offset: 20 },
    });
  });

  it("merakit domain sesuai filter yang terisi", async () => {
    post.mockResolvedValueOnce(ok({ items: [], total: 0 }));
    get
      .mockResolvedValueOnce(ok({ items: [], total: 0 }))
      .mockResolvedValueOnce(ok({ items: [], total: 0 }))
      .mockResolvedValueOnce(ok({ items: [], total: 0 }));

    await fetchUraianTugasData(
      "tok",
      { jabatanId: "jbt_1", tugasPokokId: "tp_1", detilTugasId: null },
      0,
    );

    expect(post).toHaveBeenCalledWith("/api/v1/task-inventory/uraian-tugas/search", {
      body: {
        domain: [
          ["jabatan_id", "=", "jbt_1"],
          ["tugas_pokok_id", "=", "tp_1"],
        ],
        order: [],
        limit: 20,
        offset: 0,
      },
    });
  });
});

describe("fetchUraianTugasData — hasil sukses", () => {
  it("mengembalikan daftar, total, dan ketiga dropdown apa adanya", async () => {
    post.mockResolvedValueOnce(ok({ items: [{ id: "ut_1" }], total: 1 }));
    get
      .mockResolvedValueOnce(ok({ items: [{ id: "jbt_1" }], total: 1 }))
      .mockResolvedValueOnce(ok({ items: [{ id: "tp_1" }], total: 1 }))
      .mockResolvedValueOnce(ok({ items: [{ id: "dt_1" }], total: 1 }));

    const data = await fetchUraianTugasData("tok", emptyFilter, 0);

    expect(data.uraianTugas).toEqual([{ id: "ut_1" }]);
    expect(data.total).toBe(1);
    expect(data.jabatan).toEqual([{ id: "jbt_1" }]);
    expect(data.tugasPokok).toEqual([{ id: "tp_1" }]);
    expect(data.detilTugas).toEqual([{ id: "dt_1" }]);
  });
});

describe("fetchUraianTugasData — kegagalan tidak boleh ditelan senyap", () => {
  it("MELEMPAR bila /search gagal (bukan mengembalikan daftar kosong)", async () => {
    post.mockResolvedValueOnce(gagal(403, "forbidden", "Akses ditolak."));
    get
      .mockResolvedValueOnce(ok({ items: [], total: 0 }))
      .mockResolvedValueOnce(ok({ items: [], total: 0 }))
      .mockResolvedValueOnce(ok({ items: [], total: 0 }));

    await expect(fetchUraianTugasData("tok", emptyFilter, 0)).rejects.toThrow(ApiError);
  });

  it("MELEMPAR bila dropdown jabatan gagal — data pendukung inti, bukan pelabelan saja", async () => {
    post.mockResolvedValueOnce(ok({ items: [], total: 0 }));
    get.mockResolvedValueOnce(gagal(500, "internal_error", "Kesalahan server."));

    await expect(fetchUraianTugasData("tok", emptyFilter, 0)).rejects.toThrow(ApiError);
  });

  it("MELEMPAR bila dropdown tugas pokok gagal", async () => {
    post.mockResolvedValueOnce(ok({ items: [], total: 0 }));
    get
      .mockResolvedValueOnce(ok({ items: [], total: 0 })) // jabatan
      .mockResolvedValueOnce(gagal(500, "internal_error", "Kesalahan server.")); // tugas pokok

    await expect(fetchUraianTugasData("tok", emptyFilter, 0)).rejects.toThrow(ApiError);
  });

  it("MELEMPAR bila dropdown detil tugas gagal", async () => {
    post.mockResolvedValueOnce(ok({ items: [], total: 0 }));
    get
      .mockResolvedValueOnce(ok({ items: [], total: 0 })) // jabatan
      .mockResolvedValueOnce(ok({ items: [], total: 0 })) // tugas pokok
      .mockResolvedValueOnce(gagal(500, "internal_error", "Kesalahan server.")); // detil tugas

    await expect(fetchUraianTugasData("tok", emptyFilter, 0)).rejects.toThrow(ApiError);
  });

  it("ID filter tidak dikenal tetap diteruskan apa adanya (bukan dilempar)", async () => {
    post.mockResolvedValueOnce(ok({ items: [], total: 0 }));
    get
      .mockResolvedValueOnce(ok({ items: [], total: 0 }))
      .mockResolvedValueOnce(ok({ items: [], total: 0 }))
      .mockResolvedValueOnce(ok({ items: [], total: 0 }));

    const data = await fetchUraianTugasData(
      "tok",
      { jabatanId: "jbt_tak_dikenal", tugasPokokId: null, detilTugasId: null },
      0,
    );
    expect(data.uraianTugas).toEqual([]);
    expect(data.total).toBe(0);
    expect(post).toHaveBeenCalledWith("/api/v1/task-inventory/uraian-tugas/search", {
      body: { domain: [["jabatan_id", "=", "jbt_tak_dikenal"]], order: [], limit: 20, offset: 0 },
    });
  });
});
