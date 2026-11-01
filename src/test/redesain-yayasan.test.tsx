import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post }),
}));
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
const notifyGagal = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
}));
vi.mock("@/lib/auth/auth", () => ({ auth: async () => ({ accessToken: "tok" }) }));

import RingkasanYayasanPage from "@/app/(auth)/redesain/yayasan/page";
import DetailYayasanPage from "@/app/(auth)/redesain/yayasan/[masalah_id]/page";
import { fetchIndexYayasan } from "@/app/(auth)/redesain/yayasan/data";
import { FilterYayasanBar } from "@/app/(auth)/redesain/yayasan/filter-yayasan";
import { UnduhDocx } from "@/components/unduh-docx";
import { ApiError } from "@/lib/api/errors";
import type { RingkasanYayasanRow } from "@/lib/api/schema";
import {
  bacaFilterYayasan,
  domainYayasan,
  tampilNilai,
  urlAgendaYayasan,
} from "@/lib/redesain-yayasan";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: "x", message: "ditolak" },
  response: { status, headers: { get: () => "req-1" } },
});
const baris = (p: Partial<RingkasanYayasanRow> = {}): RingkasanYayasanRow =>
  ({
    masalah_id: "m1",
    masalah_kode: "M-K01-01",
    konteks_kode: "K-01",
    sekolah_konteks: "SD Contoh",
    periode_acuan: "2026",
    rumusan_hipotesis: "Hipotesis A",
    sumber_awal_keterbatasan: "Sumber A",
    status_bukti: "Hipotesis",
    k1: "Sedang",
    k2: null,
    k3: "Tinggi",
    k4: null,
    indikasi_kritis: null,
    saran_otomatis: null,
    prioritas_final: "P2 - Berikutnya",
    alasan_final: null,
    pemutus: "O-0001 — Ketua Tim Kajian",
    tindak_lanjut: null,
    proses_kode: ["P-01"],
    status_penilaian: "Telah diputuskan",
    tanggal_keputusan: null,
    diluruskan_sekolah: null,
    alasan_rentang_beda: null,
    peringatan: [{ kode: "PRIORITAS_TANPA_BUKTI", pesan: "Tanpa bukti" }],
    ...p,
  }) as RingkasanYayasanRow;

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  push.mockReset();
  notifyGagal.mockReset();
  vi.unstubAllGlobals();
});

/** Mock: search yayasan → `rows`; konteks → daftar kosong. */
function mockIndex(rows: RingkasanYayasanRow[], status = 200) {
  post.mockImplementation(async () => resp({ items: rows, total: rows.length }, status));
  get.mockImplementation(async () => resp({ items: [], total: 0 }));
}

describe("fungsi murni", () => {
  it("tampilNilai: null/kosong → —, isi apa adanya", () => {
    expect(tampilNilai(null)).toBe("—");
    expect(tampilNilai(undefined)).toBe("—");
    expect(tampilNilai("")).toBe("—");
    expect(tampilNilai("Tinggi")).toBe("Tinggi");
  });
  it("filter query string → domain search", () => {
    const f = bacaFilterYayasan({ konteks: "K-01", penilaian: "Ditunda", bukti: "" });
    expect(domainYayasan(f)).toEqual([
      ["konteks_kode", "=", "K-01"],
      ["status_penilaian", "=", "Ditunda"],
    ]);
    expect(domainYayasan(bacaFilterYayasan({}))).toEqual([]);
  });
});

describe("halaman ringkasan yayasan", () => {
  it("merender — untuk null dan nilai apa adanya untuk isi", async () => {
    mockIndex([baris()]);
    render(await RingkasanYayasanPage({ searchParams: Promise.resolve({}) }));
    const row = screen.getByText("M-K01-01").closest("tr")!;
    const sel = within(row).getAllByRole("cell");
    // kolom: 0 masalah, 1 konteks, 2 sekolah, 3 rumusan, 4 sumber, 5 bukti, 6..9 K1..K4
    expect(sel[6]).toHaveTextContent("Sedang");
    expect(sel[7]).toHaveTextContent("—");
    expect(sel[7]).not.toHaveTextContent("0");
    expect(sel[8]).toHaveTextContent("Tinggi");
    expect(sel[9]).toHaveTextContent("—");
    expect(within(row).getByText("PRIORITAS_TANPA_BUKTI")).toBeInTheDocument();
  });

  it("filter query string diteruskan ke body search yayasan", async () => {
    mockIndex([baris()]);
    await RingkasanYayasanPage({
      searchParams: Promise.resolve({ konteks: "K-01", final: "P1 - Utama" }),
    });
    const yayasanCall = post.mock.calls.find((c) => c[0] === "/api/v1/redesain/yayasan/search");
    expect(yayasanCall![1].body.domain).toEqual([
      ["konteks_kode", "=", "K-01"],
      ["prioritas_final", "=", "P1 - Utama"],
    ]);
  });

  it("ringkasan 403 melempar ApiError", async () => {
    mockIndex([], 403);
    await expect(fetchIndexYayasan("tok", bacaFilterYayasan({}), 0)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("filter berubah → router.push dengan query string", () => {
    render(<FilterYayasanBar konteks={[]} filter={bacaFilterYayasan({})} />);
    fireEvent.change(screen.getByLabelText("Status penilaian"), {
      target: { value: "Ditunda" },
    });
    expect(push).toHaveBeenCalledWith("/redesain/yayasan?penilaian=Ditunda");
  });
});

describe("halaman detail yayasan", () => {
  it("404 memanggil notFound()", async () => {
    get.mockResolvedValue(resp(undefined, 404));
    await expect(
      DetailYayasanPage({ params: Promise.resolve({ masalah_id: "x" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
  it("200 merender — untuk null", async () => {
    get.mockResolvedValue(resp(baris()));
    render(await DetailYayasanPage({ params: Promise.resolve({ masalah_id: "m1" }) }));
    expect(screen.getByText("K2").nextElementSibling).toHaveTextContent("—");
    expect(screen.getByRole("button", { name: "Unduh DOCX" })).toBeInTheDocument();
  });
});

describe("tombol unduh", () => {
  function stubUnduh(res: Response) {
    const fetchSpy = vi.fn().mockResolvedValue(res);
    vi.stubGlobal("fetch", fetchSpy);
    URL.createObjectURL = vi.fn().mockReturnValue("blob:x");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    return fetchSpy;
  }

  it("agenda memanggil route dengan status_penilaian=Siap untuk telaah yayasan", async () => {
    const fetchSpy = stubUnduh(new Response("d", { status: 200 }));
    render(<UnduhDocx href={urlAgendaYayasan()} label="Unduh agenda (DOCX)" />);
    fireEvent.click(screen.getByRole("button", { name: "Unduh agenda (DOCX)" }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const url = new URL(String(fetchSpy.mock.calls[0][0]), "http://x");
    expect(url.pathname).toBe("/api/redesain/ekspor/ringkasan-yayasan");
    expect(url.searchParams.get("status_penilaian")).toBe("Siap untuk telaah yayasan");
  });

  it("batch 404 → toast 'Tidak ada masalah di agenda'", async () => {
    stubUnduh(new Response("{}", { status: 404 }));
    render(
      <UnduhDocx
        href={urlAgendaYayasan()}
        label="Unduh agenda (DOCX)"
        pesan404="Tidak ada masalah di agenda"
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe("Tidak ada masalah di agenda");
  });
});
