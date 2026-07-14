import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api/errors";

// ── Mock klien API ──────────────────────────────────────────────────────────
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get }),
}));

import { fetchTahap3Data } from "@/app/(auth)/task-inventory/tahap3/[responden_id]/data";

/** Respons sukses openapi-fetch. */
function ok(data: unknown) {
  return { data, error: undefined, response: { status: 200, headers: { get: () => "req-ok" } } };
}

/** Respons GAGAL openapi-fetch — `data` undefined, envelope error backend terisi. */
function gagal(status: number, code: string, message: string, reqId = "req-err") {
  return {
    data: undefined,
    error: { error: code, message },
    response: { status, headers: { get: () => reqId } },
  };
}

const responden = { id: "tresp_1", sesi_id: "tises_1", nama: "Budi", tahap3_submit: false };
const sesi = { id: "tises_1", status: "TAHAP3", jabatan_id: "jbt_1", jabatan_nama: "Guru" };

beforeEach(() => {
  get.mockReset();
});

describe("fetchTahap3Data — kegagalan tidak boleh ditelan senyap", () => {
  it("MELEMPAR ApiError bila task-terpilih gagal 403 (bukan mengembalikan [])", async () => {
    get
      .mockResolvedValueOnce(ok(responden)) // GET responden
      .mockResolvedValueOnce(ok(sesi)) // GET sesi
      .mockResolvedValueOnce(gagal(403, "forbidden", "Akses ditolak.", "req-403")); // task-terpilih

    await expect(fetchTahap3Data("tok", "tresp_1")).rejects.toThrow(ApiError);
  });

  it("ApiError dari task-terpilih membawa status + X-Request-ID untuk dilaporkan user", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(gagal(500, "internal_error", "Kesalahan server.", "req-500"));

    const err = await fetchTahap3Data("tok", "tresp_1").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).requestId).toBe("req-500");
    expect((err as ApiError).message).toBe("Kesalahan server.");
  });

  it("MELEMPAR bila endpoint detail gagal (dulu ditelan jadi [])", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok([{ kode: "TIa" }]))
      .mockResolvedValueOnce(gagal(500, "internal_error", "Kesalahan server."));

    await expect(fetchTahap3Data("tok", "tresp_1")).rejects.toThrow(ApiError);
  });

  it("MELEMPAR bila responden gagal 403 — non-pemilik tidak boleh dapat halaman kosong", async () => {
    get.mockResolvedValueOnce(gagal(403, "forbidden", "Akses ditolak."));

    const err = await fetchTahap3Data("tok", "tresp_lain").catch((e: unknown) => e);
    expect((err as ApiError).status).toBe(403);
  });
});

describe("fetchTahap3Data — kondisi sah tetap berjalan", () => {
  it("task-terpilih 200 + array KOSONG diterima sebagai kondisi sah (bukan error)", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok([])) // 0 task final — sah
      .mockResolvedValueOnce(ok([]));

    const data = await fetchTahap3Data("tok", "tresp_1");
    expect(data.terpilih).toEqual([]);
    expect(data.detail).toEqual([]);
  });

  it("sesi belum TAHAP3 → task-terpilih tidak dipanggil sama sekali", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok({ ...sesi, status: "TAHAP1" }))
      .mockResolvedValueOnce(ok([])); // langsung ke detail

    const data = await fetchTahap3Data("tok", "tresp_1");
    expect(data.terpilih).toEqual([]);
    expect(get).toHaveBeenCalledTimes(3); // responden, sesi, detail
    const paths = get.mock.calls.map((c) => c[0]);
    expect(paths).not.toContain("/api/v1/task-inventory/sesi/{sesi_id}/task-terpilih");
  });

  it("alur normal: task terpilih dikembalikan apa adanya", async () => {
    const tasks = [{ kode: "TIa" }, { kode: "TIb" }];
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok(tasks))
      .mockResolvedValueOnce(ok([]));

    const data = await fetchTahap3Data("tok", "tresp_1");
    expect(data.terpilih).toHaveLength(2);
  });
});
