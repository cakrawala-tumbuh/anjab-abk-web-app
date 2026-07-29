import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
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
import UraianTugasPage from "@/app/(auth)/master-data/uraian-tugas/page";

function ok(data: unknown) {
  return { data, error: undefined, response: { status: 200, headers: { get: () => "req-ok" } } };
}
function gagal(status: number, code: string, message: string) {
  return {
    data: undefined,
    error: { error: code, message },
    response: { status, headers: { get: () => "req-err" } },
  };
}

const jabatan = [{ id: "jbt_1", nama: "Guru Kelas" }];
const tugasPokok = [{ id: "tp_1", nama: "Pengajaran", jabatan_ids: ["jbt_1"] }];
const detilTugas = [
  { id: "dt_1", nama: "Menyusun RPP", tugas_pokok_id: "tp_1", jabatan_ids: ["jbt_1"] },
];

function mockDropdowns() {
  get
    .mockResolvedValueOnce(ok({ items: jabatan, total: 1 }))
    .mockResolvedValueOnce(ok({ items: tugasPokok, total: 1 }))
    .mockResolvedValueOnce(ok({ items: detilTugas, total: 1 }));
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  vi.mocked(auth).mockResolvedValue({
    accessToken: "tok",
    user: { groups: ["admin"] },
  } as unknown as Awaited<ReturnType<typeof auth>>);
});

function props(searchParams: Record<string, string> = {}) {
  return { searchParams: Promise.resolve(searchParams) };
}

describe("UraianTugasPage", () => {
  it("tanpa filter & tanpa hasil → pesan 'belum ada uraian tugas'", async () => {
    post.mockResolvedValueOnce(ok({ items: [], total: 0 }));
    mockDropdowns();

    render(await UraianTugasPage(props()));

    expect(screen.getByText(/Belum ada uraian tugas/)).toBeInTheDocument();
    expect(screen.queryByText(/cocok dengan filter/)).not.toBeInTheDocument();
  });

  it("filter aktif & tanpa hasil → pesan menyebut filter, bukan 'belum ada'", async () => {
    post.mockResolvedValueOnce(ok({ items: [], total: 0 }));
    mockDropdowns();

    render(await UraianTugasPage(props({ jabatan: "jbt_1" })));

    expect(screen.getByText(/Tidak ada uraian tugas yang cocok dengan filter/)).toBeInTheDocument();
    expect(screen.getAllByText("Hapus filter").length).toBeGreaterThan(0);
    expect(screen.queryByText(/^Belum ada uraian tugas/)).not.toBeInTheDocument();
  });

  it("menampilkan nama jabatan & detil tugas, bukan ID mentah", async () => {
    post.mockResolvedValueOnce(
      ok({
        items: [
          {
            id: "ut_1",
            kode: "TIabc",
            uraian: "Menyusun RPP semester",
            unit: "SD",
            jabatan_id: "jbt_1",
            tugas_pokok_id: "tp_1",
            detil_tugas_id: "dt_1",
            urutan: 1,
            std_frekuensi_teks: null,
          },
        ],
        total: 1,
      }),
    );
    mockDropdowns();

    render(await UraianTugasPage(props()));

    const table = within(screen.getByRole("table"));
    expect(table.getByText("Guru Kelas")).toBeInTheDocument();
    expect(table.getByText("Menyusun RPP")).toBeInTheDocument();
    expect(table.queryByText("jbt_1")).not.toBeInTheDocument();
  });

  it("uraian tugas panjang (200+ karakter) → sel kolom Uraian membungkus teks penuh, tidak truncate", async () => {
    const uraianPanjang =
      "Menyusun rencana pelaksanaan pembelajaran per kompetensi dasar untuk seluruh mata pelajaran " +
      "yang diampu pada semester berjalan, termasuk menyiapkan bahan ajar, lembar kerja peserta " +
      "didik, dan instrumen penilaian formatif maupun sumatif sesuai kurikulum yang berlaku saat ini.";
    expect(uraianPanjang.length).toBeGreaterThan(200);
    post.mockResolvedValueOnce(
      ok({
        items: [
          {
            id: "ut_2",
            kode: "TIdef",
            uraian: uraianPanjang,
            unit: "SD",
            jabatan_id: "jbt_1",
            tugas_pokok_id: "tp_1",
            detil_tugas_id: "dt_1",
            urutan: 1,
            std_frekuensi_teks: null,
          },
        ],
        total: 1,
      }),
    );
    mockDropdowns();

    render(await UraianTugasPage(props()));

    const sel = screen.getByText(uraianPanjang);
    expect(sel.className).not.toMatch(/\btruncate\b/);
    expect(sel.className).toMatch(/\bwhitespace-normal\b/);
    expect(sel.className).toMatch(/\bbreak-words\b/);
  });

  it("baris hitung menyebut 'cocok dengan filter' saat filter aktif", async () => {
    post.mockResolvedValueOnce(ok({ items: [], total: 0 }));
    mockDropdowns();

    render(await UraianTugasPage(props({ tp: "tp_1" })));

    expect(screen.getByText("0 uraian tugas cocok dengan filter")).toBeInTheDocument();
  });

  it("fetch daftar gagal (403) → melempar, tidak merender daftar/dropdown kosong", async () => {
    post.mockResolvedValueOnce(gagal(403, "forbidden", "Akses ditolak."));
    mockDropdowns();

    await expect(UraianTugasPage(props())).rejects.toThrow("Akses ditolak.");
  });

  it("?jabatan=<id-tak-dikenal> → domain terkirim apa adanya, halaman merender kosong-terfilter", async () => {
    post.mockResolvedValueOnce(ok({ items: [], total: 0 }));
    mockDropdowns();

    render(await UraianTugasPage(props({ jabatan: "jbt_tak_dikenal" })));

    expect(post).toHaveBeenCalledWith("/api/v1/task-inventory/uraian-tugas/search", {
      body: {
        domain: [["jabatan_id", "=", "jbt_tak_dikenal"]],
        order: [],
        limit: 20,
        offset: 0,
      },
    });
    expect(screen.getByText(/Tidak ada uraian tugas yang cocok dengan filter/)).toBeInTheDocument();
  });
});
