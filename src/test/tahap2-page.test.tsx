import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";

// ── Mock router, auth, & API client ─────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
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
  withServerAuth: () => ({ GET: get }),
}));

import { auth } from "@/lib/auth/auth";
import { ApiError } from "@/lib/api/errors";
import Tahap2KoordinatorPage from "@/app/(auth)/task-inventory/tahap2/[sesi_id]/page";

// ── Fixtures ────────────────────────────────────────────────────────────────
function ok(data: unknown) {
  return { data, error: undefined, response: { status: 200, headers: { get: () => "req-ok" } } };
}

function gagal(status: number, code: string, message: string, reqId = "req-err") {
  return {
    data: undefined,
    error: { error: code, message },
    response: { status, headers: { get: () => reqId } },
  };
}

const sesi = {
  id: "tises_1",
  jabatan_id: "jbt_1",
  jabatan_nama: "Guru Kelas",
  status: "TAHAP2",
  koordinator_id: "par_koor",
};
const catalog = [{ kode: "TIaaa", uraian_tugas: "Uraian A" }];
const respondenList = [
  { id: "tresp_1", partisipan_id: "par_anggota", nama: "Budi", tahap1_submit: true },
];
const review = {
  sesi_id: "tises_1",
  tasks: [{ task_kode: "TIaaa", n_relevan: 1, n_total: 2, disetujui: null }],
  jumlah_belum_diputuskan: 1,
};

const props = { params: Promise.resolve({ sesi_id: "tises_1" }) };

function sesiPartisipan(groups: string[] = []) {
  return { user: { id: "u1", groups }, accessToken: "tok" };
}

beforeEach(() => {
  get.mockReset();
  vi.mocked(auth).mockReset();
});

describe("Tahap2KoordinatorPage — Kasus 1 (backlog 035): 403 tampil sebagai TidakBerhak, bukan crash", () => {
  it("403 pada GET sesi (partisipan bukan anggota panel) → panel Tidak Berwenang, bukan lempar", async () => {
    vi.mocked(auth).mockResolvedValue(sesiPartisipan(["partisipan"]) as never);
    get.mockResolvedValueOnce(gagal(403, "forbidden", "Akses ditolak.", "req-403"));

    const el = (await Tahap2KoordinatorPage(props)) as ReactElement;
    render(el);

    expect(
      screen.getByText(
        "Anda tidak berhak membuka halaman ini. Halaman pengisian hanya dapat dibuka oleh partisipan pemiliknya.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("req-403")).toBeInTheDocument();
    // ReviewForm/PetunjukTahap2 tidak pernah dirender pada jalur ini.
    expect(screen.queryByRole("button", { name: "Simpan Keputusan" })).toBeNull();
  });

  it("500 pada GET sesi tetap MELEMPAR (tidak tertangkap sebagai TidakBerhak)", async () => {
    vi.mocked(auth).mockResolvedValue(sesiPartisipan(["partisipan"]) as never);
    get.mockResolvedValueOnce(gagal(500, "internal_error", "Kesalahan server."));

    const err = await Tahap2KoordinatorPage(props).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
  });
});

describe("Tahap2KoordinatorPage — regresi: mode hanya-baca anggota & hak koordinator tidak berubah", () => {
  function mockFetchSukses(partisipanId: string) {
    get
      .mockResolvedValueOnce(ok(sesi)) // sesiRes
      .mockResolvedValueOnce(ok({ id: partisipanId })) // sayaRes
      .mockResolvedValueOnce(ok(catalog)) // catalogRes
      .mockResolvedValueOnce(ok(respondenList)) // respondenRes
      .mockResolvedValueOnce(ok(review)); // reviewRes (status TAHAP2 → dipanggil)
  }

  it("anggota panel non-koordinator: banner hanya-baca tampil, ReviewForm readOnly (tanpa tombol aksi)", async () => {
    vi.mocked(auth).mockResolvedValue(sesiPartisipan(["partisipan"]) as never);
    mockFetchSukses("par_anggota");

    const el = (await Tahap2KoordinatorPage(props)) as ReactElement;
    render(el);

    expect(
      screen.getByText(
        "Anda melihat hasil Tahap 2 sebagai anggota panel (hanya-baca). Keputusan ditetapkan oleh koordinator.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Simpan Keputusan" })).toBeNull();
  });

  it("koordinator panel: tanpa banner hanya-baca, ReviewForm tetap bisa memutuskan & menyimpan", async () => {
    vi.mocked(auth).mockResolvedValue(sesiPartisipan(["partisipan"]) as never);
    mockFetchSukses("par_koor");

    const el = (await Tahap2KoordinatorPage(props)) as ReactElement;
    render(el);

    expect(
      screen.queryByText(
        "Anda melihat hasil Tahap 2 sebagai anggota panel (hanya-baca). Keputusan ditetapkan oleh koordinator.",
      ),
    ).toBeNull();
    expect(screen.getAllByRole("button", { name: "Simpan Keputusan" }).length).toBeGreaterThan(0);
  });
});
