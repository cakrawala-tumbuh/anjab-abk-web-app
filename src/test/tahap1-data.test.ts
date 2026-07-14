import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api/errors";

// ── Mock klien API ──────────────────────────────────────────────────────────
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get }),
}));

import { fetchTahap1Data } from "@/app/(auth)/task-inventory/tahap1/[responden_id]/data";

function ok(data: unknown) {
  return { data, error: undefined, response: { status: 200, headers: { get: () => "req-ok" } } };
}

function gagal(status: number, code: string, message: string, reqId = "req-err") {
  return {
    data: undefined,
    error: { error: code, message },
    response: { status, headers: { get: () => reqId } },
  };
}

const responden = { id: "tresp_1", sesi_id: "tises_1", nama: "Budi", tahap1_submit: false };
const sesi = { id: "tises_1", status: "TAHAP1", jabatan_id: "jbt_1", jabatan_nama: "Guru" };

beforeEach(() => {
  get.mockReset();
});

describe("fetchTahap1Data — kegagalan tidak boleh ditelan senyap", () => {
  it("MELEMPAR ApiError bila catalog gagal (dulu ditelan jadi [])", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(gagal(500, "internal_error", "Kesalahan server.", "req-500"));

    const err = await fetchTahap1Data("tok", "tresp_1").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).requestId).toBe("req-500");
  });

  it("MELEMPAR bila seleksi gagal 403 — bukan 404", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok([{ kode: "TIa" }]))
      .mockResolvedValueOnce(gagal(403, "forbidden", "Akses ditolak."));

    await expect(fetchTahap1Data("tok", "tresp_1")).rejects.toThrow(ApiError);
  });

  it("MELEMPAR bila responden gagal 403 (membuka milik orang lain)", async () => {
    get.mockResolvedValueOnce(gagal(403, "forbidden", "Akses ditolak.", "req-403"));

    const err = await fetchTahap1Data("tok", "tresp_lain").catch((e: unknown) => e);
    expect((err as ApiError).status).toBe(403);
    expect((err as ApiError).requestId).toBe("req-403");
  });
});

describe("fetchTahap1Data — kondisi sah tetap berjalan", () => {
  it("seleksi 404 = responden belum pernah menyimpan pilihan → terpilih [] TANPA melempar", async () => {
    // Backend melempar 404 ("Responden belum submit seleksi Tahap 1") pada
    // kunjungan pertama. Itu jalur NORMAL — tidak boleh jadi error.
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok([{ kode: "TIa" }]))
      .mockResolvedValueOnce(gagal(404, "not_found", "Responden belum submit seleksi Tahap 1."));

    const data = await fetchTahap1Data("tok", "tresp_1");
    expect(data.terpilih).toEqual([]);
    expect(data.catalog).toHaveLength(1);
  });

  it("alur normal: seleksi tersimpan dikembalikan apa adanya", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok([{ kode: "TIa" }, { kode: "TIb" }]))
      .mockResolvedValueOnce(ok({ task_kode: ["TIa"] }));

    const data = await fetchTahap1Data("tok", "tresp_1");
    expect(data.terpilih).toEqual(["TIa"]);
  });

  it("catalog 200 + array kosong diterima (bukan error)", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok([]))
      .mockResolvedValueOnce(ok({ task_kode: [] }));

    const data = await fetchTahap1Data("tok", "tresp_1");
    expect(data.catalog).toEqual([]);
  });
});
