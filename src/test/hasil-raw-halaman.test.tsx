import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT ${to}`);
  }),
}));
vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
  isAdmin: () => true,
}));
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ GET: get }) }));

import { auth } from "@/lib/auth/auth";
import DcsHasilPage from "@/app/(auth)/dcs/hasil/page";
import WcpHasilPage from "@/app/(auth)/wcp/hasil/page";
import DcsHasilRespondenPage from "@/app/(auth)/dcs/hasil-responden/[responden_id]/page";
import WcpHasilRespondenPage from "@/app/(auth)/wcp/hasil-responden/[responden_id]/page";

const BANNER =
  "Skor belum disahkan (RAW_ONLY). Interpretasi, label risiko, dan indeks gabungan dinonaktifkan.";

function ok(data: unknown) {
  return { data, error: undefined, response: { status: 200, headers: { get: () => "r" } } };
}

const instrumen = { status: "ANALYZED", catatan: null, min_responden: 3 };
const itemRaw = {
  item_id: "D1a",
  kelompok_kode: "DEMAND",
  urutan: 1,
  n: 7,
  n_kosong: 0,
  frekuensi: { "1": 0, "2": 1, "3": 2, "4": 3, "5": 1 },
  mean_raw: 3.57,
  sd_raw: 0.98,
};
const dcsRaw = { mode: "RAW_ONLY", n_responden: 7, items: [itemRaw] };
const dcsScored = {
  mode: "SCORED",
  n_responden: 7,
  sub_skala: [
    {
      subskala_kode: "DEMAND",
      subskala_nama: "Demand",
      n_responden: 7,
      skor_mean: 3,
      skor_std: 1,
      cronbach_alpha: 0.8,
    },
  ],
  risk_flag: "HIGH",
  k_index: 0.42,
  k_index_wcp_risk: 0.3,
};
const wcpRaw = { mode: "RAW_ONLY", n_responden: 7, items: [{ ...itemRaw, kelompok_kode: "X" }] };

/** Rute → respons; rute tak dikenal membuat test gagal keras. */
function rute(peta: Record<string, unknown>) {
  get.mockImplementation(async (path: string) => {
    if (!(path in peta)) throw new Error(`panggilan tak terduga: ${path}`);
    return ok(peta[path]);
  });
}

beforeEach(() => {
  get.mockReset();
  vi.mocked(auth).mockResolvedValue({ user: { groups: ["admin"] }, accessToken: "t" } as never);
});

describe("halaman hasil — mode RAW_ONLY", () => {
  it("DCS RAW_ONLY → banner + tabel raw; tanpa K-Index, Risiko, alpha, label risiko", async () => {
    rute({ "/api/v1/dcs/instrumen": instrumen, "/api/v1/dcs/hasil": dcsRaw });
    const { container } = render(await DcsHasilPage());
    expect(screen.getByText(BANNER)).toBeInTheDocument();
    expect(screen.getByText("D1a")).toBeInTheDocument();
    const teks = container.textContent ?? "";
    for (const terlarang of ["K-Index", "Risiko", "alpha", "α", "HIGH", "MODERATE", "LOW"]) {
      expect(teks).not.toContain(terlarang);
    }
  });

  it("WCP RAW_ONLY → banner + tabel raw; tanpa Interpretasi/alpha", async () => {
    rute({ "/api/v1/wcp/instrumen": instrumen, "/api/v1/wcp/hasil": wcpRaw });
    const { container } = render(await WcpHasilPage());
    expect(screen.getByText(BANNER)).toBeInTheDocument();
    // Teks banner sendiri menyebut "Interpretasi"; yang dilarang adalah kolom/skornya.
    expect(screen.queryByRole("columnheader", { name: "Interpretasi" })).toBeNull();
    expect(container.textContent).not.toContain("α");
  });

  it("DCS SCORED → K-Index dan risk flag tetap tampil, tanpa banner", async () => {
    rute({ "/api/v1/dcs/instrumen": instrumen, "/api/v1/dcs/hasil": dcsScored });
    render(await DcsHasilPage());
    expect(screen.getByText(/K-Index Psikososial/)).toBeInTheDocument();
    expect(screen.getByText("Risiko Tinggi")).toBeInTheDocument();
    expect(screen.queryByText(BANNER)).toBeNull();
  });
});

describe("hasil per responden — gerbang flag", () => {
  const params = { params: Promise.resolve({ responden_id: "r1" }) };
  const fiturMati = { items: [{ kode: "WCP_DCS_SCORING", aktif: false, keterangan: "" }] };

  it("flag mati → state informasi (DCS & WCP), nol panggilan ke hasil-responden", async () => {
    rute({ "/api/v1/system/fitur": fiturMati });
    render(await DcsHasilRespondenPage(params));
    expect(screen.getByText(BANNER)).toBeInTheDocument();
    cleanupDom();
    render(await WcpHasilRespondenPage(params));
    expect(screen.getByText(BANNER)).toBeInTheDocument();
    const dipanggil = get.mock.calls.map((c) => c[0] as string);
    expect(dipanggil.filter((p) => p.includes("hasil-responden"))).toHaveLength(0);
    expect(dipanggil.filter((p) => p.includes("/responden/"))).toHaveLength(0);
  });

  it("GET /system/fitur gagal 500 → melempar, bukan render kosong", async () => {
    get.mockResolvedValue({
      data: undefined,
      error: { error: "x", message: "boom" },
      response: { status: 500, headers: { get: () => "r" } },
    });
    await expect(DcsHasilRespondenPage(params)).rejects.toThrow();
  });
});

function cleanupDom() {
  document.body.innerHTML = "";
}
