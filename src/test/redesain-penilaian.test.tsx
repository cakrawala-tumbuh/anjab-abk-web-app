import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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
import { PESAN_DATA_BERUBAH } from "@/lib/konkurensi";
import type { MasalahRead, PenilaianRead } from "@/lib/api/schema";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: { code: "X", message: "ditolak" } },
  response: {
    status,
    headers: { get: (n: string) => (n.toLowerCase() === "etag" ? '"v1"' : "req-1") },
  },
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
  // Form ubah memuat rekamannya sendiri (GET detail + ETag); tunggu sampai selesai.
  await waitFor(() =>
    expect(screen.queryByRole("status", { name: "Memuat data" })).not.toBeInTheDocument(),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Sebaran K1–K4 (GET) dipanggil bagian penilaian pada setiap render.
  get.mockImplementation(async (path: string) =>
    path === "/api/v1/redesain/penilaian/{penilaian_id}"
      ? resp(penilaian())
      : resp({ masalah_id: "m1", jumlah_konfirmasi: 0, k1: {}, k2: {}, k3: {}, k4: {} }),
  );
});

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
    const aside = within(screen.getByLabelText("Saran sistem"));
    expect(aside.getByText("K - Klarifikasi")).toBeInTheDocument();
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
    expect(opsi.headers).toEqual({ "If-Match": '"v1"' });
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

  it("PATCH 412 → pesan baku data berubah, isian tetap", async () => {
    post.mockResolvedValue(halaman([penilaian()]));
    await renderBagian();
    patch.mockResolvedValue({
      data: undefined,
      error: { error: { code: "precondition_failed", message: "x" } },
      response: { status: 412, headers: { get: () => "req-1" } },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan penilaian" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe(PESAN_DATA_BERUBAH);
    expect(screen.getByRole("button", { name: "Simpan penilaian" })).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("GET detail gagal → tombol simpan tidak tersedia", async () => {
    post.mockResolvedValue(halaman([penilaian()]));
    get.mockImplementation(async (path: string) =>
      path === "/api/v1/redesain/penilaian/{penilaian_id}"
        ? resp(null, 403)
        : resp({ masalah_id: "m1", jumlah_konfirmasi: 0, k1: {}, k2: {}, k3: {}, k4: {} }),
    );
    await renderBagian();
    expect(screen.queryByRole("button", { name: "Simpan penilaian" })).not.toBeInTheDocument();
    expect(notifyGagal).toHaveBeenCalled();
  });

  it("search 403 melempar ApiError", async () => {
    post.mockResolvedValue(resp(null, 403));
    await expect(fetchPenilaianMasalah("tok", "m1")).rejects.toBeInstanceOf(ApiError);
  });
});
