import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth", () => ({ auth: () => authMock() }));
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, PATCH: vi.fn(), POST: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

import CakupanJabatanPage from "@/app/(auth)/redesain/cakupan-jabatan/page";
import { susunBarisCakupan } from "@/lib/redesain-cakupan";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: "x", message: "ditolak" },
  response: { status, headers: { get: () => "req-1" } },
});
const page = (items: unknown[]) => resp({ items, total: items.length, limit: 500, offset: 0 });
const rec = (role: string, cabang: string, jabatan_id: string | null) => ({
  id: `${role}-${cabang}`,
  role_kode: role,
  nama_jabatan: `Jabatan ${role}`,
  cabang,
  jabatan_id,
  status_unit: "Belum diperiksa",
  pemegang_diperiksa: "Belum diperiksa",
  inventori_ditinjau: "Belum diperiksa",
  peta_diperkuat: "Belum diperiksa",
  gap_variasi: null,
  pic_kode_orang: null,
  created_at: "",
  updated_at: "",
});

beforeEach(() => {
  get.mockReset();
  authMock.mockResolvedValue({ accessToken: "tok" });
});

describe("susunBarisCakupan", () => {
  it("menyusun 4 record (2 role × 2 cabang) menjadi 2 baris × 2 sel", () => {
    const baris = susunBarisCakupan([
      rec("J-01", "Bandung", "j1"),
      rec("J-01", "Semarang", null),
      rec("J-02", "Bandung", null),
      rec("J-02", "Semarang", "j2"),
    ] as never);
    expect(baris).toHaveLength(2);
    expect(baris[0].sel.Bandung?.id).toBe("J-01-Bandung");
    expect(baris[0].sel.Semarang?.id).toBe("J-01-Semarang");
    expect(baris[1].role_kode).toBe("J-02");
  });
});

describe("halaman cakupan jabatan", () => {
  function atur(items: unknown[]) {
    get.mockImplementation(async (path: string) =>
      path === "/api/v1/redesain/cakupan-jabatan"
        ? page(items)
        : page([{ id: "j1", nama: "Kepala Sekolah" }]),
    );
  }

  it("2 role × 2 cabang → 2 baris data dengan sel Bandung & Semarang", async () => {
    atur([
      rec("J-01", "Bandung", "j1"),
      rec("J-01", "Semarang", "j1"),
      rec("J-02", "Bandung", "j1"),
      rec("J-02", "Semarang", "j1"),
    ]);
    render(await CakupanJabatanPage());
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(screen.getByRole("columnheader", { name: "Bandung" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Semarang" })).toBeInTheDocument();
    expect(within(rows[1]).getAllByText(/Belum diperiksa/).length).toBeGreaterThanOrEqual(2);
  });

  it("jabatan_id null → penanda belum dipetakan", async () => {
    atur([rec("J-01", "Bandung", "j1"), rec("J-01", "Semarang", null)]);
    render(await CakupanJabatanPage());
    expect(screen.getAllByText("Belum dipetakan ke master jabatan")).toHaveLength(1);
  });

  it("403 melempar ApiError", async () => {
    get.mockResolvedValue(resp(null, 403));
    await expect(CakupanJabatanPage()).rejects.toMatchObject({ name: "ApiError", status: 403 });
  });
});
