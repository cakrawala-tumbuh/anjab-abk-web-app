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
import { FormAlternatif } from "@/app/(auth)/redesain/masalah/[id]/form-alternatif";
import { fetchAlternatifMasalah } from "@/app/(auth)/redesain/masalah/[id]/data-alternatif";
import { BAGIAN_DETAIL_MASALAH } from "@/app/(auth)/redesain/masalah/[id]/registry";
import { ApiError } from "@/lib/api/errors";
import { PESAN_DATA_BERUBAH } from "@/lib/konkurensi";
import { FormKeputusanPerubahan } from "@/app/(auth)/redesain/masalah/[id]/form-keputusan-perubahan";
import { FormKesiapan } from "@/app/(auth)/redesain/masalah/[id]/form-kesiapan";
import {
  validasiAlternatif,
  JUDUL_ALTERNATIF,
  JUDUL_KEPUTUSAN_PERUBAHAN,
  formatDelta,
  isianKesiapanAwal,
  opsiKeputusanAktif,
  payloadKesiapan,
  periodeBerjalan,
  periodeValid,
  validasiKeputusanPerubahan,
  validasiKesiapan,
  type IsianKesiapan,
} from "@/lib/redesain-alternatif";
import type { AlternatifRead } from "@/lib/api/schema";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: "x", message: "ditolak" },
  response: { status, headers: { get: () => "req-1" } },
});
/** Respons GET detail yang membawa header ETag (kunci optimistik). */
const respEtag = (data: unknown, etag = '"v1"') => ({
  data,
  error: undefined,
  response: {
    status: 200,
    headers: { get: (n: string) => (n.toLowerCase() === "etag" ? etag : "req-1") },
  },
});
const halaman = (items: unknown[]) => resp({ items, total: items.length, limit: 500, offset: 0 });

const alt = (p: Partial<AlternatifRead> = {}): AlternatifRead =>
  ({
    id: "a1",
    kode: "U-001",
    masalah_id: "m1",
    opsi: "Alihkan tugas bersyarat",
    alur_kini_vs_usulan: "kini manual, usulan otomatis",
    pihak_asal_jabatan_id: "j1",
    pihak_penerima_jabatan_id: "j2",
    komitmen_penerima: null,
    jadwal_puncak: null,
    keterampilan_akses: null,
    tambahan_bersih: null,
    risiko_layanan: null,
    gap_penerima: "Belum tahu",
    status_telaah: "Belum ditelaah",
    pemutus_kode_orang: null,
    keputusan: null,
    prasyarat_monitoring: null,
    catatan_versi_bukti: null,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
    ...p,
  }) as AlternatifRead;

/** Pengaturan GET kesiapan/penerima/keputusan perubahan/saklar untuk {@link siapkan}. */
interface KonfigKesiapan {
  saklar: boolean;
  statusKesiapanGagal: boolean;
  matriks: unknown;
  riwayat: unknown[];
}
const MATRIKS_BAWAAN = {
  alternatif_id: "a1",
  periode: "2026/27",
  status_opsi: "HOLD",
  baris: [
    {
      penerima_id: "p1",
      penerima_jabatan_id: "j2",
      material: true,
      status: null,
      delta_asal_jam: null,
      delta_asal_estimasi: null,
      delta_penerima_jam: null,
      delta_penerima_estimasi: null,
      delta_organisasi_jam: null,
      delta_organisasi_estimasi: null,
      syarat: null,
      alasan_hold: null,
      dinilai_pada: null,
    },
    {
      penerima_id: "p2",
      penerima_jabatan_id: "j1",
      material: false,
      status: "CONDITIONAL",
      delta_asal_jam: "-2.50",
      delta_asal_estimasi: "ESTIMATED",
      delta_penerima_jam: "0.00",
      delta_penerima_estimasi: "ESTIMATED",
      delta_organisasi_jam: null,
      delta_organisasi_estimasi: "NOT_ESTIMABLE",
      syarat: "Uji coba satu semester",
      alasan_hold: null,
      dinilai_pada: "2026-11-10T00:00:00Z",
    },
  ],
};
let konfig: KonfigKesiapan;

function siapkan(daftar: AlternatifRead[] = [alt()], ubah: Partial<KonfigKesiapan> = {}) {
  konfig = {
    saklar: true,
    statusKesiapanGagal: false,
    matriks: MATRIKS_BAWAAN,
    riwayat: [],
    ...ubah,
  };
  get.mockImplementation(async (path: string) => {
    if (path === "/api/v1/system/fitur")
      return resp({ items: [{ kode: "CHANGE_AUTHORIZATION", aktif: konfig.saklar }] });
    if (path === "/api/v1/redesain/alternatif/{alternatif_id}/penerima")
      return resp([
        { id: "p1", alternatif_id: "a1", penerima_jabatan_id: "j2", material: true, catatan: null },
        {
          id: "p2",
          alternatif_id: "a1",
          penerima_jabatan_id: "j1",
          material: false,
          catatan: null,
        },
      ]);
    if (path === "/api/v1/redesain/alternatif/{alternatif_id}/kesiapan")
      return konfig.statusKesiapanGagal ? resp(null, 500) : resp(konfig.matriks);
    if (path === "/api/v1/redesain/alternatif/{alternatif_id}/keputusan-perubahan")
      return resp(konfig.riwayat);
    if (path === "/api/v1/redesain/masalah/{masalah_id}")
      return resp({
        id: "m1",
        kode: "M-K01-01",
        konteks_id: "k1",
        sekolah_id: "s1",
        keterangan_sekolah: null,
        periode_acuan: "TA 2026/27",
        status_awal: "Hipotesis",
        gelombang: "G1",
        dibuka_untuk_konfirmasi: false,
      });
    if (path === "/api/v1/redesain/alternatif/{alternatif_id}") return respEtag(daftar[0]);
    if (path === "/api/v1/redesain/konteks")
      return halaman([{ id: "k1", kode: "K-01", tema: "Beban administrasi" }]);
    if (path === "/api/v1/sekolah") return halaman([{ id: "s1", nama: "SD Contoh" }]);
    if (path === "/api/v1/jabatan")
      return halaman([
        { id: "j1", nama: "Wakil Kepala Sekolah" },
        { id: "j2", nama: "Staf Tata Usaha" },
      ]);
    if (path === "/api/v1/redesain/kode-orang")
      return halaman([{ id: "ko1", kode: "O-0001", keterangan_peran: "Waka" }]);
    throw new Error(`GET tak terduga ${path}`);
  });
  post.mockImplementation(async (path: string) => {
    if (path === "/api/v1/redesain/alternatif/search") return halaman(daftar);
    throw new Error(`POST tak terduga ${path}`);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ accessToken: "tok", user: { groups: ["tim-kajian"] } });
});

describe("bagian alternatif", () => {
  it("terdaftar di registry", () => {
    expect(BAGIAN_DETAIL_MASALAH.map((b) => b.kunci)).toContain("alternatif");
  });

  it("daftar merender nama jabatan asal → penerima dan judul tetap", async () => {
    siapkan();
    const ui = await DetailMasalahPage({
      params: Promise.resolve({ id: "m1" }),
      searchParams: Promise.resolve({ bagian: "alternatif" }),
    });
    render(ui);
    const tabel = screen.getAllByRole("table")[0];
    expect(within(tabel).getByText("Wakil Kepala Sekolah → Staf Tata Usaha")).toBeInTheDocument();
    expect(within(tabel).getByText("U-001")).toBeInTheDocument();
    expect(within(tabel).queryByText("j1")).toBeNull();
    expect(screen.getByText(JUDUL_ALTERNATIF)).toBeInTheDocument();
    expect(JUDUL_ALTERNATIF).toContain("BUKAN BAGIAN DARI SKOR K1–K4");
  });

  it("search alternatif 403 melempar ApiError", async () => {
    post.mockResolvedValue(resp(null, 403));
    await expect(fetchAlternatifMasalah("tok", "m1")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("validasiAlternatif", () => {
  const dasar = {
    opsi: "Pertahankan" as const,
    status_telaah: "Belum ditelaah" as const,
    keputusan: "",
    pemutus_kode_orang: "",
    pihak_penerima_jabatan_id: "",
  };
  it("valid pada isian dasar", () => expect(validasiAlternatif(dasar)).toEqual([]));
  it("Uji disetujui terpisah wajib keputusan dan pemutus", () => {
    expect(validasiAlternatif({ ...dasar, status_telaah: "Uji disetujui terpisah" })).toHaveLength(
      2,
    );
  });
  it("Alihkan tugas bersyarat wajib penerima", () => {
    expect(validasiAlternatif({ ...dasar, opsi: "Alihkan tugas bersyarat" })).toHaveLength(1);
  });
});

describe("FormAlternatif", () => {
  const jabatan = [
    { id: "j1", label: "Wakil Kepala Sekolah" },
    { id: "j2", label: "Staf Tata Usaha" },
  ];
  const isiAlur = () =>
    fireEvent.change(screen.getByLabelText("Alur kini vs usulan"), { target: { value: "alur" } });
  const kirim = () => fireEvent.click(screen.getByRole("button", { name: "Tambah alternatif" }));

  it("Uji disetujui terpisah tanpa keputusan → POST tidak dipanggil", async () => {
    siapkan();
    render(<FormAlternatif masalahId="m1" jabatan={jabatan} accessToken="tok" />);
    isiAlur();
    fireEvent.change(screen.getByLabelText("Status telaah"), {
      target: { value: "Uji disetujui terpisah" },
    });
    kirim();
    expect(await screen.findByRole("alert")).toHaveTextContent(/keputusan/);
    expect(post).not.toHaveBeenCalled();
  });

  it("Alihkan tugas bersyarat tanpa penerima → POST tidak dipanggil", async () => {
    siapkan();
    render(<FormAlternatif masalahId="m1" jabatan={jabatan} accessToken="tok" />);
    isiAlur();
    fireEvent.change(screen.getByLabelText("Opsi"), {
      target: { value: "Alihkan tugas bersyarat" },
    });
    kirim();
    expect(await screen.findByRole("alert")).toHaveTextContent(/penerima/);
    expect(post).not.toHaveBeenCalled();
  });

  it("form lengkap mengirim pemutus_kode_orang terpilih", async () => {
    siapkan();
    post.mockResolvedValueOnce(resp(alt({ status_telaah: "Uji disetujui terpisah" }), 201));
    render(<FormAlternatif masalahId="m1" jabatan={jabatan} accessToken="tok" />);
    isiAlur();
    fireEvent.change(screen.getByLabelText("Status telaah"), {
      target: { value: "Uji disetujui terpisah" },
    });
    fireEvent.change(screen.getByLabelText("Keputusan"), { target: { value: "setuju uji" } });
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "O-0001 — Waka" })).toBeInTheDocument(),
    );
    fireEvent.change(document.querySelector('select[name="pemutus_kode_orang"]') as Element, {
      target: { value: "O-0001" },
    });
    kirim();
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      "/api/v1/redesain/alternatif",
      expect.objectContaining({
        body: expect.objectContaining({
          masalah_id: "m1",
          pemutus_kode_orang: "O-0001",
          status_telaah: "Uji disetujui terpisah",
          keputusan: "setuju uji",
        }),
      }),
    );
    expect(notifySukses).toHaveBeenCalled();
  });

  it("PATCH 422 → toast gagal", async () => {
    siapkan();
    patch.mockResolvedValue(resp(null, 422));
    render(<FormAlternatif masalahId="m1" jabatan={jabatan} awal={alt()} accessToken="tok" />);
    fireEvent.click(await screen.findByRole("button", { name: "Simpan alternatif" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(patch).toHaveBeenCalled();
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"v1"' });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("PATCH 412 → pesan baku data berubah", async () => {
    siapkan();
    patch.mockResolvedValue({
      data: undefined,
      error: { error: { code: "precondition_failed", message: "x" } },
      response: { status: 412, headers: { get: () => "req-1" } },
    });
    render(<FormAlternatif masalahId="m1" jabatan={jabatan} awal={alt()} accessToken="tok" />);
    fireEvent.click(await screen.findByRole("button", { name: "Simpan alternatif" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe(PESAN_DATA_BERUBAH);
  });
});

/** Isian kesiapan yang sah sebagai dasar: semua delta angka terisi. */
const isianSah = (p: Partial<IsianKesiapan> = {}): IsianKesiapan => {
  const a = isianKesiapanAwal();
  return {
    ...a,
    penerima_id: "p1",
    status: "READY",
    delta: {
      asal: { mode: "ANGKA", jam: "1" },
      penerima: { mode: "ANGKA", jam: "2" },
      organisasi: { mode: "ANGKA", jam: "3" },
    },
    ...p,
  };
};

describe("validasiKesiapan", () => {
  it("isian sah tanpa galat", () => expect(validasiKesiapan(isianSah())).toEqual([]));
  it("status tidak punya nilai bawaan", () => {
    expect(isianKesiapanAwal().status).toBe("");
    expect(validasiKesiapan(isianSah({ status: "" }))).toContain("Pilih status kesiapan.");
  });
  it("CONDITIONAL tanpa syarat ditolak, dengan syarat sah", () => {
    expect(validasiKesiapan(isianSah({ status: "CONDITIONAL" }))).toContain(
      "Status CONDITIONAL mewajibkan syarat.",
    );
    expect(validasiKesiapan(isianSah({ status: "CONDITIONAL", syarat: "uji" }))).toEqual([]);
  });
  it("HOLD tanpa alasan ditolak, spasi saja tidak cukup", () => {
    expect(validasiKesiapan(isianSah({ status: "HOLD", alasan_hold: "  " }))).toContain(
      "Status HOLD mewajibkan alasan hold.",
    );
    expect(validasiKesiapan(isianSah({ status: "HOLD", alasan_hold: "belum siap" }))).toEqual([]);
  });
  it("delta angka kosong ditolak; tidak dapat diestimasi sah tanpa angka", () => {
    const kosong = isianSah({
      delta: { ...isianSah().delta, asal: { mode: "ANGKA", jam: "" } },
    });
    expect(validasiKesiapan(kosong).length).toBe(1);
    const nes = isianSah({
      delta: { ...isianSah().delta, asal: { mode: "NOT_ESTIMABLE", jam: "" } },
    });
    expect(validasiKesiapan(nes)).toEqual([]);
  });
  it("payload: NOT_ESTIMABLE mengirim jam null, angka 0 tetap 0, syarat hanya bila CONDITIONAL", () => {
    const b = payloadKesiapan(
      isianSah({
        status: "CONDITIONAL",
        syarat: " uji ",
        alasan_hold: "diabaikan",
        delta: {
          asal: { mode: "NOT_ESTIMABLE", jam: "9" },
          penerima: { mode: "ANGKA", jam: "0" },
          organisasi: { mode: "ANGKA", jam: "3" },
        },
      }),
      "2026/27",
    );
    expect(b.delta_asal_jam).toBeNull();
    expect(b.delta_asal_estimasi).toBe("NOT_ESTIMABLE");
    expect(b.delta_penerima_jam).toBe(0);
    expect(b.delta_penerima_estimasi).toBe("ESTIMATED");
    expect(b.syarat).toBe("uji");
    expect(b.alasan_hold).toBeNull();
    expect(b.periode).toBe("2026/27");
  });
});

describe("formatDelta", () => {
  it("nilai menjadi angka berformat", () =>
    expect(formatDelta("12.50", "ESTIMATED")).toBe("12,5 jam"));
  it("0 tetap 0", () => expect(formatDelta("0.00", "ESTIMATED")).toBe("0 jam"));
  it("NOT_ESTIMABLE tampil teks, tidak pernah 0", () => {
    expect(formatDelta(null, "NOT_ESTIMABLE")).toBe("Tidak dapat diestimasi");
    expect(formatDelta("0", "NOT_ESTIMABLE")).toBe("Tidak dapat diestimasi");
  });
  it("belum dinilai tampil strip", () => expect(formatDelta(null, null)).toBe("—"));
});

describe("periode", () => {
  it("tahun ajaran berjalan dimulai Juli", () => {
    expect(periodeBerjalan(new Date(2026, 10, 12))).toBe("2026/27");
    expect(periodeBerjalan(new Date(2026, 4, 1))).toBe("2025/26");
    expect(periodeBerjalan(new Date(2099, 7, 1))).toBe("2099/00");
  });
  it("validasi pola YYYY/YY", () => {
    expect(periodeValid("2026/27")).toBe(true);
    expect(periodeValid("2026-27")).toBe(false);
    expect(periodeValid("TA 2026/27")).toBe(false);
  });
});

describe("opsiKeputusanAktif", () => {
  it("READY: semua aktif", () =>
    expect(opsiKeputusanAktif("READY")).toEqual({
      APPROVE: true,
      CONDITIONAL: true,
      HOLD: true,
      REJECT: true,
    }));
  it("CONDITIONAL: APPROVE nonaktif", () =>
    expect(opsiKeputusanAktif("CONDITIONAL")).toMatchObject({ APPROVE: false, CONDITIONAL: true }));
  it("HOLD: APPROVE dan CONDITIONAL nonaktif", () =>
    expect(opsiKeputusanAktif("HOLD")).toEqual({
      APPROVE: false,
      CONDITIONAL: false,
      HOLD: true,
      REJECT: true,
    }));
  it("validasi keputusan perubahan: alasan 5 karakter, stop rule untuk CONDITIONAL", () => {
    expect(validasiKeputusanPerubahan({ keputusan: "", alasan: "", stop_rule: "" }).length).toBe(2);
    expect(
      validasiKeputusanPerubahan({ keputusan: "CONDITIONAL", alasan: "cukup", stop_rule: "" }),
    ).toContain("Keputusan CONDITIONAL mewajibkan stop rule.");
    expect(
      validasiKeputusanPerubahan({ keputusan: "REJECT", alasan: "cukup", stop_rule: "" }),
    ).toEqual([]);
  });
});

describe("matriks kesiapan pada detail masalah", () => {
  const render1 = async (sp: Record<string, string> = {}) => {
    const ui = await DetailMasalahPage({
      params: Promise.resolve({ id: "m1" }),
      searchParams: Promise.resolve({ bagian: "alternatif", ...sp }),
    });
    render(ui);
  };

  it("merender baris BELUM_DINILAI, label jabatan, dan delta tidak dapat diestimasi", async () => {
    siapkan();
    await render1({ periode: "2026/27" });
    const tabel = screen.getAllByRole("table")[1];
    expect(within(tabel).getByText("Staf Tata Usaha")).toBeInTheDocument();
    expect(within(tabel).getByText("Wakil Kepala Sekolah")).toBeInTheDocument();
    expect(within(tabel).queryByText("j1")).toBeNull();
    expect(screen.getByTestId("belum-dinilai")).toHaveTextContent("Belum dinilai");
    expect(within(tabel).getByText("Tidak dapat diestimasi")).toBeInTheDocument();
    expect(within(tabel).getByText("0 jam")).toBeInTheDocument();
    expect(within(tabel).getByText("-2,5 jam")).toBeInTheDocument();
    expect(screen.getByTestId("status-opsi")).toHaveTextContent("HOLD");
    // periode kueri diteruskan ke backend
    const panggilan = get.mock.calls.find(
      (c) => c[0] === "/api/v1/redesain/alternatif/{alternatif_id}/kesiapan",
    );
    expect(panggilan?.[1].params.query.periode).toBe("2026/27");
  });

  it("tanpa ?periode= memakai tahun ajaran berjalan", async () => {
    siapkan();
    await render1();
    const panggilan = get.mock.calls.find(
      (c) => c[0] === "/api/v1/redesain/alternatif/{alternatif_id}/kesiapan",
    );
    expect(panggilan?.[1].params.query.periode).toBe(periodeBerjalan());
  });

  it("respons matriks 500 melempar, bukan tabel kosong", async () => {
    siapkan([alt()], { statusKesiapanGagal: true });
    await expect(render1()).rejects.toBeInstanceOf(ApiError);
  });

  it("periode tak valid menampilkan galat tanpa memanggil matriks", async () => {
    siapkan();
    await render1({ periode: "salah" });
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("YYYY/YY");
    expect(
      get.mock.calls.some((c) => c[0] === "/api/v1/redesain/alternatif/{alternatif_id}/kesiapan"),
    ).toBe(false);
  });

  it("saklar CHANGE_AUTHORIZATION hidup: form keputusan perubahan tampil", async () => {
    siapkan();
    await render1({ periode: "2026/27" });
    expect(screen.getByText(JUDUL_KEPUTUSAN_PERUBAHAN)).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Form keputusan perubahan" })).toBeInTheDocument();
  });

  it("saklar mati: form tidak dirender, riwayat tetap tampil", async () => {
    siapkan([alt()], {
      saklar: false,
      riwayat: [
        {
          id: "k1",
          alternatif_id: "a1",
          periode: "2026/27",
          keputusan: "HOLD",
          alasan: "Menunggu kesiapan",
          stop_rule: null,
          status_opsi_saat_putus: "HOLD",
          pemutus_kode_orang: "O-0001",
          created_at: "2026-11-10T01:00:00Z",
        },
      ],
    });
    await render1({ periode: "2026/27" });
    expect(screen.getByText(JUDUL_KEPUTUSAN_PERUBAHAN)).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Form keputusan perubahan" })).toBeNull();
    expect(screen.getByText("Menunggu kesiapan")).toBeInTheDocument();
  });
});

describe("FormKesiapan dan FormKeputusanPerubahan", () => {
  it("CONDITIONAL tanpa syarat: tidak memanggil POST dan menampilkan galat", async () => {
    render(
      <FormKesiapan
        alternatifId="a1"
        periode="2026/27"
        penerima={[{ id: "p1", label: "Staf Tata Usaha" }]}
        accessToken="tok"
      />,
    );
    fireEvent.change(screen.getByLabelText("Penerima kesiapan"), { target: { value: "p1" } });
    fireEvent.change(screen.getByLabelText("Status kesiapan"), {
      target: { value: "CONDITIONAL" },
    });
    for (const s of ["pihak asal", "penerima", "organisasi"]) {
      fireEvent.change(screen.getByLabelText(`Jam Delta ${s}`), { target: { value: "1" } });
    }
    fireEvent.click(screen.getByRole("button", { name: /Catat kesiapan/ }));
    expect(await screen.findByText("Status CONDITIONAL mewajibkan syarat.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("kirim sah: POST dengan Idempotency-Key, sukses setelah 2xx lalu refresh", async () => {
    post.mockResolvedValue(resp({ id: "ks1" }, 201));
    render(
      <FormKesiapan
        alternatifId="a1"
        periode="2026/27"
        penerima={[{ id: "p1", label: "Staf Tata Usaha" }]}
        accessToken="tok"
      />,
    );
    fireEvent.change(screen.getByLabelText("Penerima kesiapan"), { target: { value: "p1" } });
    fireEvent.change(screen.getByLabelText("Status kesiapan"), { target: { value: "READY" } });
    fireEvent.change(screen.getByLabelText("Mode Delta pihak asal"), {
      target: { value: "NOT_ESTIMABLE" },
    });
    fireEvent.change(screen.getByLabelText("Jam Delta penerima"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Jam Delta organisasi"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: /Catat kesiapan/ }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, opsi] = post.mock.calls[0];
    expect(path).toBe("/api/v1/redesain/alternatif/{alternatif_id}/kesiapan");
    expect(opsi.body.delta_asal_jam).toBeNull();
    expect(opsi.body.delta_penerima_jam).toBe(0);
    expect(opsi.headers["Idempotency-Key"]).toBeTruthy();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(notifySukses).toHaveBeenCalled();
  });

  it("keputusan perubahan: APPROVE nonaktif bila opsi bukan READY; galat 409 ditampilkan", async () => {
    post.mockResolvedValue({
      data: undefined,
      error: { error: "KESIAPAN_HOLD", message: "Opsi masih HOLD." },
      response: { status: 409, headers: { get: () => "req-9" } },
    });
    render(
      <FormKeputusanPerubahan
        alternatifId="a1"
        periode="2026/27"
        statusOpsi="HOLD"
        accessToken="tok"
      />,
    );
    expect(screen.getByRole("option", { name: "APPROVE" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "CONDITIONAL" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "REJECT" })).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText("Keputusan perubahan"), { target: { value: "HOLD" } });
    fireEvent.change(screen.getByLabelText("Alasan keputusan perubahan"), {
      target: { value: "Menunggu kesiapan" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Catat keputusan perubahan" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(refresh).not.toHaveBeenCalled();
  });
});
