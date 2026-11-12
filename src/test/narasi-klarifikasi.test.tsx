import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push }) }));
vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn(), GRUP_TIM_KAJIAN: "tim-kajian" }));
const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ GET: get, POST: post }) }));
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifySukses: vi.fn(),
  notifyGagal: vi.fn(),
}));

import { auth } from "@/lib/auth/auth";
import KlarifikasiIndexPage from "@/app/(auth)/narasi/klarifikasi/page";
import { AksiKlarifikasi } from "@/app/(auth)/narasi/klarifikasi/[id]/aksi-klarifikasi";
import { KlarifikasiForm } from "@/app/(auth)/narasi/klarifikasi/tambah/klarifikasi-form";
import { TerapkanKlarifikasi } from "@/app/(auth)/ai-usulan/[id]/terapkan-klarifikasi";
import { ApiError } from "@/lib/api/errors";
import type { KlarifikasiRead } from "@/lib/api/schema";
import { notifySukses } from "@/lib/notify";
import {
  ISIAN_BUAT_KOSONG,
  METADATA_KLARIFIKASI,
  aksiTersedia,
  bacaFilterKlarifikasi,
  bodyBuat,
  bodyDariUsulan,
  exposureDariPaparan,
  idKlarifikasiSudahAda,
  panelTerapkanP04Tampil,
  petakanGalatKlarifikasi,
  queryFilterKlarifikasi,
  teksMetadata,
  validasiBuat,
  validasiCatatan,
  validasiDariUsulan,
  validasiJawaban,
} from "@/lib/narasi-klarifikasi";

const ok = (data: unknown) => ({
  data,
  response: { status: 200, headers: { get: () => "r1" } },
});
const gagal = (status: number, kode = "x", details: unknown[] = []) => ({
  data: undefined,
  error: { error: kode, message: "Gagal.", details },
  response: { status, headers: { get: () => "r2" } },
});

const klar = (o: Partial<KlarifikasiRead> = {}): KlarifikasiRead => ({
  id: "k-1",
  narasi_id: "n-1",
  claim_id: "C-1",
  source_ids_checked: ["s-1", "s-2"],
  materiality_reason: "Material",
  alternative_hypothesis: "Alternatif",
  intended_decision: "Putuskan",
  recipient_role: "KEPALA",
  periode: "2026/27",
  exposure: "TIDAK_BERLAKU",
  due_trigger: "Sebelum rapat",
  question_text: "Apakah benar?",
  reviewer_approval: "MENUNGGU",
  response_ref: null,
  jawaban_mentah: null,
  disposition: "TERBUKA",
  ai_usulan_id: null,
  dibuat_oleh: "a",
  created_at: "2026-11-12T00:00:00Z",
  updated_at: "2026-11-12T00:00:00Z",
  ...o,
});

const sumber = [
  {
    id: "s-1",
    judul: "Sumber Satu",
    jenis: "DOKUMEN",
    versi: "1",
    periode: "2026/27",
    teks_hash: "h",
    izin_ai: false,
    izin_catatan: null,
    menggantikan_id: null,
    dibuat_oleh: "a",
    created_at: "2026-11-01T00:00:00Z",
  },
] as never;

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  refresh.mockReset();
  push.mockReset();
  vi.mocked(notifySukses).mockClear();
  vi.mocked(auth).mockReset();
  vi.mocked(auth).mockResolvedValue({ accessToken: "tok" } as never);
});

describe("aksiTersedia", () => {
  const kombinasi: Array<[string, string, string[]]> = [
    ["MENUNGGU", "TERBUKA", ["setujui", "tolak", "batalkan"]],
    ["DISETUJUI", "TERBUKA", ["salin", "catat_jawaban", "batalkan"]],
    ["DITOLAK", "TERBUKA", ["batalkan"]],
    ["MENUNGGU", "DITOLAK", []],
    ["DISETUJUI", "TERJAWAB", []],
    ["DISETUJUI", "DIBATALKAN", []],
    ["DITOLAK", "DITOLAK", []],
  ];
  it.each(kombinasi)("%s × %s", (approval, disposition, harap) => {
    expect(aksiTersedia({ reviewer_approval: approval, disposition } as never)).toEqual(harap);
  });
});

describe("validasi dan label", () => {
  it("13 metadata lengkap dengan label berkurung nama HO", () => {
    expect(METADATA_KLARIFIKASI).toHaveLength(13);
    expect(new Set(METADATA_KLARIFIKASI.map((m) => m.kunci)).size).toBe(13);
    for (const m of METADATA_KLARIFIKASI) expect(m.label).toMatch(/\(.+\)$/);
    expect(teksMetadata(klar(), "source_ids_checked")).toBe("s-1, s-2");
    expect(teksMetadata(klar(), "response_ref")).toBe("—");
    expect(teksMetadata(klar({ disposition: "TERJAWAB" }), "disposition")).toContain("Terjawab");
  });

  it("catatan dan jawaban wajib", () => {
    expect(validasiCatatan("abc")).toMatch(/minimal 5/);
    expect(validasiCatatan("cukup panjang")).toBeNull();
    expect(validasiJawaban({ response_ref: "", jawaban_mentah: " " })).toEqual({
      response_ref: expect.any(String),
      jawaban_mentah: expect.any(String),
    });
    expect(validasiJawaban({ response_ref: "R1", jawaban_mentah: "ya" })).toEqual({});
  });

  it("form buat: kosong, satu tanda tanya, bodi tanpa isian exposure dari pengguna", () => {
    expect(Object.keys(validasiBuat(ISIAN_BUAT_KOSONG))).toHaveLength(9);
    const penuh = {
      claim_id: "C-1",
      source_ids_checked: ["s-1"],
      materiality_reason: "m",
      alternative_hypothesis: "a",
      intended_decision: "d",
      recipient_role: "KEPALA",
      periode: "2026/27",
      due_trigger: "t",
      question_text: "Satu? Dua?",
    };
    expect(validasiBuat(penuh).question_text).toMatch(/satu tanda tanya/);
    const sah = { ...penuh, question_text: "Satu?" };
    expect(validasiBuat(sah)).toEqual({});
    expect(bodyBuat("n-1", "EXPOSED", sah)).toMatchObject({
      narasi_id: "n-1",
      exposure: "EXPOSED",
    });
  });

  it("filter: bawaan TERBUKA, SEMUA mematikan, nilai asing kembali ke bawaan", () => {
    expect(bacaFilterKlarifikasi({}).disposition).toBe("TERBUKA");
    expect(queryFilterKlarifikasi(bacaFilterKlarifikasi({}))).toBe("");
    expect(bacaFilterKlarifikasi({ disposition: "SEMUA" }).disposition).toBeNull();
    expect(queryFilterKlarifikasi(bacaFilterKlarifikasi({ disposition: "SEMUA" }))).toBe(
      "disposition=SEMUA",
    );
    expect(bacaFilterKlarifikasi({ disposition: "AIH" }).disposition).toBe("TERBUKA");
  });

  it("exposure dari paparan; asing atau null menjadi TIDAK_DIKETAHUI", () => {
    expect(exposureDariPaparan("EXPOSED")).toBe("EXPOSED");
    expect(exposureDariPaparan(null)).toBe("TIDAK_DIKETAHUI");
    expect(exposureDariPaparan("ASING")).toBe("TIDAK_DIKETAHUI");
  });

  it("pemetaan galat 409 menjadi pesan spesifik dan id klarifikasi yang ada", () => {
    const e = new ApiError({ code: "REVIEWER_TIDAK_INDEPENDEN", message: "x" }, "r", 409);
    expect((petakanGalatKlarifikasi(e) as Error).message).toMatch(/tidak boleh menyetujui/);
    const lain = new ApiError({ code: "tak_dikenal", message: "asli" }, "r", 409);
    expect(petakanGalatKlarifikasi(lain)).toBe(lain);
    const sudah = new ApiError(
      { code: "USULAN_SUDAH_DITERAPKAN", message: "x", details: [{ msg: "k-9" }] },
      "r",
      409,
    );
    expect(idKlarifikasiSudahAda(sudah)).toBe("k-9");
    expect(idKlarifikasiSudahAda(lain)).toBeNull();
  });
});

describe("panelTerapkanP04Tampil", () => {
  it("hanya P04 material dengan putusan APPROVE/REVISE", () => {
    expect(panelTerapkanP04Tampil("P04", { material: true }, "APPROVE")).toBe(true);
    expect(panelTerapkanP04Tampil("P04", { material: true }, "REVISE")).toBe(true);
    expect(panelTerapkanP04Tampil("P11", { material: true }, "APPROVE")).toBe(false);
    expect(panelTerapkanP04Tampil("P04", { material: false }, "APPROVE")).toBe(false);
    expect(panelTerapkanP04Tampil("P04", { material: true }, "REJECT")).toBe(false);
    expect(panelTerapkanP04Tampil("P04", { material: true }, null)).toBe(false);
    expect(panelTerapkanP04Tampil("P04", null, "APPROVE")).toBe(false);
  });

  it("validasi dan body panel", () => {
    expect(
      Object.keys(validasiDariUsulan({ claim_id: "", due_trigger: "", intended_decision: "" })),
    ).toEqual(["claim_id", "due_trigger"]);
    expect(
      bodyDariUsulan("EXPOSED", { claim_id: "C", due_trigger: "t", intended_decision: " " }),
    ).toEqual({ claim_id: "C", due_trigger: "t", exposure: "EXPOSED", intended_decision: null });
  });
});

describe("halaman indeks klarifikasi", () => {
  it("respons 500 melempar, tidak menjadi daftar kosong", async () => {
    get.mockResolvedValue(gagal(500));
    await expect(KlarifikasiIndexPage({ searchParams: Promise.resolve({}) })).rejects.toMatchObject(
      {
        status: 500,
      },
    );
  });

  it("daftar kosong yang sah menampilkan keadaan kosong; filter aktif dibedakan", async () => {
    get.mockResolvedValue(ok({ items: [], total: 0, limit: 20, offset: 0 }));
    const { unmount } = render(await KlarifikasiIndexPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Belum ada klarifikasi terbuka.")).toBeTruthy();
    expect(get.mock.calls[0][1].params.query).toMatchObject({ disposition: "TERBUKA" });
    unmount();
    render(
      await KlarifikasiIndexPage({ searchParams: Promise.resolve({ disposition: "TERJAWAB" }) }),
    );
    expect(screen.getByText(/cocok dengan filter/)).toBeTruthy();
  });

  it("baris tampil dengan tautan ke detail", async () => {
    get.mockResolvedValue(ok({ items: [klar()], total: 1, limit: 20, offset: 0 }));
    render(await KlarifikasiIndexPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole("link", { name: "Apakah benar?" }).getAttribute("href")).toBe(
      "/narasi/klarifikasi/k-1",
    );
  });
});

describe("AksiKlarifikasi", () => {
  const props = { id: "k-1", questionText: "Apakah benar?", accessToken: "t" };

  it("MENUNGGU: Setujui dan Tolak tampil, Catat jawaban tidak; tidak ada aksi kirim pesan", () => {
    render(<AksiKlarifikasi {...props} reviewerApproval="MENUNGGU" disposition="TERBUKA" />);
    expect(screen.getByRole("button", { name: "Setujui" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tolak" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Catat jawaban" })).toBeNull();
    expect(screen.queryByRole("button", { name: /kirim/i })).toBeNull();
  });

  it("Tolak tanpa catatan tidak memanggil API; 409 menampilkan pesan spesifik", async () => {
    render(<AksiKlarifikasi {...props} reviewerApproval="MENUNGGU" disposition="TERBUKA" />);
    fireEvent.click(screen.getByRole("button", { name: "Tolak" }));
    expect(post).not.toHaveBeenCalled();
    post.mockResolvedValueOnce(gagal(409, "REVIEWER_TIDAK_INDEPENDEN"));
    fireEvent.click(screen.getByRole("button", { name: "Setujui" }));
    expect(await screen.findByText(/tidak boleh menyetujui pertanyaannya sendiri/)).toBeTruthy();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("DISETUJUI+TERBUKA: catat jawaban butuh kedua isian; sukses memanggil refresh", async () => {
    render(<AksiKlarifikasi {...props} reviewerApproval="DISETUJUI" disposition="TERBUKA" />);
    expect(screen.getByRole("button", { name: "Salin pertanyaan" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Catat jawaban" }));
    expect(post).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/ResponseRef/), { target: { value: "WA-1" } });
    fireEvent.change(screen.getByLabelText(/^Jawaban mentah/), { target: { value: "Ya" } });
    post.mockResolvedValueOnce({ data: klar(), response: new Response(null, { status: 200 }) });
    fireEvent.click(screen.getByRole("button", { name: "Catat jawaban" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toEqual({ response_ref: "WA-1", jawaban_mentah: "Ya" });
    expect(post.mock.calls[0][1].headers["Idempotency-Key"]).toBeTruthy();
    expect(notifySukses).toHaveBeenCalledWith("Jawaban dicatat");
  });

  it("disposisi akhir: tidak ada aksi", () => {
    render(<AksiKlarifikasi {...props} reviewerApproval="DISETUJUI" disposition="TERJAWAB" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("KlarifikasiForm", () => {
  it("409 KLARIFIKASI_GANDA tampil sebagai pesan spesifik; isian tidak dibuang", async () => {
    render(
      <KlarifikasiForm
        narasiId="n-1"
        periodeAwal="2026/27"
        exposure="BELUM_TERPAPAR"
        sumberOpsi={sumber}
        accessToken="t"
      />,
    );
    const isi = (re: RegExp, v: string) =>
      fireEvent.change(screen.getByLabelText(re), { target: { value: v } });
    isi(/Claim_ID/, "C-1");
    isi(/RecipientRole/, "KEPALA");
    isi(/MaterialityReason/, "m");
    isi(/AlternativeHypothesis/, "a");
    isi(/IntendedDecision/, "d");
    isi(/DueTrigger/, "t");
    isi(/Question_Text/, "Apakah benar?");
    fireEvent.click(screen.getByRole("checkbox"));
    post.mockResolvedValueOnce(gagal(409, "KLARIFIKASI_GANDA"));
    fireEvent.click(screen.getByRole("button", { name: "Ajukan klarifikasi" }));
    expect(await screen.findByText(/Sudah ada klarifikasi terbuka/)).toBeTruthy();
    expect(post.mock.calls[0][1].body).toMatchObject({
      narasi_id: "n-1",
      exposure: "BELUM_TERPAPAR",
      source_ids_checked: ["s-1"],
    });
    expect((screen.getByLabelText(/Claim_ID/) as HTMLInputElement).value).toBe("C-1");
    expect(push).not.toHaveBeenCalled();
  });
});

describe("TerapkanKlarifikasi", () => {
  it("sukses 201 menampilkan tautan ke detail klarifikasi", async () => {
    render(<TerapkanKlarifikasi usulanId="u1" exposure="EXPOSED" accessToken="t" />);
    fireEvent.click(screen.getByRole("button", { name: "Terapkan ke register" }));
    expect(post).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Claim_ID/), { target: { value: "C-9" } });
    fireEvent.change(screen.getByLabelText(/DueTrigger/), { target: { value: "Pekan depan" } });
    post.mockResolvedValueOnce({
      data: klar({ id: "k-77" }),
      response: new Response(null, { status: 201 }),
    });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan ke register" }));
    const tautan = await screen.findByRole("link", { name: "Buka klarifikasi" });
    expect(tautan.getAttribute("href")).toBe("/narasi/klarifikasi/k-77");
    expect(post.mock.calls[0][1].params.path.ai_usulan_id).toBe("u1");
  });

  it("409 USULAN_SUDAH_DITERAPKAN menaut ke klarifikasi yang ada", async () => {
    render(<TerapkanKlarifikasi usulanId="u1" exposure="EXPOSED" accessToken="t" />);
    fireEvent.change(screen.getByLabelText(/Claim_ID/), { target: { value: "C-9" } });
    fireEvent.change(screen.getByLabelText(/DueTrigger/), { target: { value: "t" } });
    post.mockResolvedValueOnce(gagal(409, "USULAN_SUDAH_DITERAPKAN", [{ msg: "k-5" }]));
    fireEvent.click(screen.getByRole("button", { name: "Terapkan ke register" }));
    const tautan = await screen.findByRole("link", { name: "Buka klarifikasi yang ada" });
    expect(tautan.getAttribute("href")).toBe("/narasi/klarifikasi/k-5");
  });
});
