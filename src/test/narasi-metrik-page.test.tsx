import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));
vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn(async () => ({ accessToken: "tok" })) }));

const get = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ GET: get }) }));

import MetrikNarasiPage from "@/app/(auth)/narasi/metrik/page";
import { FilterMetrik } from "@/app/(auth)/narasi/metrik/filter-metrik";

const metrik = {
  jumlah_keputusan: 12,
  correction_rate: 0.3333,
  rejection_rate: null,
  source_coverage: 0,
  menit_aktif_total: 1234,
  menit_aktif_median_per_kasus: null,
  metrik_ditahan: [{ kode: "false_negative", alasan: "menunggu OD-13" }],
};

async function halaman(sp: Record<string, string> = {}) {
  return (await MetrikNarasiPage({ searchParams: Promise.resolve(sp) })) as ReactElement;
}

describe("halaman metrik narasi", () => {
  beforeEach(() => {
    get.mockReset();
    push.mockReset();
  });

  it("menampilkan kartu: persen berkoma, null = Belum ada data, 0 = 0,0%", async () => {
    get.mockResolvedValue({ data: metrik, error: undefined, response: { status: 200 } });
    render(await halaman({ dari: "2026-11-01", sampai: "2026-11-30" }));
    expect(screen.getByText("33,3%")).toBeInTheDocument();
    expect(screen.getByText("0,0%")).toBeInTheDocument();
    expect(screen.getByText("1.234 menit")).toBeInTheDocument();
    expect(screen.getAllByText("Belum ada data")).toHaveLength(2); // rejection_rate + median
    expect(get).toHaveBeenCalledWith("/api/v1/narasi/metrik", {
      params: { query: { dari: "2026-11-01", sampai: "2026-11-30" } },
    });
  });

  it("meneruskan narrative_kind ke backend", async () => {
    get.mockResolvedValue({ data: metrik, error: undefined, response: { status: 200 } });
    await halaman({ dari: "2026-11-01", sampai: "2026-11-30", narrative_kind: "F1_FORMAL" });
    expect(get.mock.calls[0][1].params.query.narrative_kind).toBe("F1_FORMAL");
  });

  it("merender kotak metrik_ditahan dan peringatan klaim penghematan", async () => {
    get.mockResolvedValue({ data: metrik, error: undefined, response: { status: 200 } });
    render(await halaman({ dari: "2026-11-01", sampai: "2026-11-30" }));
    const kotak = screen.getByRole("note", { name: "Metrik yang ditahan" });
    expect(kotak).toHaveTextContent("false_negative");
    expect(kotak).toHaveTextContent("menunggu OD-13");
    expect(kotak).toHaveTextContent(/tidak boleh dipakai sebagai klaim penghematan waktu/);
  });

  it("respons 500 melempar (bukan metrik kosong)", async () => {
    get.mockResolvedValue({
      data: undefined,
      error: { error: "internal", message: "Galat server" },
      response: { status: 500, headers: { get: () => "req-1" } },
    });
    await expect(halaman({ dari: "2026-11-01", sampai: "2026-11-30" })).rejects.toThrow();
  });

  it("rentang tak sah dari URL tidak memanggil backend", async () => {
    render(await halaman({ dari: "2024-01-01", sampai: "2026-11-30" }));
    expect(get).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent(/366 hari/);
  });
});

describe("FilterMetrik", () => {
  beforeEach(() => push.mockReset());
  const filter = { dari: "2026-11-01", sampai: "2026-11-30", narrative_kind: null } as const;

  it("rentang > 366 hari ditolak di klien sebelum navigasi", async () => {
    render(<FilterMetrik filter={{ ...filter, dari: "2024-01-01" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Terapkan" }));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/366 hari/);
  });

  it("rentang sah menavigasi dengan dari, sampai, dan jenis narasi", async () => {
    render(<FilterMetrik filter={filter} />);
    fireEvent.change(screen.getByLabelText("Jenis narasi"), { target: { value: "F2_ACTUAL" } });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan" }));
    expect(push).toHaveBeenCalledWith(
      "/narasi/metrik?dari=2026-11-01&sampai=2026-11-30&narrative_kind=F2_ACTUAL",
    );
  });
});
