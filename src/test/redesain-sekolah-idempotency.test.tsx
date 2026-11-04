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
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
const notifyGagal = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifySukses: vi.fn(),
  notifyGagal: (e: unknown) => notifyGagal(e),
}));

import { MulaiIsiTombol } from "@/app/(auth)/redesain-sekolah/mulai-isi-tombol";
import { RalatTombol } from "@/app/(auth)/redesain-sekolah/isian-saya/ralat-tombol";
import { KoreksiLangkah } from "@/app/(auth)/redesain-sekolah/konfirmasi/[id]/panel-alur";
import KonfirmasiPage from "@/app/(auth)/redesain-sekolah/konfirmasi/[id]/page";
import { PESAN_MASIH_DIPROSES } from "@/lib/konkurensi";

const P_KUNCI = "/api/v1/redesain/konfirmasi/{konfirmasi_id}/kunci-cerita";
const P_TAMPIL = "/api/v1/redesain/konfirmasi/{konfirmasi_id}/tampilkan-dugaan";
const P_KIRIM = "/api/v1/redesain/konfirmasi/{konfirmasi_id}/kirim";
const P_ALUR = "/api/v1/redesain/konfirmasi/{konfirmasi_id}/alur";

const resp = (status = 200) => ({ status, headers: { get: () => "req-1" } });
const ok = (data: unknown, status = 200) => ({ data, response: resp(status) });
const gagal = (status: number, error: string, message: string) => ({
  data: undefined,
  error: { error, message },
  response: resp(status),
});

/** Klik tombol setelah ia aktif lagi (loading selesai), agar tidak menembak tombol disabled. */
async function klikSetelahAktif(name: string | RegExp) {
  await waitFor(() => expect(screen.getByRole("button", { name })).not.toBeDisabled());
  fireEvent.click(screen.getByRole("button", { name }));
}

/** Ambil nilai Idempotency-Key dari panggilan POST ke-`n` (0-based). */
const keyKe = (n: number): string =>
  (post.mock.calls[n][1] as { headers: Record<string, string> }).headers["Idempotency-Key"];

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

const masalahItem = {
  id: "m1",
  kode: "M-001",
  konteks_kode: "K-01",
  konteks_tema: "Administrasi",
  periode_acuan: "2026",
  sumber_awal_keterbatasan: "Wawancara",
  status_awal: "Terkonfirmasi",
};

function siapkanWizard(k: Record<string, unknown>) {
  get.mockImplementation(async (path: string) => {
    if (path === "/api/v1/redesain/sekolah/masalah")
      return ok({ total: 1, limit: 500, offset: 0, items: [masalahItem] });
    if (path === P_ALUR) return ok({ konfirmasi_id: "kf1", masalah_id: "m1", proses: [] });
    return ok(k);
  });
  patch.mockResolvedValue(ok({}));
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  patch.mockReset();
  push.mockReset();
  refresh.mockReset();
  notifyGagal.mockReset();
  vi.restoreAllMocks();
});

describe("Idempotency-Key — Mulai isi", () => {
  it("dua klik pada upaya yang gagal memakai key yang sama; setelah sukses key berganti", async () => {
    post.mockResolvedValueOnce(gagal(500, "internal", "galat"));
    post.mockResolvedValueOnce(ok({ id: "baru" }, 201));
    post.mockResolvedValueOnce(ok({ id: "baru2" }, 201));
    render(<MulaiIsiTombol masalahId="m1" accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Mulai isi" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    await klikSetelahAktif(/Mulai isi|Memulai/);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(keyKe(1)).toBe(keyKe(0));
    await klikSetelahAktif(/Mulai isi|Memulai/);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(3));
    expect(keyKe(2)).not.toBe(keyKe(1));
  });

  it("409 conflict → pesan baku tanpa refresh; 409 kode lain tetap refresh", async () => {
    post.mockResolvedValueOnce(gagal(409, "conflict", "sedang diproses"));
    render(<MulaiIsiTombol masalahId="m1" accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Mulai isi" }));
    expect(await screen.findByText(PESAN_MASIH_DIPROSES)).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();

    post.mockResolvedValueOnce(gagal(409, "KONFIRMASI_SUDAH_ADA", "sudah ada"));
    await klikSetelahAktif("Mulai isi");
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});

describe("Idempotency-Key — Ralat isian", () => {
  it("kirim ulang setelah gagal memakai key sama; 409 conflict → pesan baku", async () => {
    post.mockResolvedValueOnce(gagal(409, "conflict", "sedang diproses"));
    post.mockResolvedValueOnce(gagal(409, "KONFIRMASI_SUDAH_DIRALAT", "sudah"));
    render(<RalatTombol konfirmasiId="a" accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Ralat isian" }));
    expect(await screen.findByText(PESAN_MASIH_DIPROSES)).toBeInTheDocument();
    await klikSetelahAktif("Ralat isian");
    expect(await screen.findByText("Isian ini sudah diralat atau masih draf")).toBeInTheDocument();
    expect(keyKe(1)).toBe(keyKe(0));
  });
});

describe("Idempotency-Key — Koreksi langkah", () => {
  it("kirim ulang setelah gagal memakai key sama; setelah sukses key berganti", async () => {
    post.mockResolvedValueOnce(gagal(500, "internal", "galat"));
    post.mockResolvedValueOnce(ok({ id: "k1" }, 201));
    post.mockResolvedValueOnce(ok({ id: "k2" }, 201));
    render(<KoreksiLangkah langkahId="l1" konfirmasiId="kf1" accessToken="tok" />);
    const kirimKoreksi = async () => {
      fireEvent.click(screen.getByRole("button", { name: "Tambah koreksi" }));
      fireEvent.change(screen.getByLabelText("Koreksi untuk langkah ini"), {
        target: { value: "isi" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Kirim koreksi" }));
    };
    await kirimKoreksi();
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    await klikSetelahAktif("Kirim koreksi");
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(keyKe(1)).toBe(keyKe(0));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Tambah koreksi" })).toBeTruthy(),
    );
    await kirimKoreksi();
    await waitFor(() => expect(post).toHaveBeenCalledTimes(3));
    expect(keyKe(2)).not.toBe(keyKe(1));
  });

  it("409 conflict → pesan baku; 409 kode lain tidak dipetakan", async () => {
    post.mockResolvedValueOnce(gagal(409, "conflict", "sedang diproses"));
    post.mockResolvedValueOnce(gagal(409, "kode_lain", "pesan asli"));
    render(<KoreksiLangkah langkahId="l1" konfirmasiId="kf1" accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Tambah koreksi" }));
    fireEvent.change(screen.getByLabelText("Koreksi untuk langkah ini"), {
      target: { value: "isi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kirim koreksi" }));
    expect(await screen.findByText(PESAN_MASIH_DIPROSES)).toBeInTheDocument();
    await klikSetelahAktif("Kirim koreksi");
    expect(await screen.findByText("pesan asli")).toBeInTheDocument();
    expect(screen.queryByText(PESAN_MASIH_DIPROSES)).toBeNull();
  });
});

describe("Idempotency-Key — wizard", () => {
  async function buka() {
    render(await KonfirmasiPage({ params: Promise.resolve({ id: "kf1" }) }));
  }

  it("kunci-cerita membawa Idempotency-Key", async () => {
    siapkanWizard(konfirmasi());
    vi.spyOn(window, "confirm").mockReturnValue(true);
    post.mockImplementation(async (path: string) =>
      path === P_TAMPIL ? ok({ rumusan_hipotesis: "R", dugaan_ditampilkan_pada: "t" }) : ok({}),
    );
    await buka();
    fireEvent.change(screen.getByLabelText("Cerita Anda"), { target: { value: "Cerita" } });
    fireEvent.click(screen.getByRole("button", { name: "Kunci cerita" }));
    await waitFor(() => expect(post).toHaveBeenCalledWith(P_KUNCI, expect.anything()));
    const keyKunci = (
      post.mock.calls.find((c) => c[0] === P_KUNCI)![1] as {
        headers: Record<string, string>;
      }
    ).headers["Idempotency-Key"];
    expect(keyKunci).toBeTruthy();
  });

  it("kirim: gagal lalu kirim ulang memakai key sama, berbeda dari kunci-cerita", async () => {
    siapkanWizard(
      konfirmasi({
        cerita_sebelum: "C",
        cerita_dikunci_pada: "2026-11-01T00:00:00Z",
        dugaan_ditampilkan_pada: "2026-11-01T01:00:00Z",
      }),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    post.mockImplementation(async (path: string) =>
      path === P_KIRIM ? gagal(500, "internal", "galat") : ok({ rumusan_hipotesis: "R" }),
    );
    await buka();
    fireEvent.click(screen.getByRole("button", { name: "5. Tutup sesi" }));
    fireEvent.click(screen.getByRole("button", { name: "Kirim" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    await klikSetelahAktif("Kirim");
    await waitFor(() => expect(post.mock.calls.filter((c) => c[0] === P_KIRIM)).toHaveLength(2));
    const keys = post.mock.calls
      .filter((c) => c[0] === P_KIRIM)
      .map((c) => (c[1] as { headers: Record<string, string> }).headers["Idempotency-Key"]);
    expect(keys[1]).toBe(keys[0]);
  });

  it("kirim sukses → key kirim berganti pada upaya berikutnya; 409 conflict → pesan baku", async () => {
    siapkanWizard(
      konfirmasi({
        cerita_sebelum: "C",
        cerita_dikunci_pada: "2026-11-01T00:00:00Z",
        dugaan_ditampilkan_pada: "2026-11-01T01:00:00Z",
      }),
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    let n = 0;
    post.mockImplementation(async (path: string) => {
      if (path !== P_KIRIM) return ok({ rumusan_hipotesis: "R" });
      n += 1;
      return n === 1 ? ok({}) : gagal(409, "conflict", "sedang diproses");
    });
    await buka();
    fireEvent.click(screen.getByRole("button", { name: "5. Tutup sesi" }));
    fireEvent.click(screen.getByRole("button", { name: "Kirim" }));
    await waitFor(() => expect(n).toBe(1));
    await klikSetelahAktif("Kirim");
    expect(await screen.findByText(PESAN_MASIH_DIPROSES)).toBeInTheDocument();
    const keys = post.mock.calls
      .filter((c) => c[0] === P_KIRIM)
      .map((c) => (c[1] as { headers: Record<string, string> }).headers["Idempotency-Key"]);
    expect(keys[1]).not.toBe(keys[0]);
  });

  it("409 dengan kode lain (CERITA_SUDAH_DIKUNCI) tidak dipetakan ke pesan masih diproses", async () => {
    siapkanWizard(konfirmasi());
    vi.spyOn(window, "confirm").mockReturnValue(true);
    post.mockResolvedValue(gagal(409, "CERITA_SUDAH_DIKUNCI", "pesan backend"));
    await buka();
    fireEvent.click(screen.getByRole("button", { name: "Kunci cerita" }));
    expect(
      await screen.findByText("Cerita sudah dikunci dan tidak dapat diubah"),
    ).toBeInTheDocument();
    expect(screen.queryByText(PESAN_MASIH_DIPROSES)).toBeNull();
  });
});
