/**
 * Regresi backlog #54 — tampilkan cabang sesi OPM di daftar, detail, hasil, dan kartu
 * kuesioner partisipan. Cakupan: `OpmSesiRead.cabang`, `OpmHasilSesiRead.cabang`,
 * `OpmKuesionerItemRead.sesi_cabang` — ketiganya nullable, fallback wajib `"—"`.
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(),
  isAdmin: (session: { user?: { groups?: string[] } } | null) =>
    session?.user?.groups?.includes("admin") ?? false,
  isPartisipan: () => true,
}));

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post }),
}));

import { auth } from "@/lib/auth/auth";
import OpmSesiPage from "@/app/(auth)/opm/page";
import OpmSesiDetailPage from "@/app/(auth)/opm/[sesi_id]/page";
import OpmHasilPage from "@/app/(auth)/opm/[sesi_id]/hasil/page";
import KuesionerPage from "@/app/(auth)/kuesioner/page";

function ok(data: unknown) {
  return { data, error: undefined, response: { status: 200, headers: { get: () => "req-ok" } } };
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  vi.mocked(auth).mockReset();
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", groups: ["admin"] },
    accessToken: "tok",
  } as never);
});

describe("Daftar sesi OPM (/opm) — kolom Cabang", () => {
  it("dua sesi jabatan sama beda cabang tampil sebagai dua baris terbedakan", async () => {
    get.mockResolvedValueOnce(
      ok({
        items: [
          {
            id: "opses_bdg",
            jabatan_id: "jbt_1",
            jabatan_nama: "Guru BK",
            cabang: "Bandung",
            periode: "2026-06",
            status: "OPEN",
            jumlah_task: 5,
            created_at: "2026-06-01T00:00:00Z",
          },
          {
            id: "opses_smg",
            jabatan_id: "jbt_1",
            jabatan_nama: "Guru BK",
            cabang: "Semarang",
            periode: "2026-06",
            status: "OPEN",
            jumlah_task: 5,
            created_at: "2026-06-01T00:00:00Z",
          },
        ],
        total: 2,
      }),
    );

    const el = (await OpmSesiPage({
      searchParams: Promise.resolve({}),
    })) as ReactElement;
    render(el);

    expect(screen.getByText("Bandung")).toBeInTheDocument();
    expect(screen.getByText("Semarang")).toBeInTheDocument();
  });

  it("sesi ber-cabang null tampil sebagai '—'", async () => {
    get.mockResolvedValueOnce(
      ok({
        items: [
          {
            id: "opses_lama",
            jabatan_id: "jbt_1",
            jabatan_nama: "Guru BK",
            cabang: null,
            periode: "2026-06",
            status: "OPEN",
            jumlah_task: 5,
            created_at: "2026-06-01T00:00:00Z",
          },
        ],
        total: 1,
      }),
    );

    const el = (await OpmSesiPage({
      searchParams: Promise.resolve({}),
    })) as ReactElement;
    render(el);

    const row = screen.getByText("Guru BK").closest("tr");
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent("—");
  });
});

describe("Detail sesi OPM (/opm/[sesi_id]) — baris Cabang", () => {
  function mockDetail(cabang: string | null) {
    get
      .mockResolvedValueOnce(
        ok({
          id: "opses_1",
          jabatan_id: "jbt_1",
          jabatan_nama: "Guru BK",
          ti_sesi_id: "tises_1",
          cabang,
          periode: "2026-06",
          status: "DRAFT",
          min_responden: 3,
          max_responden: 10,
          jumlah_task: 0,
          created_at: "2026-06-01T00:00:00Z",
        }),
      ) // sesiRes
      .mockResolvedValueOnce(ok({ items: [], total: 0 })) // taskRes
      .mockResolvedValueOnce(ok({ items: [], total: 0 })) // respondenRes
      .mockResolvedValueOnce(ok({ items: [], total: 0 })) // respondenAllRes
      .mockResolvedValueOnce(ok({ items: [], total: 0 })) // panelRes
      .mockResolvedValueOnce(ok({ items: [], total: 0 })); // partisipanRes
  }

  it("cabang terisi ditampilkan", async () => {
    mockDetail("Bandung");
    const el = (await OpmSesiDetailPage({
      params: Promise.resolve({ sesi_id: "opses_1" }),
      searchParams: Promise.resolve({}),
    })) as ReactElement;
    render(el);

    expect(screen.getByText("Cabang:")).toBeInTheDocument();
    expect(screen.getByText("Bandung")).toBeInTheDocument();
  });

  it("cabang null tampil sebagai '—'", async () => {
    mockDetail(null);
    const el = (await OpmSesiDetailPage({
      params: Promise.resolve({ sesi_id: "opses_1" }),
      searchParams: Promise.resolve({}),
    })) as ReactElement;
    render(el);

    expect(screen.getByText("Cabang:")).toBeInTheDocument();
    // Fallback tampilan: nilai `null` dirender sebagai "—" tunggal di span nilai cabang,
    // tidak ada "null"/"undefined" yang bocor ke layar.
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("Hasil OPM (/opm/[sesi_id]/hasil) — Cabang di subtext header", () => {
  function mockHasil(cabang: string | null) {
    get
      .mockResolvedValueOnce(
        ok({
          id: "opses_1",
          jabatan_id: "jbt_1",
          jabatan_nama: "Guru BK",
          ti_sesi_id: "tises_1",
          cabang: "Bandung",
          periode: "2026-06",
          status: "ANALYZED",
          min_responden: 3,
          max_responden: 10,
          jumlah_task: 0,
          created_at: "2026-06-01T00:00:00Z",
        }),
      ) // sesiRes
      .mockResolvedValueOnce(
        ok({
          sesi_id: "opses_1",
          jabatan_id: "jbt_1",
          jabatan_nama: "Guru BK",
          cabang,
          periode: "2026-06",
          n_responden_submit: 3,
          tasks: [],
        }),
      ); // hasilRes
  }

  it("cabang terisi ditampilkan di subtext header", async () => {
    mockHasil("Semarang");
    const el = (await OpmHasilPage({
      params: Promise.resolve({ sesi_id: "opses_1" }),
    })) as ReactElement;
    render(el);

    expect(screen.getByText("Semarang")).toBeInTheDocument();
  });

  it("cabang null tampil sebagai '—'", async () => {
    mockHasil(null);
    const el = (await OpmHasilPage({
      params: Promise.resolve({ sesi_id: "opses_1" }),
    })) as ReactElement;
    render(el);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("Kartu kuesioner OPM (/kuesioner) — subteks 'OPM · Cabang …'", () => {
  function mockKuesioner(sesi_cabang: string | null) {
    get
      .mockResolvedValueOnce(ok([])) // dcs
      .mockResolvedValueOnce(ok([])) // wcp
      .mockResolvedValueOnce(ok([])) // ti
      .mockResolvedValueOnce(ok([])) // ts
      .mockResolvedValueOnce(
        ok([
          {
            id: "oprs_1",
            sesi_id: "opses_1",
            sesi_catatan: null,
            sesi_status: "OPEN",
            sesi_periode: "2026-06",
            sesi_cabang,
            sudah_submit: false,
            submitted_at: null,
            created_at: "2026-06-01T00:00:00Z",
          },
        ]),
      ); // opm
  }

  it("sesi_cabang terisi tampil di subteks kartu", async () => {
    mockKuesioner("Bandung");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", groups: ["partisipan"] },
      accessToken: "tok",
    } as never);

    const el = (await KuesionerPage()) as ReactElement;
    render(el);

    expect(screen.getByText("OPM · Cabang Bandung")).toBeInTheDocument();
  });

  it("sesi_cabang null tampil sebagai '—' di subteks kartu", async () => {
    mockKuesioner(null);
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", groups: ["partisipan"] },
      accessToken: "tok",
    } as never);

    const el = (await KuesionerPage()) as ReactElement;
    render(el);

    expect(screen.getByText("OPM · Cabang —")).toBeInTheDocument();
  });
});
