import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
  isAdmin: (session: { user?: { groups?: string[] } } | null) =>
    session?.user?.groups?.includes("admin") ?? false,
}));

const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: vi.fn(), PATCH: vi.fn(), DELETE: vi.fn() }),
}));

import { auth } from "@/lib/auth/auth";
import DcsInstrumenPage from "@/app/(auth)/dcs/page";

function ok(data: unknown) {
  return { data, error: undefined, response: { status: 200, headers: { get: () => "req-ok" } } };
}

const responden = [
  {
    id: "drsp_0003aaaa",
    kode_orang: "O-0003",
    jabatan_label: "Guru Kelas",
    partisipan_id: "par_1",
    sudah_submit: false,
    submitted_at: null,
    created_at: "2026-11-03T00:00:00Z",
  },
];

beforeEach(() => {
  get.mockReset();
  vi.mocked(auth).mockResolvedValue({
    accessToken: "tok",
    user: { groups: ["admin"] },
  } as unknown as Awaited<ReturnType<typeof auth>>);
  get.mockImplementation(async (path: string) => {
    if (path === "/api/v1/dcs/instrumen") {
      return ok({ id: "dcs_1", status: "OPEN", min_responden: 1, catatan: null });
    }
    if (path === "/api/v1/dcs/responden") {
      return ok({ items: responden, total: 1 });
    }
    // jabatan & partisipan (master data) tetap membawa nama
    if (path === "/api/v1/partisipan") {
      return ok({ items: [{ id: "par_2", nama: "Nama Partisipan Master" }], total: 1 });
    }
    return ok({ items: [], total: 0 });
  });
});

describe("Halaman DCS — responden ditampilkan dengan kode orang", () => {
  it("menampilkan kode orang, header 'Kode Orang', dan tidak memuat nama responden", async () => {
    const ui = (await DcsInstrumenPage({
      searchParams: Promise.resolve({}),
    })) as ReactElement;
    render(ui);
    expect(screen.getByText("O-0003")).toBeInTheDocument();
    expect(screen.getByText("Kode Orang")).toBeInTheDocument();
    expect(screen.queryByText("Anonim")).toBeNull();
  });
});
