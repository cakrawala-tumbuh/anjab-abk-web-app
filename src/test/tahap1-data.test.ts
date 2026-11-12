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

/** `GET /system/fitur` dengan `PREBANK_FREEZE` mati — urutan panggilan: responden, sesi, fitur. */
const FITUR_MATI = { items: [{ kode: "PREBANK_FREEZE", aktif: false }] };
const FITUR_HIDUP = { items: [{ kode: "PREBANK_FREEZE", aktif: true }] };

function prabank(state: string, cerita: unknown = null) {
  return { cerita, frozen_at: null, first_exposed_at: null, exposure_state: state };
}

/** Jalur GET yang dipanggil, berurutan. */
function jalur(): string[] {
  return get.mock.calls.map((c) => c[0] as string);
}

beforeEach(() => {
  get.mockReset();
});

describe("fetchTahap1Data — kegagalan tidak boleh ditelan senyap", () => {
  it("MELEMPAR ApiError bila catalog gagal (dulu ditelan jadi [])", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok(FITUR_MATI))
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
      .mockResolvedValueOnce(ok(FITUR_MATI))
      .mockResolvedValueOnce(ok({ items: [{ kode: "TIa" }], total: 1 }))
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
      .mockResolvedValueOnce(ok(FITUR_MATI))
      .mockResolvedValueOnce(ok({ items: [{ kode: "TIa" }], total: 1 }))
      .mockResolvedValueOnce(gagal(404, "not_found", "Responden belum submit seleksi Tahap 1."))
      .mockResolvedValueOnce(ok([]));

    const data = await fetchTahap1Data("tok", "tresp_1");
    expect(data.terpilih).toEqual([]);
    expect(data.catalog).toHaveLength(1);
    expect(data.usulan).toEqual([]);
  });

  it("alur normal: seleksi tersimpan dikembalikan apa adanya", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok(FITUR_MATI))
      .mockResolvedValueOnce(ok({ items: [{ kode: "TIa" }, { kode: "TIb" }], total: 2 }))
      .mockResolvedValueOnce(ok({ task_kode: ["TIa"] }))
      .mockResolvedValueOnce(ok([]));

    const data = await fetchTahap1Data("tok", "tresp_1");
    expect(data.terpilih).toEqual(["TIa"]);
  });

  it("catalog 200 + array kosong diterima (bukan error)", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok(FITUR_MATI))
      .mockResolvedValueOnce(ok({ items: [], total: 0 }))
      .mockResolvedValueOnce(ok({ task_kode: [] }))
      .mockResolvedValueOnce(ok([]));

    const data = await fetchTahap1Data("tok", "tresp_1");
    expect(data.catalog).toEqual([]);
  });

  it("usulan yang sudah tersimpan dikembalikan apa adanya", async () => {
    const usulan = [
      {
        id: "tius_1",
        sesi_id: "tises_1",
        responden_id: "tresp_1",
        tugas_pokok_id: "tp1",
        tugas_pokok: "Pengelolaan SDM",
        detil_tugas_id: null,
        detil_tugas: null,
        uraian: "Menyusun ulang jadwal piket.",
        disetujui: null,
        task_kode: null,
        created_at: "2026-07-26T00:00:00Z",
      },
    ];
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok(FITUR_MATI))
      .mockResolvedValueOnce(ok({ items: [{ kode: "TIa" }], total: 1 }))
      .mockResolvedValueOnce(ok({ task_kode: ["TIa"] }))
      .mockResolvedValueOnce(ok(usulan));

    const data = await fetchTahap1Data("tok", "tresp_1");
    expect(data.usulan).toEqual(usulan);
  });
});

describe("fetchTahap1Data — kegagalan usulan tidak boleh ditelan senyap", () => {
  it("MELEMPAR ApiError bila GET usulan gagal (bukan ditelan jadi [])", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok(FITUR_MATI))
      .mockResolvedValueOnce(ok({ items: [{ kode: "TIa" }], total: 1 }))
      .mockResolvedValueOnce(ok({ task_kode: ["TIa"] }))
      .mockResolvedValueOnce(gagal(500, "internal_error", "Kesalahan server.", "req-usulan-500"));

    const err = await fetchTahap1Data("tok", "tresp_1").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect((err as ApiError).requestId).toBe("req-usulan-500");
  });
});

describe("fetchTahap1Data — gerbang pra-bank (saklar PREBANK_FREEZE)", () => {
  it("saklar mati: katalog diambil, prabank TIDAK dipanggil", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok(FITUR_MATI))
      .mockResolvedValueOnce(ok({ items: [{ kode: "TIa" }], total: 1 }))
      .mockResolvedValueOnce(ok({ task_kode: [] }))
      .mockResolvedValueOnce(ok([]));

    const data = await fetchTahap1Data("tok", "tresp_1");
    expect(data.modeCerita).toBe(false);
    expect(data.prabank).toBeNull();
    expect(data.catalog).toHaveLength(1);
    expect(jalur().some((j) => j.endsWith("/prabank"))).toBe(false);
    expect(jalur().some((j) => j.endsWith("/catalog"))).toBe(true);
  });

  it("saklar hidup + BELUM_TERPAPAR: katalog TIDAK dipanggil, data bermode cerita", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok(FITUR_HIDUP))
      .mockResolvedValueOnce(ok(prabank("BELUM_TERPAPAR")))
      .mockResolvedValueOnce(gagal(404, "not_found", "Belum ada seleksi."));

    const data = await fetchTahap1Data("tok", "tresp_1");
    expect(data.modeCerita).toBe(true);
    expect(data.catalog).toEqual([]);
    expect(data.usulan).toEqual([]);
    expect(jalur().some((j) => j.endsWith("/catalog"))).toBe(false);
    expect(jalur().some((j) => j.endsWith("/usulan"))).toBe(false);
    expect(jalur().filter((j) => j.endsWith("/prabank"))).toHaveLength(1);
  });

  it("saklar hidup + LOCKED_PRE_EXPOSURE: katalog dipanggil, cerita ikut dikembalikan", async () => {
    const cerita = { id: "c1", teks: "Saya mengajar.", frozen_at: "2026-11-12T00:00:00Z" };
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok(FITUR_HIDUP))
      .mockResolvedValueOnce(ok(prabank("LOCKED_PRE_EXPOSURE", cerita)))
      .mockResolvedValueOnce(ok({ items: [{ kode: "TIa" }], total: 1 }))
      .mockResolvedValueOnce(ok({ task_kode: [] }))
      .mockResolvedValueOnce(ok([]));

    const data = await fetchTahap1Data("tok", "tresp_1");
    expect(data.modeCerita).toBe(false);
    expect(data.catalog).toHaveLength(1);
    expect(data.prabank?.cerita).toEqual(cerita);
    expect(jalur().some((j) => j.endsWith("/catalog"))).toBe(true);
  });

  it("prabank 500 MELEMPAR ApiError (bukan dianggap kosong) dan katalog tidak diambil", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(ok(FITUR_HIDUP))
      .mockResolvedValueOnce(gagal(500, "internal_error", "Kesalahan server.", "req-pb"));

    const err = await fetchTahap1Data("tok", "tresp_1").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
    expect(jalur().some((j) => j.endsWith("/catalog"))).toBe(false);
  });

  it("system/fitur 401 MELEMPAR ApiError", async () => {
    get
      .mockResolvedValueOnce(ok(responden))
      .mockResolvedValueOnce(ok(sesi))
      .mockResolvedValueOnce(gagal(401, "unauthorized", "Tidak terautentikasi.", "req-401"));

    const err = await fetchTahap1Data("tok", "tresp_1").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
  });
});
