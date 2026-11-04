import { render, screen, within } from "@testing-library/react";
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
  isAdmin: () => true,
}));
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get }),
}));
vi.mock("@/app/(auth)/opm/[sesi_id]/transisi-sesi", () => ({ TransisiSesi: () => null }));
vi.mock("@/app/(auth)/opm/[sesi_id]/tambah-responden", () => ({ TambahResponden: () => null }));
vi.mock("@/app/(auth)/opm/[sesi_id]/assign-responden-banyak", () => ({
  AssignRespondenBanyak: () => null,
}));
vi.mock("@/app/(auth)/opm/[sesi_id]/hapus-responden", () => ({ HapusResponden: () => null }));

import { auth } from "@/lib/auth/auth";
import OpmHasilPage from "@/app/(auth)/opm/[sesi_id]/hasil/page";
import OpmSesiDetailPage from "@/app/(auth)/opm/[sesi_id]/page";
import OpmSesiPage from "@/app/(auth)/opm/page";
import { labelAlasanPengecualian, formatAngkaOpm } from "@/lib/opm-pengecualian";

function ok(data: unknown) {
  return { data, error: undefined, response: { status: 200, headers: { get: () => "r" } } };
}
function gagal(status: number) {
  return {
    data: undefined,
    error: { error: "X", message: "gagal" },
    response: { status, headers: { get: () => "req-err" } },
  };
}
const page = (items: unknown[]) => ({ items, total: items.length, limit: 100, offset: 0 });

const sesiBase = {
  id: "s1",
  jabatan_id: "j1",
  jabatan_nama: "Guru",
  periode: "2026-01",
  catatan: null,
  cabang: "Bandung",
  status: "ANALYZED",
  min_responden: 1,
  max_responden: 5,
  jumlah_task: 1,
  created_at: "2026-01-01T00:00:00Z",
  status_verifikasi: "VERIFIED",
  jumlah_pengecualian: 0,
};

const taskOrphan = {
  task_kode: "T-012",
  uraian_tugas: "Uraian",
  tugas_pokok: "Pokok",
  detil_tugas: "",
  n: 0,
  mean_importance: null,
  mean_frequency: null,
  mean_criticality: null,
  sd_importance: null,
  sd_frequency: null,
  sd_criticality: null,
  selection_essential: null,
  workload_essential: null,
  prop_selection_essential: 0,
  prop_workload_essential: 0,
  orphan: true,
};

async function render_(el: Promise<ReactElement>) {
  render(await el);
}

beforeEach(() => {
  get.mockReset();
  vi.mocked(auth).mockResolvedValue({ user: { id: "a" }, accessToken: "tok" } as never);
});

describe("pembantu", () => {
  it("memetakan ketiga kode alasan; kode tak dikenal apa adanya", () => {
    expect(labelAlasanPengecualian("TI_DETAIL_UNMATCHED")).toBe(
      "Tugas TI tidak ditemukan di katalog",
    );
    expect(labelAlasanPengecualian("OPM_STD_MISSING")).toBe("Nilai standar kosong");
    expect(labelAlasanPengecualian("OPM_RATING_MISSING")).toBe("Belum ada rating");
    expect(labelAlasanPengecualian("KODE_BARU")).toBe("KODE_BARU");
  });
  it("formatAngkaOpm: null -> em dash, 0 tetap angka", () => {
    expect(formatAngkaOpm(null)).toBe("—");
    expect(formatAngkaOpm(0)).toBe("0.00");
  });
});

describe("halaman hasil OPM", () => {
  it("task tanpa rating: '—' di mean & flag (bukan Tidak), lencana Orphan, tidak crash", async () => {
    get.mockImplementation(async (path: string) => {
      if (path.endsWith("/hasil"))
        return ok({
          jabatan_id: "j1",
          jabatan_nama: "Guru",
          cabang: "Bandung",
          periode: "2026-01",
          n_responden_submit: 2,
          tasks: [taskOrphan],
        });
      return ok(sesiBase);
    });
    await render_(OpmHasilPage({ params: Promise.resolve({ sesi_id: "s1" }) }));
    expect(screen.getByText("Orphan")).toBeTruthy();
    expect(screen.getByText("Selection Essential: —")).toBeTruthy();
    expect(screen.getByText("Workload Essential: —")).toBeTruthy();
    expect(screen.queryByText(/: Tidak/)).toBeNull();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });
});

describe("halaman hasil OPM — sebaran dan penanda telaah", () => {
  const taskSebaran = {
    ...taskOrphan,
    orphan: false,
    n: 4,
    mean_importance: 3,
    mean_frequency: 3,
    mean_criticality: 3,
    min_importance: 2,
    median_importance: 3.5,
    max_importance: 5,
    min_frequency: 3,
    median_frequency: 3,
    max_frequency: 3,
    min_criticality: 1,
    median_criticality: 2,
    max_criticality: 4,
  };
  async function renderTasks(tasks: unknown[]) {
    get.mockImplementation(async (path: string) => {
      if (path.endsWith("/hasil"))
        return ok({
          jabatan_id: "j1",
          jabatan_nama: "Guru",
          cabang: "Bandung",
          periode: "2026-01",
          n_responden_submit: 4,
          tasks,
        });
      return ok(sesiBase);
    });
    await render_(OpmHasilPage({ params: Promise.resolve({ sesi_id: "s1" }) }));
  }
  const penanda = () => screen.queryAllByText("Perlu telaah").filter((e) => e.closest("td"));

  it("rating_spread true: penanda tampil di sel task; min/median/maks ketiga dimensi tampil, median .5 tidak dibulatkan", async () => {
    await renderTasks([{ ...taskSebaran, rating_spread: true }]);
    expect(penanda().length).toBe(1);
    expect(screen.getByText("2.00 / 3.50 / 5.00")).toBeTruthy();
    expect(screen.getByText("3.00 / 3.00 / 3.00")).toBeTruthy();
    expect(screen.getByText("1.00 / 2.00 / 4.00")).toBeTruthy();
  });
  it("rating_spread false atau null: tanpa penanda", async () => {
    await renderTasks([
      { ...taskSebaran, task_kode: "T-1", rating_spread: false },
      { ...taskSebaran, task_kode: "T-2", rating_spread: null },
    ]);
    expect(penanda().length).toBe(0);
  });
  it("n=0: seluruh sebaran null tampil '—' dan tanpa penanda", async () => {
    await renderTasks([
      {
        ...taskOrphan,
        orphan: false,
        min_importance: null,
        median_importance: null,
        max_importance: null,
        min_frequency: null,
        median_frequency: null,
        max_frequency: null,
        min_criticality: null,
        median_criticality: null,
        max_criticality: null,
        rating_spread: null,
      },
    ]);
    // 3 sel sebaran (I/F/C) + 1 sel SD yang juga null, semuanya "—" (bukan 0).
    expect(screen.getAllByText("— / — / —").length).toBe(4);
    expect(screen.queryByText(/0\.00/)).toBeNull();
    expect(penanda().length).toBe(0);
  });
});

describe("detail sesi OPM", () => {
  function mockDetail(sesi: unknown, pengecualian: unknown) {
    get.mockImplementation(async (path: string) => {
      if (path.endsWith("/pengecualian")) return pengecualian;
      if (path === "/api/v1/opm/sesi/{sesi_id}") return ok(sesi);
      return ok(page([]));
    });
  }
  const props = {
    params: Promise.resolve({ sesi_id: "s1" }),
    searchParams: Promise.resolve({}),
  };

  it("UNVERIFIED dengan 2 pengecualian: lencana + 2 baris berlabel Indonesia", async () => {
    mockDetail(
      { ...sesiBase, status_verifikasi: "UNVERIFIED", jumlah_pengecualian: 2 },
      ok(
        page([
          {
            id: "p1",
            sesi_id: "s1",
            task_kode: "T-1",
            alasan: "TI_DETAIL_UNMATCHED",
            status: "OPEN",
            created_at: "2026-01-01T00:00:00Z",
          },
          {
            id: "p2",
            sesi_id: "s1",
            task_kode: "T-2",
            alasan: "OPM_STD_MISSING",
            keterangan: "x",
            status: "OPEN",
            created_at: "2026-01-01T00:00:00Z",
          },
        ]),
      ),
    );
    await render_(OpmSesiDetailPage(props));
    expect(screen.getByText("Belum terverifikasi (2 pengecualian)")).toBeTruthy();
    expect(screen.getByText("Tugas TI tidak ditemukan di katalog")).toBeTruthy();
    expect(screen.getByText("Nilai standar kosong")).toBeTruthy();
  });

  it("VERIFIED + register kosong: state kosong, tanpa lencana", async () => {
    mockDetail(sesiBase, ok(page([])));
    await render_(OpmSesiDetailPage(props));
    expect(screen.getByText("Tidak ada pengecualian.")).toBeTruthy();
    expect(screen.queryByText(/Belum terverifikasi/)).toBeNull();
  });

  it("register gagal (500): melempar, bukan tabel kosong", async () => {
    mockDetail(sesiBase, gagal(500));
    await expect(OpmSesiDetailPage(props)).rejects.toBeTruthy();
  });
});

describe("daftar sesi OPM", () => {
  it("lencana hanya untuk UNVERIFIED", async () => {
    get.mockResolvedValue(
      ok(
        page([
          {
            ...sesiBase,
            id: "a",
            catatan: "Sesi A",
            status_verifikasi: "UNVERIFIED",
            jumlah_pengecualian: 3,
          },
          { ...sesiBase, id: "b", catatan: "Sesi B" },
        ]),
      ),
    );
    await render_(OpmSesiPage({ searchParams: Promise.resolve({}) }));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Belum terverifikasi (3 pengecualian)")).toBeTruthy();
    expect(within(rows[2]).queryByText(/Belum terverifikasi/)).toBeNull();
  });
});
