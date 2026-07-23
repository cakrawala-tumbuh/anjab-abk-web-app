import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";

// ── Mock router, auth, & API client ─────────────────────────────────────────
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
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post }),
}));

import { auth } from "@/lib/auth/auth";
import TiSesiDetailPage from "@/app/(auth)/task-inventory/[sesi_id]/page";

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

// Status CLOSED: task-terpilih di-fetch, hasil & tahap2-review TIDAK (menyederhanakan
// urutan mock — fokus murni pada kasus 2: kegagalan task-terpilih).
const sesi = {
  id: "tises_1",
  jabatan_id: "jbt_1",
  jabatan_nama: "Guru Kelas",
  status: "CLOSED",
  cabang: "Bandung",
  koordinator_id: null,
  jumlah_task_terpilih: 3,
  catatan: null,
};
const taskTerpilih = [
  {
    kode: "TIaaa",
    tugas_pokok: "Pokok A",
    uraian_tugas: "Uraian A",
    n_relevan: 2,
    pct_relevan: 100,
  },
];

const props = {
  params: Promise.resolve({ sesi_id: "tises_1" }),
  searchParams: Promise.resolve({}),
};
const HAPUS_PAKSA =
  "Hapus paksa analisis ini — SELURUH responden, seleksi & detail ikut terhapus permanen";

function mockCoreSukses() {
  get
    .mockResolvedValueOnce(ok(sesi)) // sesiRes
    .mockResolvedValueOnce(ok({ items: [], total: 0 })) // respondenRes paginated (Promise.all)
    .mockResolvedValueOnce(ok({ items: [], total: 0 })); // respondenAllRes penuh (Promise.all)
  post.mockResolvedValueOnce(ok({ items: [] })); // smeRes (POST dalam Promise.all)
  get.mockResolvedValueOnce(ok({ items: [], total: 0 })); // partisipanRes (GET dalam Promise.all)
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

describe("TiSesiDetailPage — Kasus 2 (backlog 035): task-terpilih 500 tidak mematikan halaman", () => {
  it("task-terpilih 500 → header & 'Hapus paksa' tetap terender, bagian hasil tampil GagalMuatSebagian", async () => {
    mockCoreSukses();
    get.mockResolvedValueOnce(gagal(500, "internal_error", "Kesalahan server.", "req-500")); // ttRes

    const el = (await TiSesiDetailPage(props)) as ReactElement;
    render(el);

    // Header tetap ada.
    expect(screen.getByRole("heading", { name: "Guru Kelas" })).toBeInTheDocument();
    // Panel aksi admin (termasuk Hapus paksa) tetap ada — ini yang selama ini hilang.
    expect(screen.getByRole("button", { name: HAPUS_PAKSA })).toBeInTheDocument();
    // Kegagalannya WAJIB terlihat, bukan ditelan senyap.
    expect(screen.getByText("Sebagian data pendukung gagal dimuat.")).toBeInTheDocument();
    expect(screen.getByText("Task relevan terpilih")).toBeInTheDocument();
    expect(screen.getByText("req-500")).toBeInTheDocument();
    // Seksi "Task Relevan Terpilih" (butuh data yang gagal) tidak dirender.
    expect(screen.queryByText(/Task Relevan Terpilih \(/)).toBeNull();
  });
});

describe("TiSesiDetailPage — regresi: alur sukses tanpa kegagalan tidak berubah", () => {
  it("task-terpilih sukses → tabel Task Relevan Terpilih tampil, TANPA panel GagalMuatSebagian", async () => {
    mockCoreSukses();
    get.mockResolvedValueOnce(ok({ items: taskTerpilih, total: 1 })); // ttRes (Page)

    const el = (await TiSesiDetailPage(props)) as ReactElement;
    render(el);

    expect(screen.getByRole("button", { name: HAPUS_PAKSA })).toBeInTheDocument();
    expect(screen.queryByText("Sebagian data pendukung gagal dimuat.")).toBeNull();
    expect(screen.getByText("Task Relevan Terpilih (1)")).toBeInTheDocument();
    expect(screen.getByText("Uraian A")).toBeInTheDocument();
  });
});
