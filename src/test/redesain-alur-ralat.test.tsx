import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth", () => ({
  auth: () => authMock(),
  GRUP_SEKOLAH_PENGISI: "sekolah-pengisi",
}));
const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post, PATCH: patch }),
}));
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
const notifySukses = vi.fn();
const notifyGagal = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifySukses: (m: string) => notifySukses(m),
  notifyGagal: (e: unknown) => notifyGagal(e),
}));

import { ApiError } from "@/lib/api/errors";
import KonfirmasiPage from "@/app/(auth)/redesain-sekolah/konfirmasi/[id]/page";
import IsianSayaPage from "@/app/(auth)/redesain-sekolah/isian-saya/page";
import { idDigantikan } from "@/lib/redesain-konfirmasi";

const P_ALUR = "/api/v1/redesain/konfirmasi/{konfirmasi_id}/alur";
const P_TAMPIL = "/api/v1/redesain/konfirmasi/{konfirmasi_id}/tampilkan-dugaan";
const P_KOREKSI = "/api/v1/redesain/langkah/{langkah_id}/koreksi";
const P_RALAT = "/api/v1/redesain/konfirmasi/{konfirmasi_id}/ralat";

const resp = (status = 200) => ({ status, headers: { get: () => "req-1" } });
const ok = (data: unknown, status = 200) => ({ data, response: resp(status) });
const gagal = (status: number, error: string, message: string) => ({
  data: undefined,
  error: { error, message },
  response: resp(status),
});

const masalahItem = {
  id: "m1",
  kode: "M-001",
  konteks_kode: "K-01",
  konteks_tema: "Administrasi",
  periode_acuan: "2026",
  sumber_awal_keterbatasan: "Wawancara",
  status_awal: "Terkonfirmasi",
};

const langkah = (id: string, urutan: number, kode: string) => ({
  id,
  kode,
  urutan,
  tahap: `Tahap-${kode}`,
  pemicu_input: "Pemicu",
  pelaksana: "Staf TU",
  pekerjaan_sistem: "Sistem",
  keluaran_penerima: "Keluaran",
  pemeriksa_pemutus: null,
  hambatan: null,
  status_langkah: "Hipotesis",
});

function konfirmasi(over: Record<string, unknown> = {}) {
  return {
    id: "kf1",
    masalah_id: "m1",
    status: "draf",
    cerita_sebelum: "Cerita",
    cerita_dikunci_pada: "2026-11-01T00:00:00Z",
    dugaan_ditampilkan_pada: "2026-11-01T01:00:00Z",
    ...over,
  };
}

function siapkan(k: Record<string, unknown>, proses: unknown[]) {
  get.mockImplementation(async (path: string) => {
    if (path === "/api/v1/redesain/sekolah/masalah")
      return ok({ total: 1, limit: 500, offset: 0, items: [masalahItem] });
    if (path === P_ALUR) return ok({ konfirmasi_id: "kf1", masalah_id: "m1", proses });
    return ok(k);
  });
  post.mockImplementation(async (path: string) =>
    path === P_TAMPIL
      ? ok({ rumusan_hipotesis: "RUMUSAN", dugaan_ditampilkan_pada: "x" })
      : ok({ id: "kor1" }, 201),
  );
}

async function buka() {
  render(await KonfirmasiPage({ params: Promise.resolve({ id: "kf1" }) }));
}

const proses2 = [
  {
    id: "p1",
    kode: "P-001",
    periode: "2026",
    nama_proses: "Penerimaan murid",
    // sengaja tidak terurut di respons
    langkah: [langkah("l2", 2, "P-001-S02"), langkah("l1", 1, "P-001-S01")],
  },
];

beforeEach(() => {
  for (const m of [get, post, patch, push, refresh, notifySukses, notifyGagal]) m.mockReset();
  authMock.mockResolvedValue({ accessToken: "tok", user: { groups: ["sekolah-pengisi"] } });
});

describe("panel alur di langkah 2", () => {
  it("dugaan belum tampil → panel tidak dirender dan /alur tidak dipanggil", async () => {
    siapkan(konfirmasi({ dugaan_ditampilkan_pada: null }), proses2);
    await buka();
    expect(screen.queryByText("Alur kerja menurut catatan Tim")).toBeNull();
    expect(get.mock.calls.map((c) => c[0])).not.toContain(P_ALUR);
  });

  it("merender 2 langkah terurut `urutan` dengan kolom alur", async () => {
    siapkan(konfirmasi(), proses2);
    await buka();
    fireEvent.click(screen.getByRole("button", { name: "2. Periksa dugaan" }));
    const item = screen.getAllByTestId("langkah-alur");
    expect(item).toHaveLength(2);
    expect(item[0]).toHaveTextContent("P-001-S01");
    expect(item[1]).toHaveTextContent("P-001-S02");
    expect(within(item[0]).getByText("Staf TU")).toBeInTheDocument();
  });

  it("0 proses → 'Belum ada peta alur untuk sekolah ini'", async () => {
    siapkan(konfirmasi(), []);
    await buka();
    fireEvent.click(screen.getByRole("button", { name: "2. Periksa dugaan" }));
    expect(screen.getByText("Belum ada peta alur untuk sekolah ini")).toBeInTheDocument();
  });

  it("/alur gagal 403 → panel galat, bukan peta kosong", async () => {
    siapkan(konfirmasi(), proses2);
    get.mockImplementation(async (path: string) => {
      if (path === "/api/v1/redesain/sekolah/masalah")
        return ok({ total: 1, limit: 500, offset: 0, items: [masalahItem] });
      if (path === P_ALUR) return gagal(403, "FORBIDDEN", "ditolak");
      return ok(konfirmasi());
    });
    await buka();
    expect(screen.queryByText("Belum ada peta alur untuk sekolah ini")).toBeNull();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("koreksi langkah", () => {
  async function bukaKoreksi() {
    siapkan(konfirmasi(), proses2);
    await buka();
    fireEvent.click(screen.getByRole("button", { name: "2. Periksa dugaan" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Tambah koreksi" })[0]);
  }

  it("kirim {isi, konfirmasi_id} → toast sukses setelah 201", async () => {
    await bukaKoreksi();
    fireEvent.change(screen.getByLabelText("Koreksi untuk langkah ini"), {
      target: { value: "Seharusnya oleh kepala TU" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kirim koreksi" }));
    await waitFor(() =>
      expect(notifySukses).toHaveBeenCalledWith("Koreksi tercatat; Tim akan merekonsiliasi"),
    );
    expect(post).toHaveBeenCalledWith(P_KOREKSI, {
      params: { path: { langkah_id: "l1" } },
      body: { isi: "Seharusnya oleh kepala TU", konfirmasi_id: "kf1" },
    });
  });

  it("422 isi kosong → toast gagal dan pesan inline", async () => {
    await bukaKoreksi();
    post.mockResolvedValue(gagal(422, "VALIDATION_ERROR", "isi tidak boleh kosong"));
    fireEvent.click(screen.getByRole("button", { name: "Kirim koreksi" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(notifySukses).not.toHaveBeenCalled();
    expect(await screen.findByText(/isi tidak boleh kosong/)).toBeInTheDocument();
  });
});

describe("Isian Saya", () => {
  const konf = (id: string, status: string, over: Record<string, unknown> = {}) => ({
    id,
    masalah_id: "m1",
    status,
    dikirim_pada: status === "terkirim" ? "2026-11-01T00:00:00Z" : null,
    menggantikan_id: null,
    ...over,
  });

  function daftar(items: unknown[]) {
    get.mockImplementation(async (path: string) =>
      path === "/api/v1/redesain/sekolah/masalah"
        ? ok({ total: 1, limit: 500, offset: 0, items: [masalahItem] })
        : ok({ total: items.length, limit: 500, offset: 0, items }),
    );
  }

  it("idDigantikan: record yang ditunjuk menggantikan_id record lain", () => {
    expect([...idDigantikan([{ id: "a" }, { id: "b", menggantikan_id: "a" }])]).toEqual(["a"]);
  });

  it("menandai digantikan: tanpa tombol ralat; versi ralat bertanda; draf tanpa ralat", async () => {
    daftar([
      konf("a", "terkirim"),
      konf("b", "terkirim", { menggantikan_id: "a" }),
      konf("c", "draf"),
    ]);
    render(await IsianSayaPage());
    const baris = screen.getAllByRole("row").slice(1);
    expect(within(baris[0]).queryByRole("button", { name: "Ralat isian" })).toBeNull();
    expect(within(baris[0]).getByText(/Sudah digantikan/)).toBeInTheDocument();
    expect(within(baris[1]).getByRole("button", { name: "Ralat isian" })).toBeInTheDocument();
    expect(within(baris[1]).getByText("Ralat dari versi sebelumnya")).toBeInTheDocument();
    expect(within(baris[2]).queryByRole("button", { name: "Ralat isian" })).toBeNull();
    expect(within(baris[0]).getByText("M-001")).toBeInTheDocument();
  });

  it("ralat 201 → membuka wizard record BARU", async () => {
    daftar([konf("a", "terkirim")]);
    post.mockResolvedValue(ok({ id: "baru1" }, 201));
    render(await IsianSayaPage());
    fireEvent.click(screen.getByRole("button", { name: "Ralat isian" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/redesain-sekolah/konfirmasi/baru1"));
    expect(post).toHaveBeenCalledWith(P_RALAT, { params: { path: { konfirmasi_id: "a" } } });
  });

  it("ralat 409 → pesan 'sudah diralat atau masih draf'", async () => {
    daftar([konf("a", "terkirim")]);
    post.mockResolvedValue(gagal(409, "KONFIRMASI_SUDAH_DIRALAT", "pesan backend"));
    render(await IsianSayaPage());
    fireEvent.click(screen.getByRole("button", { name: "Ralat isian" }));
    expect(await screen.findByText("Isian ini sudah diralat atau masih draf")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("/konfirmasi/saya 403 melempar ApiError → panel galat, bukan 'Belum ada isian'", async () => {
    get.mockImplementation(async (path: string) =>
      path === "/api/v1/redesain/sekolah/masalah"
        ? ok({ total: 0, limit: 500, offset: 0, items: [] })
        : gagal(403, "FORBIDDEN", "ditolak"),
    );
    render(await IsianSayaPage());
    expect(screen.queryByText("Belum ada isian.")).toBeNull();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(ApiError).toBeDefined();
  });
});
