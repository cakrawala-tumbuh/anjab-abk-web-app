import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
vi.mock("@/lib/auth/auth", () => ({ auth: () => authMock() }));
const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post, PATCH: patch }),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
const notifyGagal = vi.fn();
const notifySukses = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
  notifySukses: (m: string) => notifySukses(m),
}));

import DetailMasalahPage from "@/app/(auth)/redesain/masalah/[id]/page";
import { FormProses } from "@/app/(auth)/redesain/masalah/[id]/form-proses";
import { FormKoreksi } from "@/app/(auth)/redesain/masalah/[id]/form-koreksi";
import { fetchAlurMasalah } from "@/app/(auth)/redesain/masalah/[id]/data";
import { BAGIAN_DETAIL_MASALAH, pilihBagian } from "@/app/(auth)/redesain/masalah/[id]/registry";
import { ApiError } from "@/lib/api/errors";
import type { KoreksiRead, LangkahRead, MasalahRead, ProsesRead } from "@/lib/api/schema";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: "x", message: "ditolak" },
  response: { status, headers: { get: () => "req-1" } },
});
const halaman = (items: unknown[]) => resp({ items, total: items.length, limit: 500, offset: 0 });

const masalah = (p: Partial<MasalahRead> = {}): MasalahRead =>
  ({
    id: "m1",
    kode: "M-K01-01",
    konteks_id: "k1",
    sekolah_id: "s1",
    keterangan_sekolah: null,
    periode_acuan: "TA 2026/27",
    status_awal: "Hipotesis",
    gelombang: "G1",
    dibuka_untuk_konfirmasi: false,
    ...p,
  }) as MasalahRead;

const langkah = (id: string, urutan: number, tahap: string): LangkahRead =>
  ({
    id,
    kode: `P-001-S0${urutan}`,
    proses_id: "p1",
    urutan,
    tahap,
    pemicu_input: "pemicu",
    pelaksana: "Wakil Kepala Sekolah",
    pekerjaan_sistem: "sistem",
    keluaran_penerima: "keluaran",
    pemeriksa_pemutus: null,
    hambatan: null,
    status_langkah: "Hipotesis",
  }) as LangkahRead;

const proses = (langkahList: LangkahRead[]): ProsesRead =>
  ({
    id: "p1",
    kode: "P-001",
    masalah_id: "m1",
    sekolah_id: "s1",
    periode: "TA 2026/27",
    nama_proses: "Penyusunan jadwal",
    langkah: langkahList,
  }) as ProsesRead;

const koreksi = (id: string, waktu: string, konfirmasi: string | null): KoreksiRead => ({
  id,
  langkah_id: "l1",
  konfirmasi_id: konfirmasi,
  kode_orang: "O-0001",
  isi: `isi-${id}`,
  waktu,
});

function siapkan(
  opts: {
    langkah?: LangkahRead[];
    koreksi?: KoreksiRead[];
    prosesGet?: number;
    masalah?: MasalahRead;
    bukti?: unknown[];
  } = {},
) {
  const ls = opts.langkah ?? [
    langkah("l3", 3, "Tiga"),
    langkah("l1", 1, "Satu"),
    langkah("l2", 2, "Dua"),
  ];
  get.mockImplementation(async (path: string) => {
    if (path === "/api/v1/redesain/masalah/{masalah_id}") return resp(opts.masalah ?? masalah());
    if (path === "/api/v1/redesain/konteks")
      return halaman([{ id: "k1", kode: "K-01", tema: "Beban administrasi" }]);
    if (path === "/api/v1/sekolah")
      return halaman([
        { id: "s1", nama: "SD Contoh" },
        { id: "s2", nama: "SD Lain" },
      ]);
    if (path === "/api/v1/redesain/proses/{proses_id}")
      return opts.prosesGet && opts.prosesGet >= 400
        ? resp(null, opts.prosesGet)
        : resp(proses(ls));
    if (path === "/api/v1/redesain/langkah/{langkah_id}/koreksi")
      return halaman(opts.koreksi ?? []);
    throw new Error(`GET tak terduga ${path}`);
  });
  post.mockImplementation(async (path: string) => {
    if (path === "/api/v1/redesain/proses/search") return halaman([proses(ls)]);
    if (path === "/api/v1/redesain/bukti/search") return halaman(opts.bukti ?? []);
    throw new Error(`POST tak terduga ${path}`);
  });
}

async function renderHalaman(sp: Record<string, string> = {}) {
  const ui = await DetailMasalahPage({
    params: Promise.resolve({ id: "m1" }),
    searchParams: Promise.resolve(sp),
  });
  return render(ui);
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ accessToken: "tok", user: { groups: ["tim-kajian"] } });
});

describe("halaman detail masalah", () => {
  it("merender header identitas dan bagian alur default", async () => {
    siapkan();
    await renderHalaman();
    expect(screen.getByText("M-K01-01")).toBeInTheDocument();
    expect(screen.getByText("K-01 — Beban administrasi")).toBeInTheDocument();
    expect(screen.getByText("TA 2026/27")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Alur" })).toBeInTheDocument();
    expect(screen.getByText("Penyusunan jadwal")).toBeInTheDocument();
  });

  it("merender langkah terurut urutan walau respons acak", async () => {
    siapkan();
    await renderHalaman();
    const items = screen.getAllByRole("listitem");
    const teks = items.map((li) => li.textContent ?? "");
    expect(teks[0]).toContain("Satu");
    expect(teks[1]).toContain("Dua");
    expect(teks[2]).toContain("Tiga");
  });

  it("?bagian= tak dikenal jatuh ke bagian alur", async () => {
    siapkan();
    expect(pilihBagian("tidak-ada").kunci).toBe("alur");
    expect(pilihBagian(undefined).kunci).toBe("alur");
    expect(BAGIAN_DETAIL_MASALAH[0].kunci).toBe("alur");
    await renderHalaman({ bagian: "tidak-ada" });
    expect(screen.getByRole("region", { name: "Alur" })).toBeInTheDocument();
  });

  it("koreksi ber-konfirmasi_id berlabel Konfirmasi, tanpa berlabel Tim, tanpa nama", async () => {
    siapkan({
      langkah: [langkah("l1", 1, "Satu")],
      koreksi: [
        koreksi("a", "2026-11-01T10:00:00Z", "kf1"),
        koreksi("b", "2026-11-01T11:00:00Z", null),
      ],
    });
    await renderHalaman();
    const baris = screen.getAllByRole("row").filter((r) => r.textContent?.includes("isi-"));
    expect(baris).toHaveLength(2);
    expect(within(baris[0]).getByText("Konfirmasi")).toBeInTheDocument();
    expect(within(baris[0]).getByText("O-0001")).toBeInTheDocument();
    expect(within(baris[1]).getByText("Tim")).toBeInTheDocument();
  });

  it("GET /proses/{id} 403 melempar ApiError", async () => {
    siapkan({ prosesGet: 403 });
    await expect(fetchAlurMasalah("tok", "m1")).rejects.toBeInstanceOf(ApiError);
    await expect(renderHalaman()).rejects.toBeInstanceOf(ApiError);
  });

  it("masalah 404 → notFound", async () => {
    get.mockResolvedValue(resp(null, 404));
    await expect(renderHalaman()).rejects.toThrow();
  });
});

describe("FormProses", () => {
  const sekolah = [
    { id: "s1", nama: "SD Contoh" },
    { id: "s2", nama: "SD Lain" },
  ] as never;

  it("masalah ber-sekolah → pilihan sekolah terkunci", () => {
    render(
      <FormProses
        masalahId="m1"
        sekolahTerkunci="s1"
        sekolah={sekolah}
        periodeBawaan="TA"
        accessToken="t"
      />,
    );
    const sel = screen.getByLabelText("Sekolah proses") as HTMLSelectElement;
    expect(sel).toBeDisabled();
    expect(sel.value).toBe("s1");
    expect(within(sel).queryByText("SD Lain")).toBeNull();
  });

  it("masalah tanpa sekolah → pilihan bebas", () => {
    render(
      <FormProses
        masalahId="m1"
        sekolahTerkunci={null}
        sekolah={sekolah}
        periodeBawaan="TA"
        accessToken="t"
      />,
    );
    expect(screen.getByLabelText("Sekolah proses")).not.toBeDisabled();
  });

  it("tambah proses dijawab 422 → toast gagal", async () => {
    post.mockResolvedValue(resp(null, 422));
    render(
      <FormProses
        masalahId="m1"
        sekolahTerkunci="s1"
        sekolah={sekolah}
        periodeBawaan="TA"
        accessToken="t"
      />,
    );
    fireEvent.change(screen.getByLabelText("Nama proses"), { target: { value: "Proses X" } });
    fireEvent.click(screen.getByRole("button", { name: "Tambah proses" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      "/api/v1/redesain/proses",
      expect.objectContaining({
        body: { masalah_id: "m1", sekolah_id: "s1", periode: "TA", nama_proses: "Proses X" },
      }),
    );
    expect(notifySukses).not.toHaveBeenCalled();
  });
});

describe("FormKoreksi", () => {
  it("tambah koreksi Tim mengirim {isi} tanpa konfirmasi_id", async () => {
    post.mockResolvedValue(resp(koreksi("n", "2026-11-01T12:00:00Z", null), 201));
    render(<FormKoreksi langkahId="l1" accessToken="t" />);
    fireEvent.change(screen.getByLabelText("Isi koreksi"), { target: { value: "Perlu diralat" } });
    fireEvent.click(screen.getByRole("button", { name: "Tambah koreksi Tim" }));
    await waitFor(() => expect(notifySukses).toHaveBeenCalled());
    const [path, opts] = post.mock.calls[0];
    expect(path).toBe("/api/v1/redesain/langkah/{langkah_id}/koreksi");
    expect(opts.body).toEqual({ isi: "Perlu diralat" });
    expect("konfirmasi_id" in opts.body).toBe(false);
    expect(refresh).toHaveBeenCalled();
  });
});
