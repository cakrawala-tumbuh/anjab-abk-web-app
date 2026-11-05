import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
import { KasusForm } from "@/app/(auth)/narasi/kasus/kasus-form";
import { RevisiManualForm } from "@/app/(auth)/narasi/kasus/revisi-manual-form";
import { RiwayatKasus } from "@/app/(auth)/narasi/kasus/riwayat-kasus";
import { KasusTabel } from "@/app/(auth)/narasi/kasus/kasus-tabel";
import KasusNarasiPage from "@/app/(auth)/narasi/kasus/page";
import DetailKasusPage from "@/app/(auth)/narasi/kasus/[id]/page";
import { fetchSemuaSumber } from "@/app/(auth)/narasi/kasus/data";
import { bacaFilterKasus, labelStatus, validasiRevisi } from "@/lib/narasi-kasus";
import type {
  NarasiEventRead,
  NarasiKasusRead,
  NarasiSumberRingkas,
  NarasiVersiLengkap,
} from "@/lib/api/schema";

const kasus = (o: Partial<NarasiKasusRead> = {}): NarasiKasusRead => ({
  id: "k-1",
  instrument_id: "DCS",
  field_key: "uraian",
  peran_ref: "KEPALA",
  periode: "2026/27",
  sekolah_id: null,
  assignment_ref: null,
  target_subject_ref: null,
  konteks_kode: null,
  narrative_kind: "F1_FORMAL",
  status: "SOURCE_CHECKED",
  intended_use: "laporan",
  permission_scope: "internal",
  sensitivity_class: "NONPRIBADI",
  dibuat_oleh: "u",
  created_at: "2026-11-05T00:00:00Z",
  updated_at: "2026-11-05T00:00:00Z",
  ...o,
});
const sumber = (o: Partial<NarasiSumberRingkas> = {}): NarasiSumberRingkas => ({
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
  ...o,
});
const versi = (o: Partial<NarasiVersiLengkap> = {}): NarasiVersiLengkap => ({
  id: "v-1",
  narasi_id: "k-1",
  revision_no: 1,
  revision_origin: "REVIEWER_EDIT",
  status_hasil: "TEAM_REVIEW",
  teks: "Teks versi satu",
  supersedes_id: null,
  ai_run_id: null,
  output_hash: null,
  metadata_ai: null,
  dibuat_oleh: "u",
  created_at: "2026-11-05T01:00:00Z",
  sumber: [],
  ...o,
});
const event = (o: Partial<NarasiEventRead> = {}): NarasiEventRead => ({
  id: "e-1",
  narasi_id: "k-1",
  narasi_versi_id: "v-1",
  actor_key: "a",
  actor_role: "REVIEWER",
  event_kind: "TEAM_APPROVE",
  dari_status: "TEAM_REVIEW",
  ke_status: "TEAM_VERIFIED",
  event_notes: null,
  event_at: "2026-11-05T02:00:00Z",
  ...o,
});

const ok = (data: unknown, status = 200) => ({
  data,
  response: { status, headers: { get: () => "r1" } },
});
const gagal = (status: number, error: string, message: string, details?: unknown[]) => ({
  data: undefined,
  error: { error, message, details },
  response: { status, headers: { get: () => "r2" } },
});

beforeEach(() => {
  [push, refresh, get, post, notifyGagal, notifySukses].forEach((m) => m.mockReset());
  vi.mocked(auth).mockReset();
  vi.mocked(auth).mockResolvedValue({
    accessToken: "tok",
    user: { groups: ["tim-kajian"] },
  } as never);
});

function isiKasus(ekstra: Record<string, string> = {}) {
  const nilai: Record<string, string> = {
    Instrumen: "DCS",
    "Kunci isian": "uraian",
    Peran: "KEPALA",
    Periode: "2026/27",
    "Tujuan pemakaian": "laporan",
    "Lingkup izin": "internal",
    ...ekstra,
  };
  for (const [l, v] of Object.entries(nilai)) {
    fireEvent.change(screen.getByLabelText(l), { target: { value: v } });
  }
}

describe("KasusForm", () => {
  it("mengirim kolom opsional kosong sebagai null dan nilai tetap", async () => {
    post.mockResolvedValue(ok(kasus({ id: "baru" }), 201));
    render(<KasusForm accessToken="tok" />);
    isiKasus();
    fireEvent.click(screen.getByRole("button", { name: "Buat kasus" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, opsi] = post.mock.calls[0];
    expect(path).toBe("/api/v1/narasi/kasus");
    expect(opsi.body).toEqual({
      instrument_id: "DCS",
      field_key: "uraian",
      peran_ref: "KEPALA",
      periode: "2026/27",
      sekolah_id: null,
      assignment_ref: null,
      target_subject_ref: null,
      konteks_kode: null,
      narrative_kind: "F1_FORMAL",
      intended_use: "laporan",
      permission_scope: "internal",
      sensitivity_class: "NONPRIBADI",
    });
    expect(opsi.headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/narasi/kasus/baru"));
    expect(notifySukses).toHaveBeenCalled();
  });

  it("kolom opsional terisi dikirim; jenis dan kepekaan hanya-baca", async () => {
    post.mockResolvedValue(ok(kasus(), 201));
    render(<KasusForm accessToken="tok" />);
    expect(screen.getByLabelText("Jenis narasi")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Kelas kepekaan")).toHaveAttribute("readonly");
    isiKasus({ "Sekolah (opsional)": "sek-1" });
    fireEvent.click(screen.getByRole("button", { name: "Buat kasus" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body.sekolah_id).toBe("sek-1");
  });

  it("field wajib kosong tidak terkirim", async () => {
    render(<KasusForm accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Buat kasus" }));
    expect((await screen.findAllByText("Wajib diisi.")).length).toBe(6);
    expect(post).not.toHaveBeenCalled();
  });

  it("409 narasi_lingkup_ganda tampil sebagai pesan dengan tautan penelusuran", async () => {
    post.mockResolvedValue(gagal(409, "narasi_lingkup_ganda", "Lingkup sudah ada."));
    render(<KasusForm accessToken="tok" />);
    isiKasus();
    fireEvent.click(screen.getByRole("button", { name: "Buat kasus" }));
    expect(await screen.findByText(/Lingkup sudah ada/)).toBeInTheDocument();
    const tautan = screen.getByRole("link", { name: /Telusuri/ });
    expect(tautan).toHaveAttribute("href", "/narasi/kasus?instrument_id=DCS&periode=2026%2F27");
    expect(push).not.toHaveBeenCalled();
    expect(notifySukses).not.toHaveBeenCalled();
    expect(notifyGagal).toHaveBeenCalled();
  });
});

describe("RevisiManualForm", () => {
  const props = { kasusId: "k-1", supersedesId: "v-9", sumberOpsi: [sumber()], accessToken: "tok" };
  const isiRevisi = () => {
    fireEvent.change(screen.getByLabelText("Teks revisi"), { target: { value: "Teks baru" } });
    fireEvent.change(screen.getByLabelText("Sumber 1"), { target: { value: "s-1" } });
  };

  it("mengirim supersedes_id dan sumber", async () => {
    post.mockResolvedValue(ok(versi(), 201));
    render(<RevisiManualForm {...props} />);
    isiRevisi();
    fireEvent.change(screen.getByLabelText("Hubungan 1"), { target: { value: "CONTEXT" } });
    fireEvent.change(screen.getByLabelText("Kutipan 1"), { target: { value: "hlm 3" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan revisi" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, opsi] = post.mock.calls[0];
    expect(path).toBe("/api/v1/narasi/kasus/{narasi_id}/revisi");
    expect(opsi.params.path.narasi_id).toBe("k-1");
    expect(opsi.body).toEqual({
      teks: "Teks baru",
      sumber: [{ sumber_id: "s-1", source_span: "hlm 3", basis_relation: "CONTEXT" }],
      supersedes_id: "v-9",
    });
    expect(opsi.headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("tanpa sumber tidak terkirim", async () => {
    render(<RevisiManualForm {...props} />);
    fireEvent.change(screen.getByLabelText("Teks revisi"), { target: { value: "Teks" } });
    fireEvent.click(screen.getByRole("button", { name: "Hapus sumber 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan revisi" }));
    expect(await screen.findByText(/Minimal satu sumber/)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("baris sumber belum dipilih tidak terkirim", async () => {
    render(<RevisiManualForm {...props} />);
    fireEvent.change(screen.getByLabelText("Teks revisi"), { target: { value: "Teks" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan revisi" }));
    expect(await screen.findByText("Pilih sumber.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("409 versi_basi mempertahankan teks dan menawarkan muat ulang", async () => {
    post.mockResolvedValue(gagal(409, "versi_basi", "supersedes_id basi."));
    render(<RevisiManualForm {...props} />);
    isiRevisi();
    fireEvent.click(screen.getByRole("button", { name: "Simpan revisi" }));
    expect(await screen.findByText(/sudah berubah/)).toBeInTheDocument();
    expect(screen.getByLabelText("Teks revisi")).toHaveValue("Teks baru");
    fireEvent.click(screen.getByRole("button", { name: /Muat ulang/ }));
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByLabelText("Teks revisi")).toHaveValue("Teks baru");
    expect(notifySukses).not.toHaveBeenCalled();
  });

  it("validasiRevisi menolak teks melebihi batas", () => {
    const e = validasiRevisi({
      teks: "x".repeat(200_001),
      sumber: [{ sumber_id: "s", source_span: "", basis_relation: "DIRECT" }],
    });
    expect(e.teks).toMatch(/melebihi/);
  });
});

describe("RiwayatKasus", () => {
  it("menggabungkan versi dan event urut waktu", () => {
    render(
      <RiwayatKasus
        versi={[
          versi({ id: "v-2", revision_no: 2, created_at: "2026-11-05T03:00:00Z", teks: "DUA" }),
          versi({ id: "v-1", created_at: "2026-11-05T01:00:00Z", teks: "SATU" }),
        ]}
        event={[event({ event_at: "2026-11-05T02:00:00Z" })]}
      />,
    );
    const butir = screen.getAllByRole("listitem").filter((li) => li.closest("ol"));
    const teks = butir.map((li) => li.textContent ?? "");
    const iSatu = teks.findIndex((t) => t.includes("SATU"));
    const iEvent = teks.findIndex((t) => t.includes("Event TEAM_APPROVE"));
    const iDua = teks.findIndex((t) => t.includes("DUA"));
    expect(iSatu).toBeLessThan(iEvent);
    expect(iEvent).toBeLessThan(iDua);
  });

  it("TEAM_VERIFIED tanpa kata rilis, final, atau fakta", () => {
    render(<RiwayatKasus versi={[versi({ status_hasil: "TEAM_VERIFIED" })]} event={[event()]} />);
    const isi = screen.getByRole("list", { name: "Riwayat kasus" }).textContent ?? "";
    expect(isi).toContain("TEAM_VERIFIED");
    expect(labelStatus("TEAM_VERIFIED")).not.toMatch(/rilis|dirilis|final|fakta|lepas/i);
    expect(isi).not.toMatch(/rilis|dirilis|final|fakta/i);
  });

  it("riwayat kosong menampilkan keterangan", () => {
    render(<RiwayatKasus versi={[]} event={[]} />);
    expect(screen.getByText(/Belum ada versi/)).toBeInTheDocument();
  });
});

describe("pemuatan data", () => {
  it("gagal memuat daftar sumber melempar, bukan daftar kosong", async () => {
    get.mockResolvedValue(gagal(401, "unauthorized", "Token invalid."));
    await expect(fetchSemuaSumber("tok")).rejects.toMatchObject({ status: 401 });
  });

  it("halaman detail melempar bila daftar sumber gagal", async () => {
    get.mockImplementation(async (path: string) => {
      if (path === "/api/v1/narasi/kasus/{narasi_id}")
        return ok({ ...kasus(), versi_terbaru: null });
      if (path.endsWith("/riwayat")) return ok({ versi: [], event: [] });
      return gagal(500, "internal", "Gagal.");
    });
    await expect(DetailKasusPage({ params: Promise.resolve({ id: "k-1" }) })).rejects.toMatchObject(
      { status: 500 },
    );
  });

  it("halaman detail meneruskan versi terbaru sebagai supersedes_id", async () => {
    get.mockImplementation(async (path: string) => {
      if (path === "/api/v1/narasi/kasus/{narasi_id}")
        return ok({ ...kasus(), versi_terbaru: versi({ id: "v-7" }) });
      if (path.endsWith("/riwayat")) return ok({ versi: [versi({ id: "v-7" })], event: [] });
      return ok({ items: [sumber()], total: 1, limit: 100, offset: 0 });
    });
    post.mockResolvedValue(ok(versi(), 201));
    const el = await DetailKasusPage({ params: Promise.resolve({ id: "k-1" }) });
    render(el);
    fireEvent.change(screen.getByLabelText("Teks revisi"), { target: { value: "T" } });
    fireEvent.change(screen.getByLabelText("Sumber 1"), { target: { value: "s-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan revisi" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body.supersedes_id).toBe("v-7");
  });

  it("detail 404 menjadi notFound", async () => {
    get.mockResolvedValue(gagal(404, "not_found", "Tidak ada."));
    await expect(DetailKasusPage({ params: Promise.resolve({ id: "x" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});

describe("daftar kasus", () => {
  it("membedakan kosong, kosong-karena-filter, dan gagal", async () => {
    get.mockResolvedValue(ok({ items: [], total: 0, limit: 20, offset: 0 }));
    render(await KasusNarasiPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Belum ada kasus narasi.")).toBeInTheDocument();
    document.body.innerHTML = "";
    render(await KasusNarasiPage({ searchParams: Promise.resolve({ status: "AI_DRAFT" }) }));
    expect(screen.getByText(/Tidak ada kasus yang cocok/)).toBeInTheDocument();
    expect(get.mock.calls[1][1].params.query).toMatchObject({ status: "AI_DRAFT" });
    get.mockResolvedValue(gagal(500, "internal", "Gagal."));
    await expect(KasusNarasiPage({ searchParams: Promise.resolve({}) })).rejects.toMatchObject({
      status: 500,
    });
  });

  it("tabel menampilkan status enum plus keterangan", () => {
    render(<KasusTabel items={[kasus()]} />);
    expect(screen.getByText(/SOURCE_CHECKED — /)).toBeInTheDocument();
  });

  it("filter status di luar kosakata diabaikan", () => {
    expect(bacaFilterKasus({ status: "NGAWUR", periode: " 2026/27 " })).toEqual({
      status: null,
      instrument_id: null,
      periode: "2026/27",
    });
  });
});
