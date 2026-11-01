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
import { validasiAlternatif, JUDUL_ALTERNATIF } from "@/lib/redesain-alternatif";
import type { AlternatifRead } from "@/lib/api/schema";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: "x", message: "ditolak" },
  response: { status, headers: { get: () => "req-1" } },
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

function siapkan(daftar: AlternatifRead[] = [alt()]) {
  get.mockImplementation(async (path: string) => {
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
    const tabel = screen.getByRole("table");
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
    fireEvent.click(screen.getByRole("button", { name: "Simpan alternatif" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(patch).toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
