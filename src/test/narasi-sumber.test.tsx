import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

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
import { SumberForm } from "@/app/(auth)/narasi/sumber/sumber-form";
import { SumberTabel, KOLOM_SUMBER } from "@/app/(auth)/narasi/sumber/sumber-tabel";
import SumberNarasiPage from "@/app/(auth)/narasi/sumber/page";
import DetailSumberPage from "@/app/(auth)/narasi/sumber/[id]/page";
import TambahSumberPage from "@/app/(auth)/narasi/sumber/tambah/page";
import NarasiLayout from "@/app/(auth)/narasi/layout";
import { bacaFilterSumber } from "@/lib/narasi-sumber";
import type { NarasiSumberRead, NarasiSumberRingkas } from "@/lib/api/schema";

const ringkas = (o: Partial<NarasiSumberRingkas> = {}): NarasiSumberRingkas => ({
  id: "s-1",
  judul: "Pedoman akademik",
  jenis: "SINTETIS",
  versi: "v1.0",
  periode: "2026/27",
  teks_hash: "abc123",
  izin_ai: false,
  izin_catatan: null,
  menggantikan_id: null,
  dibuat_oleh: "u",
  created_at: "2026-11-05T00:00:00Z",
  ...o,
});
const lengkap = (o: Partial<NarasiSumberRead> = {}): NarasiSumberRead => ({
  ...ringkas(),
  teks: "ISI TEKS SUMBER",
  ...o,
});

const ok = (data: unknown, status = 200) => ({
  data,
  response: { status, headers: { get: () => "r1" } },
});
const gagal = (status: number, error: string, message: string, details?: unknown[]) => ({
  data: undefined,
  error: { error, message, details },
  response: { status, headers: { get: () => "r2" } },
});

beforeEach(() => {
  [push, refresh, get, post, notifyGagal, notifySukses].forEach((m) => m.mockReset());
  vi.mocked(auth).mockReset();
  vi.mocked(auth).mockResolvedValue({
    accessToken: "tok",
    user: { groups: ["tim-kajian"] },
  } as never);
});

function isiDasar() {
  fireEvent.change(screen.getByLabelText("Judul"), { target: { value: "Pedoman" } });
  fireEvent.change(screen.getByLabelText("Versi"), { target: { value: "v1" } });
  fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "2026/27" } });
  fireEvent.change(screen.getByLabelText("Teks sumber"), { target: { value: "isi teks" } });
}

describe("SumberForm", () => {
  it("formulir valid mengirim body kontrak dan Idempotency-Key", async () => {
    post.mockResolvedValue(ok(lengkap({ id: "baru" }), 201));
    render(<SumberForm accessToken="tok" />);
    isiDasar();
    fireEvent.click(screen.getByRole("button", { name: "Simpan sumber" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, opsi] = post.mock.calls[0];
    expect(path).toBe("/api/v1/narasi/sumber");
    expect(opsi.body).toEqual({
      judul: "Pedoman",
      jenis: "SINTETIS",
      versi: "v1",
      periode: "2026/27",
      teks: "isi teks",
      izin_ai: false,
      izin_catatan: null,
      menggantikan_id: null,
    });
    expect(opsi.headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/narasi/sumber/baru"));
    expect(notifySukses).toHaveBeenCalled();
  });

  it("izin_ai bawaan tidak tercentang; PeringatanPrivasi ada di atas teks", () => {
    render(<SumberForm accessToken="tok" />);
    expect(screen.getByLabelText("Izin pemakaian AI")).not.toBeChecked();
    expect(screen.getByRole("note").textContent).toMatch(/Jangan menulis nama orang/);
    expect(screen.getByText(/tidak menyalakan AI/)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 200\.000 karakter/)).toBeInTheDocument();
  });

  it("izin_ai tercentang tanpa catatan tidak terkirim", async () => {
    render(<SumberForm accessToken="tok" />);
    isiDasar();
    fireEvent.click(screen.getByLabelText("Izin pemakaian AI"));
    fireEvent.click(screen.getByRole("button", { name: "Simpan sumber" }));
    expect(await screen.findByText(/Catatan izin wajib diisi/)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("izin_ai dengan catatan mengirim izin_catatan", async () => {
    post.mockResolvedValue(ok(lengkap({ id: "x" }), 201));
    render(<SumberForm accessToken="tok" />);
    isiDasar();
    fireEvent.click(screen.getByLabelText("Izin pemakaian AI"));
    fireEvent.change(screen.getByLabelText(/Dasar izin/), { target: { value: "Surat izin 1" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan sumber" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toMatchObject({
      izin_ai: true,
      izin_catatan: "Surat izin 1",
    });
  });

  it("422 backend tampil di field dan tidak ada toast sukses", async () => {
    post.mockResolvedValue(
      gagal(422, "validation_error", "Payload tidak valid.", [
        { loc: ["body", "versi"], msg: "Versi terlalu panjang", type: "x", code: "x" },
      ]),
    );
    render(<SumberForm accessToken="tok" />);
    isiDasar();
    fireEvent.click(screen.getByRole("button", { name: "Simpan sumber" }));
    expect(await screen.findByText("Versi terlalu panjang")).toBeInTheDocument();
    expect(notifySukses).not.toHaveBeenCalled();
    expect(notifyGagal).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("kirim ulang setelah gagal memakai Idempotency-Key yang sama", async () => {
    post.mockResolvedValueOnce(gagal(500, "internal_error", "Gagal"));
    post.mockResolvedValueOnce(ok(lengkap({ id: "x" }), 201));
    render(<SumberForm accessToken="tok" />);
    isiDasar();
    fireEvent.click(screen.getByRole("button", { name: "Simpan sumber" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Simpan sumber" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[1][1].headers["Idempotency-Key"]).toBe(
      post.mock.calls[0][1].headers["Idempotency-Key"],
    );
  });

  it("revisi: menggantikan_id terisi dan nilai awal dari sumber lama", async () => {
    post.mockResolvedValue(ok(lengkap({ id: "rev" }), 201));
    render(<SumberForm awal={lengkap({ id: "lama-1" })} accessToken="tok" />);
    expect(screen.getByLabelText("Judul")).toHaveValue("Pedoman akademik");
    expect(screen.getByLabelText("Teks sumber")).toHaveValue("ISI TEKS SUMBER");
    fireEvent.click(screen.getByRole("button", { name: "Simpan revisi" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toMatchObject({
      menggantikan_id: "lama-1",
      teks: "ISI TEKS SUMBER",
    });
  });

  it("tidak ada tombol ubah atau hapus", () => {
    render(<SumberForm awal={lengkap()} accessToken="tok" />);
    expect(screen.queryByRole("button", { name: /hapus|ubah/i })).toBeNull();
  });
});

describe("halaman tambah (revisi lewat URL)", () => {
  it("?menggantikan memuat sumber lama sebagai nilai awal", async () => {
    get.mockResolvedValue(ok(lengkap({ id: "lama-1" })));
    const el = await TambahSumberPage({
      searchParams: Promise.resolve({ menggantikan: "lama-1" }),
    });
    render(el);
    expect(get).toHaveBeenCalledWith(
      "/api/v1/narasi/sumber/{sumber_id}",
      expect.objectContaining({ params: { path: { sumber_id: "lama-1" } } }),
    );
    expect(screen.getByLabelText("Judul")).toHaveValue("Pedoman akademik");
  });

  it("tanpa ?menggantikan tidak memanggil backend", async () => {
    const el = await TambahSumberPage({ searchParams: Promise.resolve({}) });
    render(el);
    expect(get).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Judul")).toHaveValue("");
  });
});

describe("SumberTabel", () => {
  it("tanpa kolom teks dan tanpa isi teks", () => {
    render(<SumberTabel items={[ringkas()]} />);
    expect(KOLOM_SUMBER.map((k) => k.toLowerCase())).not.toContain("teks");
    expect(screen.queryByRole("columnheader", { name: /teks/i })).toBeNull();
    expect(screen.getByRole("link", { name: "Pedoman akademik" })).toHaveAttribute(
      "href",
      "/narasi/sumber/s-1",
    );
  });
});

describe("halaman daftar", () => {
  const sp = (o: Record<string, string> = {}) => Promise.resolve(o);

  it("kosong tanpa filter ≠ kosong karena filter", async () => {
    get.mockResolvedValue(ok({ items: [], total: 0, limit: 20, offset: 0 }));
    const { unmount } = render(await SumberNarasiPage({ searchParams: sp() }));
    expect(screen.getByText("Belum ada sumber narasi.")).toBeInTheDocument();
    unmount();
    render(await SumberNarasiPage({ searchParams: sp({ jenis: "SINTETIS" }) }));
    expect(screen.getByText(/Tidak ada sumber yang cocok dengan filter/)).toBeInTheDocument();
    expect(screen.queryByText("Belum ada sumber narasi.")).toBeNull();
  });

  it("filter jenis dan periode diteruskan ke backend", async () => {
    get.mockResolvedValue(ok({ items: [ringkas()], total: 1, limit: 20, offset: 0 }));
    render(
      await SumberNarasiPage({ searchParams: sp({ jenis: "DOKUMEN_RESMI", periode: "2026/27" }) }),
    );
    expect(get.mock.calls[0][1].params.query).toMatchObject({
      jenis: "DOKUMEN_RESMI",
      periode: "2026/27",
    });
  });

  it("respons gagal melempar, bukan tabel kosong", async () => {
    get.mockResolvedValue(gagal(500, "internal_error", "Server bermasalah"));
    await expect(SumberNarasiPage({ searchParams: sp() })).rejects.toThrow("Server bermasalah");
  });
});

describe("halaman detail", () => {
  it("menampilkan teks dan teks_hash, ada Revisi, tanpa ubah/hapus", async () => {
    get.mockResolvedValue(ok(lengkap()));
    render(await DetailSumberPage({ params: Promise.resolve({ id: "s-1" }) }));
    expect(screen.getByText("ISI TEKS SUMBER")).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Revisi" })).toHaveAttribute(
      "href",
      "/narasi/sumber/tambah?menggantikan=s-1",
    );
    expect(screen.queryByRole("button", { name: /hapus|ubah/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /hapus|ubah/i })).toBeNull();
  });

  it("404 → notFound; 500 → melempar", async () => {
    get.mockResolvedValueOnce(gagal(404, "not_found", "Tidak ada"));
    await expect(DetailSumberPage({ params: Promise.resolve({ id: "x" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    get.mockResolvedValueOnce(gagal(500, "internal_error", "Server bermasalah"));
    await expect(DetailSumberPage({ params: Promise.resolve({ id: "x" }) })).rejects.toThrow(
      "Server bermasalah",
    );
  });
});

async function renderLayout() {
  const el = NarasiLayout({ children: <p>ISI</p> }) as React.ReactElement<{ grup: string }>;
  expect(el.props.grup).toBe("tim-kajian");
  const dalam = await (el.type as (p: unknown) => Promise<React.ReactElement>)(el.props);
  return render(dalam);
}

describe("NarasiLayout (guard tim-kajian)", () => {
  it("sesi tanpa tim-kajian melihat penolakan; anak tidak dirender", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { groups: ["admin"] } } as never);
    await renderLayout();
    expect(screen.getByRole("alert")).toHaveTextContent("Tidak berhak mengakses halaman ini.");
    expect(screen.queryByText("ISI")).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it("tim-kajian melihat anak", async () => {
    await renderLayout();
    expect(screen.getByText("ISI")).toBeInTheDocument();
  });
});

describe("bacaFilterSumber", () => {
  it("jenis di luar kosakata diabaikan; periode dipangkas", () => {
    expect(bacaFilterSumber({ jenis: "LAIN", periode: "  2026/27 " })).toEqual({
      jenis: null,
      periode: "2026/27",
    });
  });
});
