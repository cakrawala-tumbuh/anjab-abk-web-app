import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn(), GRUP_TIM_KAJIAN: "tim-kajian" }));
const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ GET: get, POST: post }) }));
const notifyGagal = vi.fn();
const notifySukses = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
  notifySukses: (m: string) => notifySukses(m),
}));

import { auth } from "@/lib/auth/auth";
import DetailProtokolPage from "@/app/(auth)/riset/protokol/[id]/page";
import { SignoffForm } from "@/app/(auth)/riset/protokol/[id]/signoff-form";
import { KONFIRMASI_SIGNOFF } from "@/lib/riset-signoff";
import type { RisetProtokolRead, SignoffRead } from "@/lib/api/schema";

const protokol = (o: Partial<RisetProtokolRead> = {}): RisetProtokolRead => ({
  id: "p-1",
  kode: "P-01",
  versi: 1,
  judul: "Protokol satu",
  status: "TERKUNCI",
  isi_hash: "deadbeef",
  dibuat_oleh: "u",
  dikunci_oleh: "u",
  dikunci_pada: "2026-11-10T00:00:00Z",
  created_at: "2026-11-10T00:00:00Z",
  updated_at: "2026-11-10T00:00:00Z",
  isi: "ISI",
  signoff_ada: false,
  ...o,
});
const signoff: SignoffRead = {
  id: "s-1",
  protokol_id: "p-1",
  pi_nama: "Dr. Ayu Lestari",
  tanggal_persetujuan_etik: "2026-11-01",
  nomor_persetujuan_etik: "KEPK/12/2026",
  lampiran_nama: "etik.pdf",
  lampiran_ukuran: 2048,
  lampiran_sha256: "abc123sha",
  dicatat_oleh: "tim-kajian-1",
  created_at: "2026-11-12T03:00:00Z",
};
const ok = (data: unknown) => ({ data, response: { status: 200, headers: { get: () => "r1" } } });
const gagal = (status: number, error: string, message: string) => ({
  data: undefined,
  error: { error, message },
  response: { status, headers: { get: () => "r2" } },
});

function mockGet(p: RisetProtokolRead, sign: unknown = ok(signoff)) {
  get.mockImplementation(async (path: string) => {
    if (path.endsWith("/statistik") || path.endsWith("/kasus-negatif")) {
      return ok({ items: [], total: 0 });
    }
    if (path.endsWith("/sign-off")) return sign;
    return ok(p);
  });
}
const halaman = async () =>
  render(await DetailProtokolPage({ params: Promise.resolve({ id: "p-1" }) }));

beforeEach(() => {
  [push, refresh, get, post, notifyGagal, notifySukses].forEach((m) => m.mockReset());
  vi.mocked(auth).mockResolvedValue({
    accessToken: "tok",
    user: { groups: ["tim-kajian"] },
  } as never);
});
afterEach(() => vi.unstubAllGlobals());

describe("bagian Sign-off PI/etik pada detail protokol", () => {
  it("DRAF: hanya teks 'Kunci protokol dulu', tanpa form dan tanpa GET sign-off", async () => {
    mockGet(protokol({ status: "DRAF", isi_hash: null }));
    await halaman();
    expect(screen.getByText(/Kunci protokol dulu untuk mencatat sign-off PI\/etik/)).toBeTruthy();
    expect(screen.queryByRole("form", { name: "Catat sign-off PI/etik" })).toBeNull();
    expect(get.mock.calls.some(([p]) => String(p).endsWith("/sign-off"))).toBe(false);
  });

  it("TERKUNCI tanpa sign-off: form tampil, GET sign-off tidak dipanggil", async () => {
    mockGet(protokol());
    await halaman();
    expect(screen.getByRole("form", { name: "Catat sign-off PI/etik" })).toBeTruthy();
    expect(screen.getByText(/ketua tim kajian sebagai PI/)).toBeTruthy();
    expect(get.mock.calls.some(([p]) => String(p).endsWith("/sign-off"))).toBe(false);
  });

  it("TERKUNCI dengan sign-off: metadata dan tautan unduh, tanpa form", async () => {
    mockGet(protokol({ signoff_ada: true }));
    await halaman();
    expect(screen.getByText("Dr. Ayu Lestari")).toBeTruthy();
    expect(screen.getByText("KEPK/12/2026")).toBeTruthy();
    expect(screen.getByText("etik.pdf (2 KiB)")).toBeTruthy();
    expect(screen.getByText("tim-kajian-1")).toBeTruthy();
    expect(screen.getByText("abc123sha")).toBeTruthy();
    const unduh = screen.getByRole("link", { name: "Unduh PDF persetujuan etik" });
    expect(unduh.getAttribute("href")).toBe("/api/riset/protokol/p-1/sign-off/lampiran");
    expect(screen.queryByRole("form", { name: "Catat sign-off PI/etik" })).toBeNull();
  });

  it("signoff_ada=true tetapi GET metadata gagal -> halaman melempar, bukan kosong", async () => {
    mockGet(protokol({ signoff_ada: true }), gagal(500, "boom", "Gagal metadata"));
    await expect(DetailProtokolPage({ params: Promise.resolve({ id: "p-1" }) })).rejects.toThrow(
      "Gagal metadata",
    );
  });
});

describe("SignoffForm", () => {
  const pdf = (ukuran = 100, nama = "etik.pdf", tipe = "application/pdf") => {
    const f = new File(["%PDF-1"], nama, { type: tipe });
    Object.defineProperty(f, "size", { value: ukuran });
    return f;
  };
  function isi(berkas: File | null = pdf(), tanggal = "2026-11-01") {
    fireEvent.change(screen.getByLabelText(/Nama PI/), { target: { value: "Dr. Ayu" } });
    fireEvent.change(screen.getByLabelText(/Tanggal persetujuan etik/), {
      target: { value: tanggal },
    });
    if (berkas) {
      fireEvent.change(screen.getByLabelText(/Berkas PDF persetujuan etik/), {
        target: { files: [berkas] },
      });
    }
  }
  const kirim = () => fireEvent.click(screen.getByRole("button", { name: "Simpan sign-off" }));

  it("berkas bukan PDF ditolak di klien tanpa request", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<SignoffForm protokolId="p-1" />);
    isi(pdf(100, "foto.png", "image/png"));
    kirim();
    expect(screen.getByText("Berkas harus berformat PDF.")).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("berkas > 5 MiB ditolak di klien tanpa request", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<SignoffForm protokolId="p-1" />);
    isi(pdf(5 * 1024 * 1024 + 1));
    kirim();
    expect(screen.getByText(/Berkas melebihi 5 MiB/)).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("tanggal masa depan, nama kosong, dan tanpa berkas ditolak tanpa request", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<SignoffForm protokolId="p-1" />);
    fireEvent.change(screen.getByLabelText(/Tanggal persetujuan etik/), {
      target: { value: "2999-01-01" },
    });
    kirim();
    expect(screen.getByText("Nama PI wajib diisi.")).toBeTruthy();
    expect(screen.getByText(/tidak boleh di masa depan/)).toBeTruthy();
    expect(screen.getByText(/Berkas PDF persetujuan etik wajib dipilih/)).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("confirm ditolak -> tidak ada request", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<SignoffForm protokolId="p-1" />);
    isi();
    kirim();
    expect(window.confirm).toHaveBeenCalledWith(KONFIRMASI_SIGNOFF);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sukses 201 -> POST multipart ke Route Handler, notifikasi, lalu refresh", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(signoff), { status: 201 }));
    vi.stubGlobal("fetch", fetchSpy);
    render(<SignoffForm protokolId="p-1" />);
    isi();
    kirim();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/riset/protokol/p-1/sign-off");
    expect(init.method).toBe("POST");
    const fd = init.body as FormData;
    expect(fd.get("pi_nama")).toBe("Dr. Ayu");
    expect(fd.get("tanggal_persetujuan_etik")).toBe("2026-11-01");
    expect((fd.get("lampiran") as File).name).toBe("etik.pdf");
    expect(init.headers).toBeUndefined();
    expect(notifySukses).toHaveBeenCalledTimes(1);
  });

  it.each([
    [409, "SIGNOFF_SUDAH_ADA", /sudah punya sign-off/],
    [409, "PROTOKOL_BELUM_TERKUNCI", /Kunci protokol dulu/],
    [422, "LAMPIRAN_BUKAN_PDF", /bukan PDF/],
    [422, "LAMPIRAN_TERLALU_BESAR", /melebihi batas 5 MiB/],
  ])(
    "%i %s -> pesan Indonesia spesifik, tanpa refresh dan tanpa notifikasi sukses",
    async (status, kode, pola) => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            new Response(JSON.stringify({ error: kode, message: "pesan mentah" }), { status }),
          ),
      );
      render(<SignoffForm protokolId="p-1" />);
      isi();
      kirim();
      const alert = await screen.findByText(pola);
      expect(alert.getAttribute("role")).toBe("alert");
      expect(refresh).not.toHaveBeenCalled();
      expect(notifySukses).not.toHaveBeenCalled();
      expect(notifyGagal).toHaveBeenCalled();
    },
  );
});
