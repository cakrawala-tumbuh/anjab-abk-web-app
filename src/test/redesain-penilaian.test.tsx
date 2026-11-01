import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post, PATCH: patch }),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));
const notifyGagal = vi.fn();
const notifySukses = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
  notifySukses: (m: string) => notifySukses(m),
}));

import { BagianPenilaian } from "@/app/(auth)/redesain/masalah/[id]/bagian-penilaian";
import { fetchPenilaianMasalah } from "@/app/(auth)/redesain/masalah/[id]/data-penilaian";
import { BAGIAN_DETAIL_MASALAH } from "@/app/(auth)/redesain/masalah/[id]/registry";
import { ApiError } from "@/lib/api/errors";
import type { MasalahRead, PenilaianRead } from "@/lib/api/schema";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: { code: "X", message: "ditolak" } },
  response: { status, headers: { get: () => "req-1" } },
});
const halaman = (items: unknown[]) => resp({ items, total: items.length, limit: 2, offset: 0 });

const masalah = { id: "m1", kode: "M-K01-01" } as MasalahRead;
const penilaian = (p: Partial<PenilaianRead> = {}): PenilaianRead =>
  ({
    id: "n1",
    masalah_id: "m1",
    status_bukti: "Hipotesis",
    gap_material: "Belum tahu",
    indikasi_kritis: "Belum tahu",
    k1: null,
    k2: "Tinggi",
    k3: null,
    k4: null,
    alasan_rentang_beda: null,
    diluruskan_sekolah: null,
    pemeriksa_sekolah_konteks: null,
    tindak_lanjut: null,
    catatan_sumber_versi: null,
    saran_otomatis: "K - Klarifikasi",
    versi_aturan_triase: "v1.3",
    status_penilaian: "Belum ditelaah",
    updated_at: "2026-11-01T00:00:00Z",
    created_at: "2026-11-01T00:00:00Z",
    ...p,
  }) as PenilaianRead;

async function renderBagian() {
  render(await BagianPenilaian({ masalah, accessToken: "tok" }));
}

beforeEach(() => vi.clearAllMocks());

describe("bagian penilaian", () => {
  it("terdaftar di registry", () => {
    expect(BAGIAN_DETAIL_MASALAH.map((b) => b.kunci)).toContain("penilaian");
  });

  it("search 0 hasil → tombol Mulai penilaian (bukan error)", async () => {
    post.mockResolvedValue(halaman([]));
    await renderBagian();
    expect(screen.getByRole("button", { name: "Mulai penilaian" })).toBeInTheDocument();
    expect(post.mock.calls[0][0]).toBe("/api/v1/redesain/penilaian/search");
    expect(post.mock.calls[0][1].body.domain).toEqual([["masalah_id", "=", "m1"]]);
  });

  it("Mulai penilaian: POST lalu refresh + toast sukses", async () => {
    post.mockResolvedValueOnce(halaman([]));
    await renderBagian();
    post.mockResolvedValueOnce(resp(penilaian(), 201));
    fireEvent.click(screen.getByRole("button", { name: "Mulai penilaian" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(post.mock.calls[1][0]).toBe("/api/v1/redesain/penilaian");
    expect(post.mock.calls[1][1].body.masalah_id).toBe("m1");
    expect(notifySukses).toHaveBeenCalled();
  });

  it("POST mulai 409 → refresh tanpa toast sukses/gagal", async () => {
    post.mockResolvedValueOnce(halaman([]));
    await renderBagian();
    post.mockResolvedValueOnce(resp(null, 409));
    fireEvent.click(screen.getByRole("button", { name: "Mulai penilaian" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(notifySukses).not.toHaveBeenCalled();
    expect(notifyGagal).not.toHaveBeenCalled();
  });

  it("saran & versi aturan dirender apa adanya dari respons", async () => {
    post.mockResolvedValue(halaman([penilaian()]));
    await renderBagian();
    expect(screen.getByText("K - Klarifikasi")).toBeInTheDocument();
    expect(screen.getByText(/Versi aturan: v1\.3/)).toBeInTheDocument();
    expect(screen.getByText(/Saran sistem — bukan keputusan/)).toBeInTheDocument();
  });

  it("K kosong dikirim null, bukan 'Belum tahu'; PATCH ke id penilaian", async () => {
    post.mockResolvedValue(halaman([penilaian()]));
    await renderBagian();
    patch.mockResolvedValue(resp(penilaian()));
    fireEvent.click(screen.getByRole("button", { name: "Simpan penilaian" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    const [path, opsi] = patch.mock.calls[0];
    expect(path).toBe("/api/v1/redesain/penilaian/{penilaian_id}");
    expect(opsi.params.path.penilaian_id).toBe("n1");
    expect(opsi.body.k1).toBeNull();
    expect(opsi.body.k2).toBe("Tinggi");
    expect(opsi.body.tindak_lanjut).toBeNull();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("memilih '— belum diisi —' pada K2 mengirim k2: null", async () => {
    post.mockResolvedValue(halaman([penilaian()]));
    await renderBagian();
    patch.mockResolvedValue(resp(penilaian()));
    fireEvent.change(screen.getByLabelText("K2"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan penilaian" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(patch.mock.calls[0][1].body.k2).toBeNull();
  });

  it("PATCH 422 → toast gagal", async () => {
    post.mockResolvedValue(halaman([penilaian()]));
    await renderBagian();
    patch.mockResolvedValue(resp(null, 422));
    fireEvent.click(screen.getByRole("button", { name: "Simpan penilaian" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(notifySukses).not.toHaveBeenCalled();
  });

  it("search 403 melempar ApiError", async () => {
    post.mockResolvedValue(resp(null, 403));
    await expect(fetchPenilaianMasalah("tok", "m1")).rejects.toBeInstanceOf(ApiError);
  });
});
