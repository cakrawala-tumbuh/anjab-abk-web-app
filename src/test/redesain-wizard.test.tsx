import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn().mockResolvedValue({ accessToken: "tok", user: { groups: ["sekolah-pengisi"] } }),
}));
const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post, PATCH: patch }),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh }) }));

import { ApiError } from "@/lib/api/errors";
import KonfirmasiPage from "@/app/(auth)/redesain-sekolah/konfirmasi/[id]/page";

const P_KUNCI = "/api/v1/redesain/konfirmasi/{konfirmasi_id}/kunci-cerita";
const P_TAMPIL = "/api/v1/redesain/konfirmasi/{konfirmasi_id}/tampilkan-dugaan";
const P_ALUR = "/api/v1/redesain/konfirmasi/{konfirmasi_id}/alur";
const P_KIRIM = "/api/v1/redesain/konfirmasi/{konfirmasi_id}/kirim";

const resp = (status = 200) => ({ status, headers: { get: () => "req-1" } });
const ok = (data: unknown) => ({ data, response: resp() });
const gagal = (status: number, error: string, message: string, details?: unknown[]) => ({
  data: undefined,
  error: { error, message, details },
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

function konfirmasi(over: Record<string, unknown> = {}) {
  return {
    id: "kf1",
    masalah_id: "m1",
    status: "draf",
    cerita_sebelum: null,
    cerita_dikunci_pada: null,
    dugaan_ditampilkan_pada: null,
    kesesuaian: null,
    koreksi: null,
    k1: null,
    k2: null,
    k3: null,
    k4: null,
    alasan_k: null,
    indikasi_risiko: null,
    bukti_dapat_diperiksa: null,
    hal_belum_jelas: null,
    masalah_baru: null,
    catatan_independensi: null,
    catatan_akses: null,
    peran: null,
    ...over,
  };
}

function siapkan(k: Record<string, unknown>) {
  get.mockImplementation(async (path: string) => {
    if (path === "/api/v1/redesain/sekolah/masalah")
      return ok({ total: 1, limit: 500, offset: 0, items: [masalahItem] });
    if (path === P_ALUR) return ok({ konfirmasi_id: "kf1", masalah_id: "m1", proses: [] });
    return ok(k);
  });
  post.mockImplementation(async (path: string) =>
    path === P_TAMPIL
      ? ok({
          rumusan_hipotesis: "RUMUSAN-RAHASIA",
          dugaan_ditampilkan_pada: "2026-11-01T00:00:00Z",
        })
      : ok({}),
  );
  patch.mockResolvedValue(ok({}));
}

async function buka() {
  render(await KonfirmasiPage({ params: Promise.resolve({ id: "kf1" }) }));
}

const DIKUNCI = { cerita_sebelum: "Cerita saya", cerita_dikunci_pada: "2026-11-01T00:00:00Z" };
const TAMPIL = { ...DIKUNCI, dugaan_ditampilkan_pada: "2026-11-01T01:00:00Z" };

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  patch.mockReset();
  refresh.mockReset();
  vi.restoreAllMocks();
});

describe("wizard konfirmasi sekolah", () => {
  it("draf baru: hanya langkah 1 aktif; tampilkan-dugaan tidak terpanggil; rumusan tak ada", async () => {
    siapkan(konfirmasi());
    await buka();
    expect(screen.getByRole("heading", { name: "1. Ceritakan dahulu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2. Periksa dugaan" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "3. Jelaskan akibat" })).toBeDisabled();
    expect(post).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain("RUMUSAN-RAHASIA");
  });

  it("Kunci cerita memanggil kunci-cerita setelah confirm disetujui", async () => {
    siapkan(konfirmasi());
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await buka();
    fireEvent.change(screen.getByLabelText("Cerita Anda"), { target: { value: "Cerita saya" } });
    fireEvent.click(screen.getByRole("button", { name: "Kunci cerita" }));
    await waitFor(() => expect(post).toHaveBeenCalledWith(P_KUNCI, expect.anything()));
    expect(window.confirm).toHaveBeenCalledWith("Cerita tidak dapat diubah lagi");
    expect(post).not.toHaveBeenCalledWith(P_TAMPIL, expect.anything());
  });

  it("confirm ditolak → kunci-cerita tidak dipanggil", async () => {
    siapkan(konfirmasi());
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await buka();
    fireEvent.click(screen.getByRole("button", { name: "Kunci cerita" }));
    expect(post).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
  });

  it("cerita terkunci: cerita read-only, langkah 2 aktif dengan tombol Tampilkan dugaan", async () => {
    siapkan(konfirmasi(DIKUNCI));
    await buka();
    expect(screen.getByRole("button", { name: "Tampilkan dugaan" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "1. Ceritakan dahulu" }));
    expect(screen.getByLabelText("Cerita Anda")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Kunci cerita" })).toBeNull();
    expect(post).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain("RUMUSAN-RAHASIA");
  });

  it("tampilkan-dugaan 200 → rumusan tampil dan kesesuaian aktif (4 nilai)", async () => {
    siapkan(konfirmasi(DIKUNCI));
    await buka();
    fireEvent.click(screen.getByRole("button", { name: "Tampilkan dugaan" }));
    expect(await screen.findByText("RUMUSAN-RAHASIA")).toBeInTheDocument();
    const sel = screen.getByLabelText(/Apakah dugaan ini sesuai/);
    expect(sel).not.toBeDisabled();
    expect(Array.from((sel as HTMLSelectElement).options).map((o) => o.value)).toEqual([
      "",
      "Ya",
      "Sebagian",
      "Tidak",
      "Belum bisa memastikan",
    ]);
  });

  it("kunjungan ulang setelah dugaan tampil memanggil tampilkan-dugaan di server untuk rumusan", async () => {
    siapkan(konfirmasi(TAMPIL));
    await buka();
    expect(post).toHaveBeenCalledWith(P_TAMPIL, expect.anything());
    expect(screen.getByRole("heading", { name: "3. Jelaskan akibat" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "2. Periksa dugaan" }));
    expect(screen.getByText("RUMUSAN-RAHASIA")).toBeInTheDocument();
  });

  it("langkah 4: indikasi_risiko tiga nilai A-2 dan teks eskalasi tetap", async () => {
    siapkan(konfirmasi(TAMPIL));
    await buka();
    fireEvent.click(screen.getByRole("button", { name: "4. Periksa sumber" }));
    const sel = screen.getByLabelText("Indikasi risiko") as HTMLSelectElement;
    expect(Array.from(sel.options).map((o) => o.value)).toEqual([
      "",
      "Ada indikasi",
      "Tidak terlihat",
      "Belum tahu",
    ]);
    fireEvent.change(sel, { target: { value: "Ada indikasi" } });
    expect(
      screen.getByText("Tim Kajian akan segera menindaklanjuti tanpa menunggu penilaian"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("note").length).toBeGreaterThan(0);
  });

  it("PATCH 409 CERITA_SUDAH_DIKUNCI → pesan pemetaan, bukan toast sukses", async () => {
    siapkan(konfirmasi());
    patch.mockResolvedValue(gagal(409, "CERITA_SUDAH_DIKUNCI", "pesan backend"));
    const notif = await import("@/lib/notify");
    const sukses = vi.spyOn(notif, "notifySukses");
    await buka();
    fireEvent.click(screen.getByRole("button", { name: "Simpan draf" }));
    expect(
      await screen.findByText("Cerita sudah dikunci dan tidak dapat diubah"),
    ).toBeInTheDocument();
    expect(sukses).not.toHaveBeenCalled();
  });

  it("kirim 422 dengan details k3 → pesan menyebut K3 dan status tetap draf", async () => {
    siapkan(konfirmasi(TAMPIL));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    post.mockImplementation(async (path: string) =>
      path === P_KIRIM
        ? gagal(422, "validation_error", "Field wajib belum diisi: k3", [
            { loc: ["body", "k3"], msg: "Wajib diisi.", type: "missing" },
          ])
        : ok({ rumusan_hipotesis: "R", dugaan_ditampilkan_pada: "t" }),
    );
    await buka();
    fireEvent.click(screen.getByRole("button", { name: "5. Tutup sesi" }));
    fireEvent.click(screen.getByRole("button", { name: "Kirim" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("K3");
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Kirim" })).toBeInTheDocument();
  });

  it("terkirim: seluruh kontrol read-only dan tanpa tombol Kirim", async () => {
    siapkan(konfirmasi({ ...TAMPIL, status: "terkirim", kesesuaian: "Ya" }));
    await buka();
    expect(screen.queryByRole("button", { name: "Kirim" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "4. Periksa sumber" }));
    expect(screen.getByLabelText("Indikasi risiko")).toBeDisabled();
    expect(screen.getByLabelText("Bukti yang dapat diperiksa")).toHaveAttribute("readonly");
  });

  it("GET konfirmasi gagal 500 → ApiError tampil, bukan formulir kosong", async () => {
    get.mockResolvedValue(gagal(500, "internal", "Galat server"));
    await buka();
    expect(screen.getByRole("alert")).toHaveTextContent("Galat server");
    expect(screen.queryByLabelText("Cerita Anda")).toBeNull();
    expect(ApiError).toBeDefined();
  });
});
