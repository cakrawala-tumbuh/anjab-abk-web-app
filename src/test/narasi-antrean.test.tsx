import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn(), GRUP_TIM_KAJIAN: "tim-kajian" }));
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ GET: get }) }));

import { auth } from "@/lib/auth/auth";
import AntreanNarasiPage from "@/app/(auth)/narasi/antrean/page";
import { AntreanTabel } from "@/app/(auth)/narasi/antrean/antrean-tabel";
import { FilterAntrean } from "@/app/(auth)/narasi/antrean/filter-antrean";
import { fetchAntrean } from "@/app/(auth)/narasi/antrean/data";
import { bacaFilterAntrean, queryFilterAntrean, teksLabelDokumenter } from "@/lib/narasi-antrean";
import type { AntreanItemRead } from "@/lib/api/schema";

const item = (o: Partial<AntreanItemRead> = {}): AntreanItemRead => ({
  narasi_id: "n-1",
  instrument_id: "DCS",
  field_key: "uraian",
  peran_ref: "KEPALA",
  periode: "2026/27",
  narrative_kind: "F1_FORMAL",
  status: "TEAM_REVIEW",
  versi_id: "v-1",
  revision_no: 1,
  revision_origin: "REVIEWER_EDIT",
  label_dokumenter: null,
  paparan: "TIDAK_BERLAKU",
  jumlah_sumber: 2,
  jumlah_kontradiksi: 0,
  updated_at: "2026-11-05T00:00:00Z",
  ...o,
});

const ok = (data: unknown) => ({
  data,
  response: { status: 200, headers: { get: () => "r1" } },
});
const gagal = (status: number) => ({
  data: undefined,
  error: { error: "x", message: "Gagal." },
  response: { status, headers: { get: () => "r2" } },
});

beforeEach(() => {
  push.mockReset();
  get.mockReset();
  vi.mocked(auth).mockReset();
  vi.mocked(auth).mockResolvedValue({ accessToken: "tok" } as never);
});

describe("AntreanTabel", () => {
  it("merender kolom kontrak dan tautan detail, dalam urutan respons", () => {
    render(
      <AntreanTabel
        items={[
          item({ narasi_id: "b", field_key: "kedua", label_dokumenter: "Draf" }),
          item({ narasi_id: "a", field_key: "ketiga" }),
        ]}
      />,
    );
    for (const k of ["Status", "Instrumen", "Isian", "Peran", "Periode", "Sumber", "Kontradiksi"]) {
      expect(screen.getByRole("columnheader", { name: k })).toBeInTheDocument();
    }
    const baris = screen.getAllByRole("row").slice(1);
    expect(within(baris[0]).getByText("kedua")).toBeInTheDocument();
    expect(within(baris[1]).getByText("ketiga")).toBeInTheDocument();
    expect(within(baris[0]).getByText("Draf")).toBeInTheDocument();
    const tautan = within(baris[0]).getByRole("link");
    expect(tautan).toHaveAttribute("href", "/narasi/antrean/b");
    expect(within(baris[0]).getByText("F1_FORMAL")).toBeInTheDocument();
  });

  it("menandai AI_DRAFT dan kontradiksi, dan tidak menandai yang lain", () => {
    const { rerender } = render(<AntreanTabel items={[item()]} />);
    expect(screen.queryByText("Draf AI")).not.toBeInTheDocument();
    expect(screen.queryByText(/kontradiksi$/)).not.toBeInTheDocument();
    rerender(
      <AntreanTabel
        items={[item({ revision_origin: "AI_DRAFT", status: "AI_DRAFT", jumlah_kontradiksi: 3 })]}
      />,
    );
    expect(screen.getByText("Draf AI")).toBeInTheDocument();
    expect(screen.getByText(/3 kontradiksi/)).toBeInTheDocument();
  });

  it("tidak punya kotak centang baris", () => {
    render(<AntreanTabel items={[item(), item({ narasi_id: "n-2" })]} />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});

describe("teksLabelDokumenter", () => {
  it("teks apa adanya, kosong jadi tanda strip, bukan teks diserialisasi", () => {
    expect(teksLabelDokumenter("DOCUMENTARY_CANDIDATE")).toBe("DOCUMENTARY_CANDIDATE");
    expect(teksLabelDokumenter(null)).toBe("—");
    expect(teksLabelDokumenter(undefined)).toBe("—");
    expect(teksLabelDokumenter({ a: 1 })).toBe('{"a":1}');
  });
});

describe("FilterAntrean", () => {
  it("memilih status mengubah URL dan membuang hlm", () => {
    render(<FilterAntrean filter={bacaFilterAntrean({})} />);
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "NEED_FACT" } });
    expect(push).toHaveBeenCalledWith("/narasi/antrean?status=NEED_FACT");
  });

  it("Terapkan mengirim instrumen dan periode ke URL", () => {
    render(<FilterAntrean filter={bacaFilterAntrean({ status: "AI_DRAFT" })} />);
    fireEvent.change(screen.getByLabelText("Instrumen"), { target: { value: " DCS " } });
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "2026/27" } });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan" }));
    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("status=AI_DRAFT");
    expect(url).toContain("instrument_id=DCS");
    expect(url).toContain("periode=2026%2F27");
  });

  it("status di luar tiga status antrean diabaikan", () => {
    expect(bacaFilterAntrean({ status: "TEAM_VERIFIED" }).status).toBeNull();
    expect(queryFilterAntrean(bacaFilterAntrean({}))).toBe("");
  });
});

describe("halaman antrean", () => {
  it("filter terkirim sebagai query dan baris tidak diurutkan ulang", async () => {
    get.mockResolvedValue(
      ok({
        items: [
          item({ narasi_id: "z", field_key: "zz" }),
          item({ narasi_id: "a", field_key: "aa" }),
        ],
        total: 2,
        limit: 20,
        offset: 0,
      }),
    );
    render(
      await AntreanNarasiPage({
        searchParams: Promise.resolve({
          status: "NEED_FACT",
          instrument_id: "DCS",
          periode: "2026/27",
        }),
      }),
    );
    expect(get.mock.calls[0][0]).toBe("/api/v1/narasi/antrean");
    expect(get.mock.calls[0][1].params.query).toMatchObject({
      status: "NEED_FACT",
      instrument_id: "DCS",
      periode: "2026/27",
      limit: 20,
      offset: 0,
    });
    const baris = screen.getAllByRole("row").slice(1);
    expect(baris[0]).toHaveTextContent("zz");
    expect(baris[1]).toHaveTextContent("aa");
  });

  it("membedakan kosong, kosong-karena-filter, dan gagal", async () => {
    get.mockResolvedValue(ok({ items: [], total: 0, limit: 20, offset: 0 }));
    render(await AntreanNarasiPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/Kasus baru masuk antrean setelah punya versi/)).toBeInTheDocument();
    document.body.innerHTML = "";
    render(await AntreanNarasiPage({ searchParams: Promise.resolve({ status: "AI_DRAFT" }) }));
    expect(screen.getByText(/yang cocok dengan filter/)).toBeInTheDocument();
    expect(screen.queryByText(/Kasus baru masuk antrean/)).not.toBeInTheDocument();
    get.mockResolvedValue(gagal(500));
    await expect(AntreanNarasiPage({ searchParams: Promise.resolve({}) })).rejects.toMatchObject({
      status: 500,
    });
  });

  it("fetchAntrean melempar pada 403, bukan daftar kosong", async () => {
    get.mockResolvedValue(gagal(403));
    await expect(
      fetchAntrean("tok", { status: null, instrument_id: null, periode: null }, 0),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("halaman tidak memuat kotak centang", async () => {
    get.mockResolvedValue(ok({ items: [item()], total: 1, limit: 20, offset: 0 }));
    render(await AntreanNarasiPage({ searchParams: Promise.resolve({}) }));
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});
