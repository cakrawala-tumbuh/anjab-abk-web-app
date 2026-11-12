import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (u: string) => {
    throw new Error(`REDIRECT:${u}`);
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
import { ProtokolForm } from "@/app/(auth)/riset/protokol/protokol-form";
import { KunciProtokol, KONFIRMASI_KUNCI } from "@/app/(auth)/riset/protokol/[id]/kunci-protokol";
import { VerifikasiTombol } from "@/app/(auth)/riset/protokol/[id]/verifikasi-tombol";
import DetailProtokolPage from "@/app/(auth)/riset/protokol/[id]/page";
import RisetPage from "@/app/(auth)/riset/page";
import RisetLayout from "@/app/(auth)/riset/layout";
import type { RisetProtokolRead } from "@/lib/api/schema";

const protokol = (o: Partial<RisetProtokolRead> = {}): RisetProtokolRead => ({
  id: "p-1",
  kode: "P-01",
  versi: 1,
  judul: "Protokol satu",
  status: "DRAF",
  isi_hash: null,
  dibuat_oleh: "u",
  dikunci_oleh: null,
  dikunci_pada: null,
  created_at: "2026-11-10T00:00:00Z",
  updated_at: "2026-11-10T00:00:00Z",
  isi: "ISI PROTOKOL",
  signoff_ada: false,
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

describe("ProtokolForm", () => {
  function isi() {
    fireEvent.change(screen.getByLabelText("Kode"), { target: { value: "P-01" } });
    fireEvent.change(screen.getByLabelText("Judul"), { target: { value: "Protokol satu" } });
    fireEvent.change(screen.getByLabelText("Isi protokol"), { target: { value: "isi" } });
  }

  it("201 → POST dengan Idempotency-Key lalu push ke detail", async () => {
    post.mockResolvedValue(ok(protokol({ id: "baru" }), 201));
    render(<ProtokolForm accessToken="tok" />);
    isi();
    fireEvent.click(screen.getByRole("button", { name: "Simpan protokol" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, opsi] = post.mock.calls[0];
    expect(path).toBe("/api/v1/riset/protokol");
    expect(opsi.body).toEqual({ kode: "P-01", judul: "Protokol satu", isi: "isi" });
    expect(opsi.headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/riset/protokol/baru"));
    expect(notifySukses).toHaveBeenCalled();
  });

  it("422 → kolom bermasalah tampil dan tidak ada push", async () => {
    post.mockResolvedValue(
      gagal(422, "validation_error", "Kode tidak valid dari server", [
        { loc: ["body", "kode"], msg: "Kode salah format" },
      ]),
    );
    render(<ProtokolForm accessToken="tok" />);
    isi();
    fireEvent.click(screen.getByRole("button", { name: "Simpan protokol" }));
    expect(await screen.findByText("Kode salah format")).toBeInTheDocument();
    expect(screen.getByText("Isian tidak sah pada kolom: kode.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(notifySukses).not.toHaveBeenCalled();
  });

  it("isian kosong tidak memanggil API", () => {
    render(<ProtokolForm accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Simpan protokol" }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText("Kode wajib diisi.")).toBeInTheDocument();
  });
});

describe("KunciProtokol", () => {
  it("confirm ditolak → API tidak dipanggil", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<KunciProtokol protokolId="p-1" accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Kunci protokol" }));
    expect(window.confirm).toHaveBeenCalledWith(KONFIRMASI_KUNCI);
    expect(post).not.toHaveBeenCalled();
  });

  it("confirm diterima → POST .../kunci lalu refresh", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    post.mockResolvedValue(ok(protokol({ status: "TERKUNCI" })));
    render(<KunciProtokol protokolId="p-1" accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Kunci protokol" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe("/api/v1/riset/protokol/{protokol_id}/kunci");
    expect(post.mock.calls[0][1].params.path.protokol_id).toBe("p-1");
  });
});

describe("VerifikasiTombol", () => {
  it("409 PEMVERIFIKASI_TIDAK_INDEPENDEN → pesan di role=alert, tanpa notifySukses", async () => {
    post.mockResolvedValue(
      gagal(409, "PEMVERIFIKASI_TIDAK_INDEPENDEN", "Pemverifikasi harus akun berbeda."),
    );
    render(<VerifikasiTombol statistikId="s-1" accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Verifikasi" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Pemverifikasi harus akun berbeda.");
    expect(notifySukses).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(notifyGagal).toHaveBeenCalled();
  });
});

describe("halaman detail", () => {
  it("DRAF: statistik dan kasus negatif tidak dirender, tombol kunci ada", async () => {
    get.mockResolvedValue(ok(protokol()));
    render(await DetailProtokolPage({ params: Promise.resolve({ id: "p-1" }) }));
    expect(screen.getByRole("button", { name: "Kunci protokol" })).toBeInTheDocument();
    // statistik, sign-off PI/etik, dan kasus negatif sama-sama menunggu protokol dikunci
    expect(screen.getAllByText(/Kunci protokol dulu/)).toHaveLength(3);
    expect(screen.queryByRole("form", { name: "Catat sign-off PI/etik" })).toBeNull();
    expect(screen.queryByRole("form", { name: "Tambah statistik" })).toBeNull();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("TERKUNCI: bagian statistik & kasus negatif tampil, tombol kunci hilang", async () => {
    get.mockImplementation(async (path: string) => {
      if (path.endsWith("/statistik")) {
        return ok({
          items: [
            {
              id: "s-1",
              protokol_id: "p-1",
              nama_analisis: "Regresi",
              keluaran: "x",
              kode_sumber_ref: "a.py@abc",
              status: "DRAF",
              dibuat_oleh: "u",
              diverifikasi_oleh: null,
              diverifikasi_pada: null,
              created_at: "2026-11-10T00:00:00Z",
            },
          ],
          total: 1,
        });
      }
      if (path.endsWith("/kasus-negatif")) return ok({ items: [], total: 0 });
      return ok(protokol({ status: "TERKUNCI", isi_hash: "deadbeef" }));
    });
    render(await DetailProtokolPage({ params: Promise.resolve({ id: "p-1" }) }));
    expect(screen.queryByRole("button", { name: "Kunci protokol" })).toBeNull();
    expect(screen.getByText("deadbeef")).toBeInTheDocument();
    expect(screen.getByText("Regresi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verifikasi" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Tambah statistik" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Tambah kasus negatif" })).toBeInTheDocument();
  });

  it("404 → notFound; 500 pada daftar statistik → melempar", async () => {
    get.mockResolvedValue(gagal(404, "not_found", "x"));
    await expect(DetailProtokolPage({ params: Promise.resolve({ id: "z" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    get.mockImplementation(async (path: string) =>
      path.endsWith("/statistik")
        ? gagal(500, "boom", "Gagal server")
        : ok(protokol({ status: "TERKUNCI" })),
    );
    await expect(DetailProtokolPage({ params: Promise.resolve({ id: "p-1" }) })).rejects.toThrow(
      "Gagal server",
    );
  });
});

describe("segmen riset", () => {
  it("/riset mengalihkan ke /riset/protokol", () => {
    expect(() => RisetPage()).toThrow("REDIRECT:/riset/protokol");
  });

  it("layout menolak sesi tanpa grup tim-kajian", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { groups: ["admin"] } } as never);
    const el = RisetLayout({ children: <p>ISI</p> }) as React.ReactElement<{ grup: string }>;
    expect(el.props.grup).toBe("tim-kajian");
    render(await (el.type as (p: unknown) => Promise<React.ReactElement>)(el.props));
    expect(screen.queryByText("ISI")).toBeNull();
    expect(screen.getByText(/Tidak berhak/)).toBeInTheDocument();
  });
});
