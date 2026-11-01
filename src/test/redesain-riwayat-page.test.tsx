import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn().mockResolvedValue({ accessToken: "tok", user: { groups: ["tim-kajian"] } }),
}));
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ GET: get }) }));

import { ApiError } from "@/lib/api/errors";
import RiwayatPage from "@/app/(auth)/redesain/riwayat/page";

const ok = (data: unknown) => ({ data, response: { status: 200, headers: { get: () => "r" } } });

beforeEach(() => get.mockReset());

describe("RiwayatPage", () => {
  it("200 dengan 2 baris → kode orang & '—' untuk pelaku NULL, JSON dapat dibuka", async () => {
    get.mockResolvedValue(
      ok({
        total: 2,
        limit: 20,
        offset: 0,
        items: [
          {
            id: "1",
            entitas: "masalah",
            entitas_id: "m1",
            aksi: "create",
            waktu: "2026-11-01T01:00:00Z",
            pelaku_kode_orang: "O-0001",
            nilai_sebelum: null,
            nilai_sesudah: { a: 1 },
          },
          {
            id: "2",
            entitas: "masalah",
            entitas_id: "m2",
            aksi: "update",
            waktu: "2026-11-01T02:00:00Z",
            pelaku_kode_orang: null,
            nilai_sebelum: { a: 1 },
            nilai_sesudah: { a: 2 },
          },
        ],
      }),
    );
    render(await RiwayatPage({ searchParams: Promise.resolve({ entitas: "masalah" }) }));
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3); // header + 2
    expect(within(rows[1]).getByText("O-0001")).toBeInTheDocument();
    expect(within(rows[2]).getAllByText("—").length).toBeGreaterThanOrEqual(1);
    expect(get.mock.calls[0][1].params.query).toMatchObject({
      entitas: "masalah",
      limit: 20,
      offset: 0,
    });
  });

  it("403 → melempar ApiError, bukan tabel kosong", async () => {
    get.mockResolvedValue({
      data: undefined,
      error: { error: "forbidden", message: "Tidak berhak" },
      response: { status: 403, headers: { get: () => "req-1" } },
    });
    await expect(RiwayatPage({ searchParams: Promise.resolve({}) })).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("0 riwayat → pesan kosong", async () => {
    get.mockResolvedValue(ok({ total: 0, limit: 20, offset: 0, items: [] }));
    render(await RiwayatPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Belum ada riwayat perubahan.")).toBeInTheDocument();
  });
});
