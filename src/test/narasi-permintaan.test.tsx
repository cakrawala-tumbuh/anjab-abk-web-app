import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn(), GRUP_TIM_KAJIAN: "tim-kajian" }));
vi.mock("@/components/auto-refresh", () => ({
  AutoRefresh: () => <div data-testid="auto-refresh" />,
}));
const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ GET: get, POST: post }) }));
const notifyGagal = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
  notifySukses: vi.fn(),
}));

import { auth } from "@/lib/auth/auth";
import { PermintaanDrafAi } from "@/app/(auth)/narasi/kasus/[id]/permintaan-draf-ai";
import DetailKasusPage from "@/app/(auth)/narasi/kasus/[id]/page";
import { fetchSemuaPermintaanAi } from "@/app/(auth)/narasi/kasus/data";
import {
  PESAN_409,
  PESAN_DITERIMA,
  PERINGATAN_TANPA_SUMBER,
  adaBelumDiserap,
  statusPermintaanAi,
  type ItemPermintaan,
} from "@/lib/narasi-permintaan";
import type { PermintaanAiRead } from "@/lib/api/schema";

const JOB = ["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "MANUAL_REVIEW"] as const;
const HASIL = [null, "VERSI_DIBUAT", "NEED_FACT", "MANUAL"] as const;
const DISERAP = "2026-11-05T03:00:00Z";

const item = (o: Partial<PermintaanAiRead> = {}): PermintaanAiRead => ({
  id: "p-1",
  job_id: "j-1",
  job_status: "PENDING",
  job_error_code: null,
  ai_run_id: "r-1",
  sumber_ids: [],
  created_at: "2026-11-05T01:00:00Z",
  diserap_at: null,
  hasil_serap: null,
  kode_serap: null,
  ...o,
});
const sumberOpsi = [
  { id: "s-1", judul: "Pedoman", versi: "v1", periode: "2026/27", izin_ai: true },
  { id: "s-2", judul: "Catatan", versi: "v2", periode: "2026/27", izin_ai: false },
];
const ok = (data: unknown, status = 200) => ({
  data,
  response: { status, headers: { get: () => "r1" } },
});
const gagal = (status: number, error: string, message: string) => ({
  data: undefined,
  error: { error, message },
  response: { status, headers: { get: () => "r2" } },
});
const KATA_DILARANG = /berhasil|selesai/i;

function panel(over: Partial<React.ComponentProps<typeof PermintaanDrafAi>> = {}) {
  return render(
    <PermintaanDrafAi
      kasusId="k-1"
      statusKasus="SOURCE_CHECKED"
      sumberOpsi={sumberOpsi}
      permintaan={[]}
      accessToken="tok"
      {...over}
    />,
  );
}

beforeEach(() => {
  [refresh, get, post, notifyGagal].forEach((m) => m.mockReset());
  vi.mocked(auth).mockReset();
  vi.mocked(auth).mockResolvedValue({
    accessToken: "tok",
    user: { groups: ["tim-kajian"] },
  } as never);
});

describe("statusPermintaanAi", () => {
  it("memetakan seluruh kombinasi job_status x hasil_serap", () => {
    const harap = (j: string, h: string | null, diserap: boolean) => {
      if (!diserap) {
        return {
          PENDING: "AI_PENDING",
          RUNNING: "AI_PENDING",
          FAILED: "GAGAL",
          SUCCEEDED: "MENUNGGU_SERAP",
          MANUAL_REVIEW: "MANUAL_REVIEW",
        }[j];
      }
      return (
        { VERSI_DIBUAT: "DRAF_TERSEDIA", NEED_FACT: "NEED_FACT", MANUAL: "MANUAL_REVIEW" }[
          h ?? ""
        ] ?? "TAK_DIKENAL"
      );
    };
    let n = 0;
    for (const j of JOB)
      for (const h of HASIL)
        for (const diserap of [false, true]) {
          const t = statusPermintaanAi({
            job_status: j,
            job_error_code: null,
            diserap_at: diserap ? DISERAP : null,
            hasil_serap: h,
            kode_serap: null,
          });
          expect(t.kode, `${j}/${h}/${diserap}`).toBe(harap(j, h, diserap));
          expect(t.diserap).toBe(diserap);
          n++;
        }
    expect(n).toBe(40);
  });

  it("FAILED menampilkan job_error_code; MANUAL menampilkan kode_serap", () => {
    expect(
      statusPermintaanAi({
        job_status: "FAILED",
        job_error_code: "TIMEOUT",
        diserap_at: null,
        hasil_serap: null,
        kode_serap: null,
      }).kodeTeknis,
    ).toEqual(["TIMEOUT"]);
    const m = statusPermintaanAi({
      job_status: "SUCCEEDED",
      job_error_code: null,
      diserap_at: DISERAP,
      hasil_serap: "MANUAL",
      kode_serap: ["RUN_HILANG", "KASUS_BERUBAH"],
    });
    expect(m.kode).toBe("MANUAL_REVIEW");
    expect(m.kodeTeknis).toEqual(["RUN_HILANG", "KASUS_BERUBAH"]);
  });

  it("SUCCEEDED belum diserap bukan sukses dan tanpa tautan antrean", () => {
    const t = statusPermintaanAi({
      job_status: "SUCCEEDED",
      job_error_code: null,
      diserap_at: null,
      hasil_serap: null,
      kode_serap: null,
    });
    expect(t.kode).toBe("MENUNGGU_SERAP");
    expect(t.tautanAntrean).toBe(false);
  });

  it("VERSI_DIBUAT menautkan antrean; nilai tak dikenal tidak tampak sukses", () => {
    const d = statusPermintaanAi({
      job_status: "SUCCEEDED",
      job_error_code: null,
      diserap_at: DISERAP,
      hasil_serap: "VERSI_DIBUAT",
      kode_serap: null,
    });
    expect(d.tautanAntrean).toBe(true);
    const x = statusPermintaanAi({
      job_status: "SUCCEEDED",
      job_error_code: null,
      diserap_at: DISERAP,
      hasil_serap: "BARU",
      kode_serap: null,
    });
    expect(x.kode).toBe("TAK_DIKENAL");
  });

  it("tak satu keluaran pun memuat kata berhasil/selesai", () => {
    const semua: ItemPermintaan[] = [];
    for (const j of JOB)
      for (const h of [...HASIL, "BARU"])
        for (const diserap of [null, DISERAP])
          semua.push({
            job_status: j,
            job_error_code: null,
            diserap_at: diserap,
            hasil_serap: h,
            kode_serap: null,
          });
    for (const it of semua) {
      const t = statusPermintaanAi(it);
      expect(`${t.judul} ${t.keterangan}`).not.toMatch(KATA_DILARANG);
    }
    for (const p of Object.values(PESAN_409)) expect(p).not.toMatch(KATA_DILARANG);
    expect(PESAN_DITERIMA).not.toMatch(KATA_DILARANG);
    expect(PERINGATAN_TANPA_SUMBER).not.toMatch(KATA_DILARANG);
  });

  it("adaBelumDiserap", () => {
    expect(adaBelumDiserap([])).toBe(false);
    expect(adaBelumDiserap([{ diserap_at: DISERAP }])).toBe(false);
    expect(adaBelumDiserap([{ diserap_at: DISERAP }, { diserap_at: null }])).toBe(true);
  });
});

describe("PermintaanDrafAi", () => {
  it("202 menampilkan permintaan diterima tanpa kata sukses, dan menyegarkan halaman", async () => {
    post.mockResolvedValue(ok(item(), 202));
    panel();
    fireEvent.click(screen.getByLabelText(/Pedoman/));
    fireEvent.click(screen.getByRole("button", { name: "Minta draf AI" }));
    await waitFor(() => expect(screen.getByText(PESAN_DITERIMA)).toBeInTheDocument());
    expect(post.mock.calls[0][1].body).toEqual({ sumber_ids: ["s-1"] });
    expect(post.mock.calls[0][1].headers["Idempotency-Key"]).toBeTruthy();
    expect(refresh).toHaveBeenCalled();
    expect(document.body.textContent).not.toMatch(KATA_DILARANG);
  });

  it("permintaan PENDING tampil sebagai AI_PENDING, bukan sukses", () => {
    panel({ permintaan: [item({ job_status: "PENDING" })] });
    expect(screen.getByText("AI_PENDING")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(KATA_DILARANG);
  });

  it("SUCCEEDED belum diserap tampil menunggu penyerapan", () => {
    panel({ permintaan: [item({ job_status: "SUCCEEDED" })] });
    expect(screen.getByText("Menunggu penyerapan hasil")).toBeInTheDocument();
    expect(screen.queryByText(/Buka di antrean/)).not.toBeInTheDocument();
  });

  it.each([
    ["VERSI_DIBUAT", "Draf tersedia, belum ditinjau"],
    ["NEED_FACT", "Butuh fakta"],
    ["MANUAL", "MANUAL_REVIEW"],
  ])("hasil_serap %s tampil sesuai pemetaan", (hasil, judul) => {
    panel({
      permintaan: [
        item({
          job_status: "SUCCEEDED",
          diserap_at: DISERAP,
          hasil_serap: hasil,
          kode_serap: hasil === "MANUAL" ? ["RUN_HILANG"] : null,
        }),
      ],
    });
    expect(screen.getByText(judul)).toBeInTheDocument();
    if (hasil === "VERSI_DIBUAT") {
      expect(screen.getByRole("link", { name: /antrean/ })).toHaveAttribute(
        "href",
        "/narasi/antrean/k-1",
      );
    }
    if (hasil === "MANUAL") expect(screen.getByText(/RUN_HILANG/)).toBeInTheDocument();
  });

  it.each(Object.keys(PESAN_409))(
    "409 %s tampil dengan pesannya, tanpa tanda sukses",
    async (kode) => {
      post.mockResolvedValue(gagal(409, kode, "pesan asli backend"));
      panel();
      fireEvent.click(screen.getByRole("button", { name: "Minta draf AI" }));
      await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(PESAN_409[kode]));
      expect(screen.queryByText(PESAN_DITERIMA)).not.toBeInTheDocument();
      expect(refresh).not.toHaveBeenCalled();
      expect(notifyGagal).toHaveBeenCalled();
    },
  );

  it("422 sumber tak dikenal menampilkan pesan backend", async () => {
    post.mockResolvedValue(gagal(422, "validation_error", "Sumber 'x' tidak ditemukan."));
    panel();
    fireEvent.click(screen.getByRole("button", { name: "Minta draf AI" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Sumber 'x' tidak ditemukan."),
    );
  });

  it("sumber_ids kosong memunculkan peringatan NEED_FACT dan tetap terkirim", async () => {
    post.mockResolvedValue(ok(item(), 202));
    panel();
    expect(screen.getByText(PERINGATAN_TANPA_SUMBER)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Minta draf AI" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toEqual({ sumber_ids: [] });
    fireEvent.click(screen.getByLabelText(/Pedoman/));
    expect(screen.queryByText(PERINGATAN_TANPA_SUMBER)).not.toBeInTheDocument();
  });

  it("pemilih menampilkan izin_ai tiap sumber", () => {
    panel();
    expect(screen.getByLabelText(/Pedoman.*berizin AI/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Catatan.*tanpa izin AI/)).toBeInTheDocument();
  });

  it("tombol hanya untuk SOURCE_CHECKED dan NEED_FACT", () => {
    const { unmount } = panel({ statusKasus: "NEED_FACT" });
    expect(screen.getByRole("button", { name: "Minta draf AI" })).toBeInTheDocument();
    unmount();
    panel({ statusKasus: "AI_DRAFT" });
    expect(screen.queryByRole("button", { name: "Minta draf AI" })).not.toBeInTheDocument();
  });

  it("AutoRefresh hanya selagi ada permintaan belum diserap", () => {
    const a = panel({ permintaan: [item()] });
    expect(screen.getByTestId("auto-refresh")).toBeInTheDocument();
    a.unmount();
    const b = panel({
      permintaan: [
        item({ job_status: "SUCCEEDED", diserap_at: DISERAP, hasil_serap: "NEED_FACT" }),
      ],
    });
    expect(screen.queryByTestId("auto-refresh")).not.toBeInTheDocument();
    b.unmount();
    panel({ permintaan: [] });
    expect(screen.queryByTestId("auto-refresh")).not.toBeInTheDocument();
  });
});

describe("halaman detail kasus", () => {
  const kasusDetail = (status: string) => ({
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
    status,
    intended_use: "laporan",
    permission_scope: "internal",
    sensitivity_class: "NONPRIBADI",
    dibuat_oleh: "u",
    created_at: "2026-11-05T00:00:00Z",
    updated_at: "2026-11-05T00:00:00Z",
    versi_terbaru: null,
  });
  const sumberRingkas = {
    id: "s-1",
    judul: "Pedoman",
    jenis: "SINTETIS",
    versi: "v1",
    periode: "2026/27",
    teks_hash: "h",
    izin_ai: true,
    izin_catatan: null,
    menggantikan_id: null,
    dibuat_oleh: "u",
    created_at: "2026-11-05T00:00:00Z",
  };

  it("form revisi manual tetap aktif saat permintaan berstatus MANUAL_REVIEW", async () => {
    get.mockImplementation(async (path: string) => {
      if (path === "/api/v1/narasi/kasus/{narasi_id}") return ok(kasusDetail("SOURCE_CHECKED"));
      if (path.endsWith("/riwayat")) return ok({ versi: [], event: [] });
      if (path.endsWith("/permintaan-ai"))
        return ok({
          items: [
            item({
              job_status: "SUCCEEDED",
              diserap_at: DISERAP,
              hasil_serap: "MANUAL",
              kode_serap: ["RUN_HILANG"],
            }),
          ],
          total: 1,
          limit: 100,
          offset: 0,
        });
      return ok({ items: [sumberRingkas], total: 1, limit: 100, offset: 0 });
    });
    render(await DetailKasusPage({ params: Promise.resolve({ id: "k-1" }) }));
    expect(screen.getByText("MANUAL_REVIEW")).toBeInTheDocument();
    expect(screen.getByLabelText("Teks revisi")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Simpan revisi" })).toBeEnabled();
  });

  it("form revisi manual tetap aktif saat permintaan MANUAL_REVIEW belum diserap", async () => {
    get.mockImplementation(async (path: string) => {
      if (path === "/api/v1/narasi/kasus/{narasi_id}") return ok(kasusDetail("NEED_FACT"));
      if (path.endsWith("/riwayat")) return ok({ versi: [], event: [] });
      if (path.endsWith("/permintaan-ai"))
        return ok({
          items: [item({ job_status: "MANUAL_REVIEW" })],
          total: 1,
          limit: 100,
          offset: 0,
        });
      return ok({ items: [sumberRingkas], total: 1, limit: 100, offset: 0 });
    });
    render(await DetailKasusPage({ params: Promise.resolve({ id: "k-1" }) }));
    expect(screen.getByLabelText("Teks revisi")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Simpan revisi" })).toBeEnabled();
  });

  it("gagal memuat permintaan melempar, tidak menjadi daftar kosong", async () => {
    get.mockImplementation(async (path: string) => {
      if (path === "/api/v1/narasi/kasus/{narasi_id}") return ok(kasusDetail("SOURCE_CHECKED"));
      if (path.endsWith("/riwayat")) return ok({ versi: [], event: [] });
      if (path.endsWith("/permintaan-ai")) return gagal(500, "internal", "Gagal.");
      return ok({ items: [sumberRingkas], total: 1, limit: 100, offset: 0 });
    });
    await expect(DetailKasusPage({ params: Promise.resolve({ id: "k-1" }) })).rejects.toMatchObject(
      { status: 500 },
    );
  });

  it("fetchSemuaPermintaanAi menggabungkan halaman dan melempar bila gagal", async () => {
    get
      .mockResolvedValueOnce(ok({ items: [item({ id: "a" })], total: 2, limit: 1, offset: 0 }))
      .mockResolvedValueOnce(ok({ items: [item({ id: "b" })], total: 2, limit: 1, offset: 1 }));
    const semua = await fetchSemuaPermintaanAi("tok", "k-1");
    expect(semua.map((p) => p.id)).toEqual(["a", "b"]);
    get.mockReset();
    get.mockResolvedValue(gagal(403, "forbidden", "Dilarang."));
    await expect(fetchSemuaPermintaanAi("tok", "k-1")).rejects.toMatchObject({ status: 403 });
  });
});
