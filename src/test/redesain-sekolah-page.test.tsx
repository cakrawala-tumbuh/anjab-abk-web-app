import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth", () => ({
  auth: () => authMock(),
  GRUP_SEKOLAH_PENGISI: "sekolah-pengisi",
}));
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ GET: get, POST: vi.fn() }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

import { ApiError } from "@/lib/api/errors";
import RedesainSekolahPage from "@/app/(auth)/redesain-sekolah/page";
import RedesainSekolahLayout from "@/app/(auth)/redesain-sekolah/layout";

const ok = (data: unknown) => ({ data, response: { status: 200, headers: { get: () => "r" } } });
const masalah = (id: string, kode: string) => ({
  id,
  kode,
  konteks_kode: "K-01",
  konteks_tema: "Administrasi",
  periode_acuan: "2026",
  sumber_awal_keterbatasan: "Wawancara",
  status_awal: "Terkonfirmasi",
});
const konf = (masalah_id: string, status: string) => ({
  id: `kf-${masalah_id}`,
  masalah_id,
  status,
});

beforeEach(() => {
  get.mockReset();
  authMock.mockResolvedValue({ accessToken: "tok", user: { groups: ["sekolah-pengisi"] } });
});

describe("daftar masalah sekolah", () => {
  it("menggabungkan konfirmasi/saya → Mulai isi / Lanjutkan / Lihat; tanpa rumusan dugaan", async () => {
    get.mockImplementation(async (path: string) => {
      if (path === "/api/v1/redesain/sekolah/masalah")
        return ok({
          total: 3,
          limit: 500,
          offset: 0,
          items: [masalah("a", "M-001"), masalah("b", "M-002"), masalah("c", "M-003")],
        });
      return ok({
        total: 2,
        limit: 500,
        offset: 0,
        items: [konf("b", "draf"), konf("c", "terkirim")],
      });
    });
    const { container } = render(await RedesainSekolahPage());
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(4);
    expect(within(rows[1]).getByRole("button", { name: "Mulai isi" })).toBeInTheDocument();
    expect(within(rows[2]).getByRole("link", { name: "Lanjutkan" })).toHaveAttribute(
      "href",
      "/redesain-sekolah/konfirmasi/kf-b",
    );
    expect(within(rows[3]).getByRole("link", { name: "Lihat" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/rumusan/i);
  });

  it("GET sekolah/masalah 403 → melempar/menampilkan ApiError, bukan daftar kosong", async () => {
    get.mockImplementation(async (path: string) =>
      path === "/api/v1/redesain/sekolah/masalah"
        ? {
            data: undefined,
            error: { error: "forbidden", message: "Tidak berhak" },
            response: { status: 403, headers: { get: () => "req-1" } },
          }
        : ok({ total: 0, limit: 500, offset: 0, items: [] }),
    );
    render(await RedesainSekolahPage());
    expect(screen.getByRole("alert")).toHaveTextContent("Tidak berhak");
    expect(screen.queryByText("Belum ada masalah yang dibuka untuk sekolah Anda.")).toBeNull();
    expect(ApiError).toBeDefined();
  });

  it("tanpa masalah → pesan kosong yang sah", async () => {
    get.mockResolvedValue(ok({ total: 0, limit: 500, offset: 0, items: [] }));
    render(await RedesainSekolahPage());
    expect(
      screen.getByText("Belum ada masalah yang dibuka untuk sekolah Anda."),
    ).toBeInTheDocument();
  });
});

/** Layout mengembalikan <WajibGrup> (async Server Component): render hasil pemanggilannya. */
async function renderLayout() {
  const el = RedesainSekolahLayout({ children: <p>ISI</p> }) as unknown as {
    type: (p: unknown) => Promise<React.ReactNode>;
    props: unknown;
  };
  render(await el.type(el.props));
}

describe("layout sekolah", () => {
  it("tanpa grup sekolah-pengisi → 'Tidak berhak', anak tidak dirender", async () => {
    authMock.mockResolvedValue({ user: { groups: ["admin"] } });
    await renderLayout();
    expect(screen.getByText(/Tidak berhak/)).toBeInTheDocument();
    expect(screen.queryByText("ISI")).toBeNull();
  });
  it("dengan grup → banner PROTOTIPE + anak", async () => {
    await renderLayout();
    expect(screen.getByText(/PROTOTIPE/)).toBeInTheDocument();
    expect(screen.getByText("ISI")).toBeInTheDocument();
  });
});
