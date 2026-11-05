import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn(), GRUP_TIM_KAJIAN: "tim-kajian" }));
const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ GET: get, POST: post }) }));
const notifyGagal = vi.fn();
const notifySukses = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
  notifySukses: (m: string) => notifySukses(m),
}));

import { auth } from "@/lib/auth/auth";
import TinjauanNarasiPage from "@/app/(auth)/narasi/antrean/[narasi_id]/page";
import { AksiTinjauan } from "@/app/(auth)/narasi/antrean/[narasi_id]/aksi-tinjauan";
import { PanelDraf } from "@/app/(auth)/narasi/antrean/[narasi_id]/panel-draf";
import { PanelSumber } from "@/app/(auth)/narasi/antrean/[narasi_id]/panel-sumber";
import { bodyTinjauan, pesanSelesaiTinjauan } from "@/lib/narasi-tinjauan";
import type { AntreanDetailRead, NarasiEventRead, NarasiSumberRingkas } from "@/lib/api/schema";

const detail = (o: Partial<AntreanDetailRead> = {}): AntreanDetailRead => ({
  narasi_id: "k-1",
  instrument_id: "DCS",
  field_key: "uraian",
  peran_ref: "KEPALA",
  periode: "2026/27",
  narrative_kind: "F1_FORMAL",
  status: "TEAM_REVIEW",
  versi_id: "v-3",
  revision_no: 3,
  revision_origin: "REVIEWER_EDIT",
  teks: "Teks draf tiga",
  ai_run_id: null,
  sumber: [
    {
      sumber_id: "s-1",
      judul: "Pedoman",
      versi: "v1",
      source_span: "hlm 3",
      source_hash: "abc123",
      basis_relation: "DIRECT",
      teks: "Isi sumber pedoman",
    },
  ],
  contradictions: [],
  unknowns: ["Belum jelas X"],
  missing_facts: [],
  claim_to_source_map: null,
  recommended_review_scope: null,
  paparan: "TIDAK_BERLAKU",
  ...o,
});
const sumberOpsi = (): NarasiSumberRingkas[] => [
  {
    id: "s-1",
    judul: "Pedoman",
    jenis: "SINTETIS",
    versi: "v1",
    periode: "2026/27",
    teks_hash: "h",
    izin_ai: false,
    izin_catatan: null,
    menggantikan_id: null,
    dibuat_oleh: "u",
    created_at: "2026-11-05T00:00:00Z",
  },
];
const event = (ke: NarasiEventRead["ke_status"] = "TEAM_VERIFIED"): NarasiEventRead => ({
  id: "e-1",
  narasi_id: "k-1",
  narasi_versi_id: "v-3",
  actor_key: "a",
  actor_role: "REVIEWER",
  event_kind: "TEAM_APPROVE",
  dari_status: "TEAM_REVIEW",
  ke_status: ke,
  event_notes: null,
  event_at: "2026-11-05T02:00:00Z",
});
const ok = (data: unknown, status = 200) => ({
  data,
  response: { status, headers: { get: () => "r1" } },
});
const gagal = (status: number, error: string, message: string) => ({
  data: undefined,
  error: { error, message },
  response: { status, headers: { get: () => "r2" } },
});

const props = {
  narasiId: "k-1",
  versiId: "v-3",
  adaTeks: true,
  sumberOpsi: sumberOpsi(),
  accessToken: "tok",
};
const confirmMock = vi.fn();

beforeEach(() => {
  [push, refresh, get, post, notifyGagal, notifySukses].forEach((m) => m.mockReset());
  vi.mocked(auth).mockReset();
  vi.mocked(auth).mockResolvedValue({
    accessToken: "tok",
    user: { groups: ["tim-kajian"] },
  } as never);
  confirmMock.mockReset().mockReturnValue(true);
  vi.spyOn(window, "confirm").mockImplementation((m) => confirmMock(m));
});

const klik = (nama: string) => fireEvent.click(screen.getByRole("button", { name: nama }));
const isiKoreksi = () => {
  klik("Koreksi");
  fireEvent.change(screen.getByLabelText("Teks koreksi"), { target: { value: "Teks baru" } });
  fireEvent.change(screen.getByLabelText("Sumber 1"), { target: { value: "s-1" } });
};

describe("AksiTinjauan: positif", () => {
  it("TERIMA mengirim body kontrak setelah konfirmasi, lalu kembali ke antrean dengan ke_status", async () => {
    post.mockResolvedValue(ok(event(), 201));
    render(<AksiTinjauan {...props} />);
    klik("Terima");
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(confirmMock).toHaveBeenCalledTimes(1);
    const [path, opsi] = post.mock.calls[0];
    expect(path).toBe("/api/v1/narasi/kasus/{narasi_id}/tinjauan");
    expect(opsi.params.path.narasi_id).toBe("k-1");
    expect(opsi.body).toEqual({ aksi: "TERIMA", narasi_versi_id: "v-3" });
    expect(opsi.headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/narasi/antrean"));
    expect(notifySukses.mock.calls[0][0]).toContain("TEAM_VERIFIED");
  });

  it("TOLAK dan BUTUH_SUMBER mengirim catatan dan versi yang ditampilkan", async () => {
    post.mockResolvedValue(ok(event("NEED_FACT"), 201));
    render(<AksiTinjauan {...props} versiId="v-9" />);
    fireEvent.change(screen.getByLabelText(/Catatan/), { target: { value: "Tidak sesuai" } });
    klik("Tolak");
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1].body).toEqual({
      aksi: "TOLAK",
      narasi_versi_id: "v-9",
      catatan: "Tidak sesuai",
    });
    await waitFor(() => expect(push).toHaveBeenCalled());
    klik("Butuh sumber");
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[1][1].body).toMatchObject({
      aksi: "BUTUH_SUMBER",
      narasi_versi_id: "v-9",
      catatan: "Tidak sesuai",
    });
  });

  it("KOREKSI mengirim teks dan sumber", async () => {
    post.mockResolvedValue(ok(event("TEAM_REVIEW"), 201));
    render(<AksiTinjauan {...props} />);
    isiKoreksi();
    fireEvent.change(screen.getByLabelText("Hubungan 1"), { target: { value: "CONTEXT" } });
    fireEvent.change(screen.getByLabelText("Kutipan 1"), { target: { value: "hlm 4" } });
    klik("Kirim koreksi");
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1].body).toEqual({
      aksi: "KOREKSI",
      narasi_versi_id: "v-3",
      teks: "Teks baru",
      sumber: [{ sumber_id: "s-1", source_span: "hlm 4", basis_relation: "CONTEXT" }],
    });
  });

  it("tidak ada aksi massal", () => {
    render(<AksiTinjauan {...props} />);
    expect(screen.queryByRole("button", { name: /semua/i })).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});

describe("AksiTinjauan: negatif", () => {
  it.each(["Tolak", "Butuh sumber"])("%s dengan catatan pendek tidak terkirim", async (nama) => {
    render(<AksiTinjauan {...props} />);
    fireEvent.change(screen.getByLabelText(/Catatan/), { target: { value: "abc" } });
    klik(nama);
    expect(await screen.findByText(/minimal 5 karakter\./)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("KOREKSI tanpa teks tidak terkirim", async () => {
    render(<AksiTinjauan {...props} />);
    klik("Koreksi");
    fireEvent.change(screen.getByLabelText("Sumber 1"), { target: { value: "s-1" } });
    klik("Kirim koreksi");
    expect(await screen.findByText("Teks koreksi wajib diisi.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("KOREKSI tanpa sumber tidak terkirim", async () => {
    render(<AksiTinjauan {...props} />);
    klik("Koreksi");
    fireEvent.change(screen.getByLabelText("Teks koreksi"), { target: { value: "T" } });
    klik("Hapus sumber 1");
    klik("Kirim koreksi");
    expect(await screen.findByText("Minimal satu sumber wajib diisi.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("KOREKSI dengan baris sumber belum dipilih tidak terkirim", async () => {
    render(<AksiTinjauan {...props} />);
    klik("Koreksi");
    fireEvent.change(screen.getByLabelText("Teks koreksi"), { target: { value: "T" } });
    klik("Kirim koreksi");
    expect(await screen.findByText("Pilih sumber.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("TERIMA dibatalkan pada konfirmasi tidak terkirim", () => {
    confirmMock.mockReturnValue(false);
    render(<AksiTinjauan {...props} />);
    klik("Terima");
    expect(confirmMock).toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("TERIMA nonaktif saat versi tanpa teks", () => {
    render(<AksiTinjauan {...props} adaTeks={false} />);
    const t = screen.getByRole("button", { name: "Terima" });
    expect(t).toBeDisabled();
    fireEvent.click(t);
    expect(confirmMock).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});

describe("AksiTinjauan: galat server", () => {
  it("409 versi_basi mempertahankan isian dan menawarkan muat ulang", async () => {
    post.mockResolvedValue(gagal(409, "versi_basi", "Versi sudah basi."));
    render(<AksiTinjauan {...props} />);
    isiKoreksi();
    klik("Kirim koreksi");
    expect(await screen.findByText(/sudah berubah/)).toBeInTheDocument();
    expect(screen.getByLabelText("Teks koreksi")).toHaveValue("Teks baru");
    klik("Muat ulang versi terbaru");
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByLabelText("Teks koreksi")).toHaveValue("Teks baru");
    expect(notifySukses).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("409 narasi_tanpa_teks tampil sebagai pesan", async () => {
    post.mockResolvedValue(gagal(409, "narasi_tanpa_teks", "Tanpa teks."));
    render(<AksiTinjauan {...props} />);
    klik("Terima");
    expect(await screen.findByText(/tidak punya teks/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe("body tinjauan", () => {
  it("tidak memuat aktor untuk keempat aksi", () => {
    const kor = {
      teks: "T",
      catatan: "",
      sumber: [{ sumber_id: "s", source_span: "", basis_relation: "DIRECT" as const }],
    };
    for (const a of ["TERIMA", "KOREKSI", "TOLAK", "BUTUH_SUMBER"] as const) {
      const json = JSON.stringify(bodyTinjauan(a, "v", "catatan sah", kor));
      expect(json).not.toMatch(/actor|aktor|dibuat_oleh|user/i);
    }
  });

  it("pesan selesai TEAM_VERIFIED tidak memuat rilis, final, atau fakta", () => {
    expect(pesanSelesaiTinjauan("TEAM_VERIFIED")).not.toMatch(/rilis|final|fakta/i);
    expect(pesanSelesaiTinjauan("TEAM_VERIFIED")).toContain("TEAM_VERIFIED");
  });
});

describe("panel", () => {
  it("draf AI_DRAFT berlabel kandidat; asal lain tidak", () => {
    const { rerender } = render(<PanelDraf detail={detail({ revision_origin: "AI_DRAFT" })} />);
    expect(screen.getByRole("note")).toHaveTextContent(/Kandidat dari AI, bukan fakta/);
    rerender(<PanelDraf detail={detail()} />);
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("draf tanpa teks dinyatakan terang", () => {
    render(<PanelDraf detail={detail({ teks: null })} />);
    expect(screen.getByText("Versi ini belum punya teks.")).toBeInTheDocument();
  });

  it("sumber menampilkan judul, kutipan, hash, dan teks", () => {
    render(<PanelSumber sumber={detail().sumber} />);
    expect(screen.getByText(/Pedoman/)).toBeInTheDocument();
    expect(screen.getByText(/hlm 3/)).toBeInTheDocument();
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
    expect(screen.getByText("Isi sumber pedoman")).toBeInTheDocument();
  });
});

describe("halaman tinjauan", () => {
  const setelGet = (hasil: unknown) =>
    get.mockImplementation(async (path: string) =>
      path === "/api/v1/narasi/antrean/{narasi_id}"
        ? hasil
        : ok({ items: sumberOpsi(), total: 1, limit: 100, offset: 0 }),
    );

  it("merender draf dan sumber berdampingan (grid dua kolom) dengan aksi", async () => {
    setelGet(ok(detail()));
    const { container } = render(
      await TinjauanNarasiPage({ params: Promise.resolve({ narasi_id: "k-1" }) }),
    );
    const grid = container.querySelector(".lg\\:grid-cols-2") as HTMLElement;
    expect(within(grid).getByText("Draf")).toBeInTheDocument();
    expect(within(grid).getByText("Sumber")).toBeInTheDocument();
    expect(screen.getByText("Belum jelas X")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tolak" })).toBeInTheDocument();
  });

  it("aksi memakai versi_id yang dimuat halaman", async () => {
    setelGet(ok(detail({ versi_id: "v-77" })));
    post.mockResolvedValue(ok(event(), 201));
    render(await TinjauanNarasiPage({ params: Promise.resolve({ narasi_id: "k-1" }) }));
    klik("Terima");
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body.narasi_versi_id).toBe("v-77");
  });

  it("409 narasi_tidak_dalam_antrean tampil sebagai panel keterangan", async () => {
    setelGet(gagal(409, "narasi_tidak_dalam_antrean", "Kasus ini tidak dalam antrean."));
    render(await TinjauanNarasiPage({ params: Promise.resolve({ narasi_id: "k-1" }) }));
    expect(screen.getByRole("status")).toHaveTextContent("Kasus ini tidak dalam antrean.");
    expect(screen.queryByRole("button", { name: "Terima" })).toBeNull();
  });

  it("404 menjadi notFound", async () => {
    setelGet(gagal(404, "not_found", "Tidak ada."));
    await expect(
      TinjauanNarasiPage({ params: Promise.resolve({ narasi_id: "x" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("403 dan 500 dilempar ke error.tsx", async () => {
    setelGet(gagal(403, "forbidden", "Dilarang."));
    await expect(
      TinjauanNarasiPage({ params: Promise.resolve({ narasi_id: "x" }) }),
    ).rejects.toMatchObject({ status: 403 });
    setelGet(gagal(500, "internal", "Gagal."));
    await expect(
      TinjauanNarasiPage({ params: Promise.resolve({ narasi_id: "x" }) }),
    ).rejects.toMatchObject({ status: 500 });
  });
});
