import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth", () => ({ auth: () => authMock() }));
const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post, PATCH: patch }),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
const notifyGagal = vi.fn();
const notifySukses = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
  notifySukses: (m: string) => notifySukses(m),
}));

import DetailMasalahPage from "@/app/(auth)/redesain/masalah/[id]/page";
import { FormBukti } from "@/app/(auth)/redesain/masalah/[id]/form-bukti";
import { fetchBuktiMasalah } from "@/app/(auth)/redesain/masalah/[id]/data-bukti";
import { BAGIAN_DETAIL_MASALAH } from "@/app/(auth)/redesain/masalah/[id]/registry";
import { ApiError } from "@/lib/api/errors";
import { PESAN_DATA_BERUBAH } from "@/lib/konkurensi";
import { kodeBuktiPerLangkah } from "@/lib/redesain-alur";
import type { BuktiRead } from "@/lib/api/schema";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: "x", message: "ditolak" },
  response: { status, headers: { get: () => "req-1" } },
});
/** Respons GET detail yang membawa header ETag (kunci optimistik). */
const respEtag = (data: unknown, etag = '"v1"') => ({
  data,
  error: undefined,
  response: {
    status: 200,
    headers: { get: (n: string) => (n.toLowerCase() === "etag" ? etag : "req-1") },
  },
});
const halaman = (items: unknown[]) => resp({ items, total: items.length, limit: 500, offset: 0 });

const langkahL1 = {
  id: "l1",
  kode: "P-001-S01",
  urutan: 1,
  tahap: "Pengumpulan data",
  pemicu_input: "p",
  pelaksana: "Waka",
  pekerjaan_sistem: "s",
  keluaran_penerima: "k",
  pemeriksa_pemutus: null,
  hambatan: null,
  status_langkah: "Hipotesis",
};
const prosesP1 = {
  id: "p1",
  kode: "P-001",
  masalah_id: "m1",
  sekolah_id: "s1",
  periode: "TA 2026/27",
  nama_proses: "Penyusunan jadwal",
  langkah: [langkahL1],
};
const bukti = (p: Partial<BuktiRead> = {}): BuktiRead =>
  ({
    id: "b1",
    kode: "B-0001",
    masalah_id: "m1",
    langkah_id: "l1",
    unit_periode: "SD A, TA 2026/27",
    jenis: "SK/aturan",
    pembuat_kode_orang: null,
    pembuat_peran: null,
    independen: "Ya",
    klaim_didukung: "Jadwal disusun manual",
    klaim_tidak_didukung: null,
    tanggal_versi_lokasi: "Mei 2026, map SK",
    status_pemeriksaan: "Diperiksa sesuai klaim",
    pemeriksa_kode_orang: "O-0002",
    alasan: null,
    catatan_privasi_gap: null,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
    ...p,
  }) as BuktiRead;

function siapkan(daftar: BuktiRead[] = [bukti()]) {
  get.mockImplementation(async (path: string) => {
    if (path === "/api/v1/redesain/masalah/{masalah_id}")
      return resp({
        id: "m1",
        kode: "M-K01-01",
        konteks_id: "k1",
        sekolah_id: "s1",
        keterangan_sekolah: null,
        periode_acuan: "TA 2026/27",
        status_awal: "Hipotesis",
        gelombang: "G1",
        dibuka_untuk_konfirmasi: false,
      });
    if (path === "/api/v1/redesain/konteks")
      return halaman([{ id: "k1", kode: "K-01", tema: "Beban administrasi" }]);
    if (path === "/api/v1/sekolah") return halaman([{ id: "s1", nama: "SD Contoh" }]);
    if (path === "/api/v1/redesain/proses/{proses_id}") return resp(prosesP1);
    if (path === "/api/v1/redesain/bukti/{bukti_id}") return respEtag(daftar[0]);
    if (path === "/api/v1/redesain/langkah/{langkah_id}/koreksi") return halaman([]);
    if (path === "/api/v1/redesain/kode-orang")
      return halaman([
        { id: "ko1", kode: "O-0001", keterangan_peran: "Waka" },
        { id: "ko2", kode: "O-0002", keterangan_peran: "Kepsek" },
      ]);
    throw new Error(`GET tak terduga ${path}`);
  });
  post.mockImplementation(async (path: string) => {
    if (path === "/api/v1/redesain/proses/search") return halaman([prosesP1]);
    if (path === "/api/v1/redesain/bukti/search") return halaman(daftar);
    throw new Error(`POST tak terduga ${path}`);
  });
}

async function renderHalaman(sp: Record<string, string>) {
  const ui = await DetailMasalahPage({
    params: Promise.resolve({ id: "m1" }),
    searchParams: Promise.resolve(sp),
  });
  return render(ui);
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ accessToken: "tok", user: { groups: ["tim-kajian"] } });
});

describe("bagian bukti", () => {
  it("terdaftar di registry", () => {
    expect(BAGIAN_DETAIL_MASALAH.map((b) => b.kunci)).toContain("bukti");
  });

  it("daftar bukti merender label langkah kode — tahap, bukan id", async () => {
    siapkan();
    await renderHalaman({ bagian: "bukti" });
    const tabel = screen.getByRole("table");
    expect(within(tabel).getByText("P-001-S01 — Pengumpulan data")).toBeInTheDocument();
    expect(within(tabel).queryByText("l1")).toBeNull();
    expect(within(tabel).getByText("B-0001")).toBeInTheDocument();
    expect(within(tabel).getByText("O-0002")).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith(
      "/api/v1/redesain/bukti/search",
      expect.objectContaining({
        body: expect.objectContaining({ domain: [["masalah_id", "=", "m1"]] }),
      }),
    );
  });

  it("bagian alur menampilkan B-0001 di langkah yang ditautkan", async () => {
    siapkan();
    await renderHalaman({});
    const item = screen.getAllByRole("listitem")[0];
    expect(within(item).getByText("B-0001")).toBeInTheDocument();
  });

  it("kodeBuktiPerLangkah melewati bukti tanpa langkah", () => {
    const peta = kodeBuktiPerLangkah([
      { kode: "B-0002", langkah_id: "l1" },
      { kode: "B-0001", langkah_id: "l1" },
      { kode: "B-0003", langkah_id: null },
    ]);
    expect(peta.get("l1")).toEqual(["B-0001", "B-0002"]);
    expect(peta.size).toBe(1);
  });

  it("search bukti 403 melempar ApiError", async () => {
    post.mockResolvedValue(resp(null, 403));
    await expect(fetchBuktiMasalah("tok", "m1")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("FormBukti", () => {
  const langkah = [{ id: "l1", label: "P-001-S01 — Pengumpulan data" }];
  const isiWajib = () => {
    fireEvent.change(screen.getByLabelText("Unit / periode"), { target: { value: "SD A" } });
    fireEvent.change(screen.getByLabelText("Klaim didukung"), { target: { value: "klaim" } });
    fireEvent.change(screen.getByLabelText(/Tanggal \/ versi \/ lokasi/), {
      target: { value: "Mei 2026" },
    });
  };

  it("pilihan langkah hanya memuat langkah dari proses masalah ini", async () => {
    siapkan();
    render(<FormBukti masalahId="m1" langkah={langkah} accessToken="tok" />);
    const sel = screen.getByLabelText("Langkah alur");
    const teks = within(sel)
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(teks).toEqual(["— tidak ditautkan —", "P-001-S01 — Pengumpulan data"]);
  });

  it("status pemeriksaan punya empat nilai termasuk Diperiksa sesuai klaim", () => {
    siapkan();
    render(<FormBukti masalahId="m1" langkah={langkah} accessToken="tok" />);
    const opsi = within(screen.getByLabelText("Status pemeriksaan"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(opsi).toEqual([
      "Belum diperiksa",
      "Diperiksa terbatas",
      "Diperiksa sesuai klaim",
      "Diperselisihkan",
    ]);
  });

  it("label rujukan memuat larangan identitas murid", () => {
    siapkan();
    render(<FormBukti masalahId="m1" langkah={langkah} accessToken="tok" />);
    expect(screen.getByLabelText(/Jangan mencantumkan identitas murid/)).toBeInTheDocument();
  });

  it("mengirim pemeriksa_kode_orang dari PilihKodeOrang", async () => {
    siapkan();
    post.mockImplementation(async (path: string) =>
      path === "/api/v1/redesain/bukti" ? resp(bukti(), 201) : halaman([]),
    );
    const { container } = render(<FormBukti masalahId="m1" langkah={langkah} accessToken="tok" />);
    await waitFor(() => expect(screen.getAllByText("O-0002 — Kepsek").length).toBe(2));
    isiWajib();
    const pemeriksa = container.querySelector(
      "select[name='pemeriksa_kode_orang']",
    ) as HTMLSelectElement;
    fireEvent.change(pemeriksa, { target: { value: "O-0002" } });
    fireEvent.click(screen.getByRole("button", { name: "Tambah bukti" }));
    await waitFor(() => expect(notifySukses).toHaveBeenCalled());
    const [path, opts] = post.mock.calls.find((c) => c[0] === "/api/v1/redesain/bukti")!;
    expect(path).toBe("/api/v1/redesain/bukti");
    expect(opts.body).toMatchObject({ masalah_id: "m1", pemeriksa_kode_orang: "O-0002" });
    expect(refresh).toHaveBeenCalled();
  });

  it("tambah bukti 422 → toast gagal dan form tetap terbuka", async () => {
    siapkan();
    post.mockImplementation(async (path: string) =>
      path === "/api/v1/redesain/bukti" ? resp(null, 422) : halaman([]),
    );
    render(<FormBukti masalahId="m1" langkah={langkah} accessToken="tok" />);
    isiWajib();
    fireEvent.click(screen.getByRole("button", { name: "Tambah bukti" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tambah bukti" })).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("ubah bukti 422 via PATCH → toast gagal, form tidak ditutup", async () => {
    siapkan();
    patch.mockResolvedValue(resp(null, 422));
    render(<FormBukti masalahId="m1" langkah={langkah} awal={bukti()} accessToken="tok" />);
    expect(await screen.findByText("B-0001")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Simpan bukti" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(patch).toHaveBeenCalledWith(
      "/api/v1/redesain/bukti/{bukti_id}",
      expect.objectContaining({
        params: { path: { bukti_id: "b1" } },
        headers: { "If-Match": '"v1"' },
      }),
    );
    expect(screen.getByRole("button", { name: "Simpan bukti" })).toBeInTheDocument();
  });

  it("ubah bukti 412 → pesan baku data berubah, isian tetap", async () => {
    siapkan();
    patch.mockResolvedValue({
      data: undefined,
      error: { error: { code: "precondition_failed", message: "x" } },
      response: { status: 412, headers: { get: () => "req-1" } },
    });
    render(<FormBukti masalahId="m1" langkah={langkah} awal={bukti()} accessToken="tok" />);
    fireEvent.click(await screen.findByRole("button", { name: "Simpan bukti" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe(PESAN_DATA_BERUBAH);
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Simpan bukti" })).toBeInTheDocument();
  });

  it("GET detail bukti gagal → tombol simpan tidak tersedia", async () => {
    siapkan();
    const dasar = get.getMockImplementation()!;
    get.mockImplementation(async (path: string, ...r: unknown[]) =>
      path === "/api/v1/redesain/bukti/{bukti_id}" ? resp(null, 403) : dasar(path, ...r),
    );
    render(<FormBukti masalahId="m1" langkah={langkah} awal={bukti()} accessToken="tok" />);
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Simpan bukti" })).not.toBeInTheDocument();
  });

  it("mode tambah tidak melakukan GET detail bukti", () => {
    siapkan();
    render(<FormBukti masalahId="m1" langkah={langkah} accessToken="tok" />);
    expect(get.mock.calls.map((c) => c[0])).not.toContain("/api/v1/redesain/bukti/{bukti_id}");
  });
});
