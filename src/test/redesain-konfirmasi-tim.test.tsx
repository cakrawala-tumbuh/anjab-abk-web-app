import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, POST: post }),
}));
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));
const notifyGagal = vi.fn();
const notifySukses = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
  notifySukses: (m: string) => notifySukses(m),
}));
vi.mock("@/components/pilih-kode-orang", () => ({
  PilihKodeOrang: ({ value, onChange }: { value: string; onChange: (k: string) => void }) => (
    <select aria-label="Kode orang" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">—</option>
      <option value="O-0007">O-0007</option>
    </select>
  ),
}));

import EskalasiPage from "@/app/(auth)/redesain/eskalasi/page";
import { BagianKonfirmasi } from "@/app/(auth)/redesain/masalah/[id]/bagian-konfirmasi";
import { fetchKonfirmasiMasalah } from "@/app/(auth)/redesain/masalah/[id]/data-konfirmasi";
import { BAGIAN_DETAIL_MASALAH } from "@/app/(auth)/redesain/masalah/[id]/registry";
import { ApiError } from "@/lib/api/errors";
import type { KonfirmasiDaftarRead, MasalahRead } from "@/lib/api/schema";
import { bisaAngkatMasalah, saringKonfirmasi } from "@/lib/redesain-konfirmasi-tim";

vi.mock("@/lib/auth/auth", () => ({ auth: async () => ({ accessToken: "tok" }) }));

const resp = (data: unknown, status = 200, error?: unknown) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : (error ?? { error: { code: "X", message: "ditolak" } }),
  response: { status, headers: { get: () => "req-1" } },
});
const halaman = (items: unknown[]) => resp({ items, total: items.length, limit: 200, offset: 0 });

const masalah = { id: "m1", kode: "M-K01-01", sekolah_id: "s1" } as MasalahRead;
const sekolah = [{ id: "s1", nama: "SD Contoh" }] as never[];
const konteks = [{ id: "c1", kode: "K01", tema: "Tema satu" }];

const konf = (p: Partial<KonfirmasiDaftarRead> = {}): KonfirmasiDaftarRead =>
  ({
    id: "f1",
    masalah_id: "m1",
    kode_orang: "O-0001",
    sekolah_id: "s1",
    sumber: "daring",
    peran: "Guru",
    tanggal: "2026-11-01",
    status: "terkirim",
    dikirim_pada: "2026-11-01T00:00:00Z",
    dugaan_diperlihatkan: "Ya",
    kesesuaian: "Ya",
    masalah_baru: null,
    k1: "Tinggi",
    k2: "Sedang",
    k3: "Rendah",
    k4: "Belum tahu",
    indikasi_risiko: "Tidak terlihat",
    menggantikan_id: null,
    digantikan: false,
    ...p,
  }) as KonfirmasiDaftarRead;

function pasangPost(daftar: KonfirmasiDaftarRead[]) {
  post.mockImplementation(async (path: string) => {
    if (path === "/api/v1/redesain/konfirmasi/search") return halaman(daftar);
    if (path === "/api/v1/redesain/konteks") return halaman(konteks);
    return resp(null, 404);
  });
  get.mockImplementation(async (path: string) => {
    if (path === "/api/v1/redesain/konteks") return halaman(konteks);
    return resp(null, 404);
  });
}
async function renderBagian() {
  render(await BagianKonfirmasi({ masalah, sekolah, accessToken: "tok" }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("bagian konfirmasi", () => {
  it("terdaftar di registry", () => {
    expect(BAGIAN_DETAIL_MASALAH.map((b) => b.kunci)).toContain("konfirmasi");
  });

  it("fungsi murni: saring digantikan dan syarat angkat", () => {
    const d = [{ digantikan: true }, { digantikan: false }];
    expect(saringKonfirmasi(d, false)).toHaveLength(1);
    expect(saringKonfirmasi(d, true)).toHaveLength(2);
    expect(bisaAngkatMasalah({ status: "terkirim", masalah_baru: "x" })).toBe(true);
    expect(bisaAngkatMasalah({ status: "draf", masalah_baru: "x" })).toBe(false);
    expect(bisaAngkatMasalah({ status: "terkirim", masalah_baru: null })).toBe(false);
  });

  it("menyembunyikan record digantikan secara default; toggle menampilkan keduanya", async () => {
    pasangPost([konf(), konf({ id: "f2", kode_orang: "O-0002", digantikan: true })]);
    await renderBagian();
    expect(
      post.mock.calls.find((c) => c[0].endsWith("/konfirmasi/search"))![1].body.domain,
    ).toEqual([["masalah_id", "=", "m1"]]);
    expect(screen.getByText("O-0001")).toBeInTheDocument();
    expect(screen.queryByText("O-0002")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Tampilkan versi digantikan/ }));
    expect(screen.getByText("O-0002")).toBeInTheDocument();
    expect(screen.getByText("Digantikan")).toBeInTheDocument();
  });

  it("tabel tidak memuat tombol ubah/hapus", async () => {
    pasangPost([konf()]);
    await renderBagian();
    expect(screen.queryByRole("button", { name: /ubah|hapus|edit/i })).not.toBeInTheDocument();
  });

  it("membuka baris memuat detail dari GET konfirmasi/{id}", async () => {
    pasangPost([konf()]);
    await renderBagian();
    get.mockResolvedValueOnce(resp({ ...konf(), koreksi: "Koreksi lengkap", cerita_sebelum: "C" }));
    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    expect(await screen.findByText("Koreksi lengkap")).toBeInTheDocument();
    expect(get.mock.calls.at(-1)![1].params.path.konfirmasi_id).toBe("f1");
  });

  it("search konfirmasi 403 melempar ApiError", async () => {
    post.mockResolvedValue(resp(null, 403));
    await expect(fetchKonfirmasiMasalah("tok", "m1")).rejects.toBeInstanceOf(ApiError);
  });

  it("tombol angkat masalah tidak tampil untuk draf atau tanpa masalah_baru", async () => {
    pasangPost([
      konf({ id: "a", status: "draf", masalah_baru: "ada" }),
      konf({ id: "b", kode_orang: "O-0002", masalah_baru: null }),
    ]);
    await renderBagian();
    expect(screen.queryByRole("button", { name: "Angkat masalah" })).not.toBeInTheDocument();
  });

  it("angkat masalah 201 mengarahkan ke masalah baru", async () => {
    pasangPost([konf({ masalah_baru: "Masalah X" })]);
    await renderBagian();
    fireEvent.click(screen.getByRole("button", { name: "Angkat masalah" }));
    const dlg = within(screen.getByRole("dialog"));
    fireEvent.change(dlg.getByLabelText("Konteks"), { target: { value: "c1" } });
    fireEvent.change(dlg.getByLabelText("Rumusan hipotesis"), { target: { value: "Hipotesis" } });
    post.mockResolvedValueOnce(resp({ id: "baru-1" }, 201));
    fireEvent.click(dlg.getByRole("button", { name: "Angkat masalah" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/redesain/masalah/baru-1"));
    const c = post.mock.calls.at(-1)!;
    expect(c[0]).toBe("/api/v1/redesain/konfirmasi/{konfirmasi_id}/angkat-masalah");
    expect(c[1].body).toEqual({ konteks_id: "c1", rumusan_hipotesis: "Hipotesis" });
  });

  it("angkat masalah 422 → toast gagal, tidak navigasi", async () => {
    pasangPost([konf({ masalah_baru: "Masalah X" })]);
    await renderBagian();
    fireEvent.click(screen.getByRole("button", { name: "Angkat masalah" }));
    const dlg = within(screen.getByRole("dialog"));
    fireEvent.change(dlg.getByLabelText("Konteks"), { target: { value: "c1" } });
    fireEvent.change(dlg.getByLabelText("Rumusan hipotesis"), { target: { value: "H" } });
    post.mockResolvedValueOnce(resp(null, 422));
    fireEvent.click(dlg.getByRole("button", { name: "Angkat masalah" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
  });

  it("form luring mengirim kode_orang dari PilihKodeOrang dan masalah_id", async () => {
    pasangPost([]);
    await renderBagian();
    fireEvent.click(screen.getByRole("button", { name: "Catat isian luring" }));
    const dlg = within(screen.getByRole("dialog"));
    fireEvent.change(dlg.getByLabelText("Kode orang"), { target: { value: "O-0007" } });
    fireEvent.change(dlg.getByLabelText("Jabatan/peran"), { target: { value: "Guru" } });
    post.mockResolvedValueOnce(resp({ id: "n1" }, 201));
    fireEvent.click(dlg.getByRole("button", { name: "Simpan isian luring" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    const c = post.mock.calls.at(-1)!;
    expect(c[0]).toBe("/api/v1/redesain/konfirmasi/luring");
    expect(c[1].body.kode_orang).toBe("O-0007");
    expect(c[1].body.masalah_id).toBe("m1");
    expect(c[1].body.sekolah_id).toBe("s1");
  });

  it("form luring 422 menyebut field yang kurang dan form tetap terbuka", async () => {
    pasangPost([]);
    await renderBagian();
    fireEvent.click(screen.getByRole("button", { name: "Catat isian luring" }));
    fireEvent.change(screen.getByLabelText("Kode orang"), { target: { value: "O-0007" } });
    post.mockResolvedValueOnce(
      resp(null, 422, {
        error: "VALIDATION_ERROR",
        message: "x",
        details: [{ loc: ["body", "k1"] }, { loc: ["body", "kesesuaian"] }],
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Simpan isian luring" }));
    const alert = await screen.findByText(/Belum lengkap: K1, Kesesuaian dugaan/);
    expect(alert).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(notifyGagal).toHaveBeenCalled();
  });
});

describe("form luring: kode orang wajib dipilih", () => {
  it("Simpan tanpa memilih kode orang → tidak ada POST luring, galat inline tampil", async () => {
    pasangPost([]);
    await renderBagian();
    fireEvent.click(screen.getByRole("button", { name: "Catat isian luring" }));
    const sebelum = post.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Simpan isian luring" }));
    expect(await screen.findByText("Kode orang wajib dipilih.")).toBeInTheDocument();
    expect(post.mock.calls.length).toBe(sebelum);
    expect(post.mock.calls.some((c) => c[0] === "/api/v1/redesain/konfirmasi/luring")).toBe(false);
  });
});

describe("halaman eskalasi", () => {
  it("mengirim domain eskalasi_pada != null, terbaru dulu, dan menampilkan badge", async () => {
    post.mockImplementation(async (path: string) => {
      if (path === "/api/v1/redesain/masalah/search")
        return halaman([
          {
            id: "m9",
            kode: "M-9",
            konteks_id: "c1",
            sekolah_id: "s1",
            eskalasi_pada: "2026-11-01",
          },
        ]);
      return halaman(path.includes("konteks") ? konteks : []);
    });
    get.mockImplementation(async (path: string) =>
      halaman(path.includes("konteks") ? konteks : [{ id: "s1", nama: "SD Contoh" }]),
    );
    render(await EskalasiPage({ searchParams: Promise.resolve({}) }));
    const c = post.mock.calls.find((x) => x[0] === "/api/v1/redesain/masalah/search")!;
    expect(c[1].body.domain).toEqual([["eskalasi_pada", "!=", null]]);
    expect(c[1].body.order).toEqual([["eskalasi_pada", "desc"]]);
    expect(await screen.findByText("Eskalasi", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("M-9")).toBeInTheDocument();
  });
});

describe("tabel konfirmasi: format Dikirim dan geser horizontal", () => {
  it("menampilkan Dikirim sebagai YYYY-MM-DD HH:MM, bukan ISO mentah", async () => {
    pasangPost([konf({ dikirim_pada: "2026-11-02T17:37:34.248967+07:00" })]);
    await renderBagian();
    expect(screen.getByText("2026-11-02 17:37")).toBeInTheDocument();
    expect(screen.queryByText(/248967/)).not.toBeInTheDocument();
  });

  it("menampilkan em-dash bila dikirim_pada null", async () => {
    pasangPost([konf({ dikirim_pada: null })]);
    await renderBagian();
    const sel = screen.getAllByRole("cell").find((c) => c.textContent === "—");
    expect(sel).toBeDefined();
  });

  it(".table-container memakai overflow-x-auto, bukan overflow-hidden", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const aturan = /\.table-container\s*\{[^}]*\}/.exec(css)![0];
    expect(aturan).toContain("overflow-x-auto");
    expect(aturan).not.toContain("overflow-hidden");
    expect(aturan).toContain("rounded-lg");
  });
});
