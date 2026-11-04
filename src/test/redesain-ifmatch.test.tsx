import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const get = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, PATCH: patch, POST: vi.fn() }),
}));
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh }) }));
const notifyGagal = vi.fn();
const notifySukses = vi.fn();
vi.mock("@/lib/notify", async (orig) => ({
  ...(await orig<typeof import("@/lib/notify")>()),
  notifyGagal: (e: unknown) => notifyGagal(e),
  notifySukses: (m: string) => notifySukses(m),
}));

import { FormLangkah } from "@/app/(auth)/redesain/masalah/[id]/form-langkah";
import { FormProses } from "@/app/(auth)/redesain/masalah/[id]/form-proses";
import { KonteksForm } from "@/app/(auth)/redesain/konteks/konteks-form";
import { UbahKeterangan } from "@/app/(auth)/redesain/kode-orang/ubah-keterangan";
import { SelCabang } from "@/app/(auth)/redesain/cakupan-jabatan/sel-cabang";
import { WizardKonfirmasi } from "@/app/(auth)/redesain-sekolah/konfirmasi/[id]/wizard";
import { DetailsMuatMalas } from "@/components/details-muat-malas";
import { PESAN_DATA_BERUBAH } from "@/lib/konkurensi";
import { useRekamanBerEtag } from "@/lib/use-rekaman-ber-etag";

/** Respons GET/PATCH sukses dengan header ETag. */
const ok = (data: unknown, etag: string | null = '"v1"') => ({
  data,
  error: undefined,
  response: {
    status: 200,
    headers: { get: (n: string) => (n.toLowerCase() === "etag" ? etag : "req-1") },
  },
});
const gagal = (status: number, code = "x") => ({
  data: undefined,
  error: { error: { code, message: "ditolak" } },
  response: { status, headers: { get: () => "req-1" } },
});
const tak412 = () => gagal(412, "precondition_failed");

const langkahRec = {
  id: "l1",
  kode: "P-001-S01",
  urutan: 1,
  tahap: "Pengumpulan",
  pemicu_input: "p",
  pelaksana: "Waka",
  pekerjaan_sistem: "s",
  keluaran_penerima: "k",
  pemeriksa_pemutus: null,
  hambatan: null,
  status_langkah: "Hipotesis",
};
const prosesRec = {
  id: "p1",
  kode: "P-001",
  masalah_id: "m1",
  sekolah_id: "s1",
  periode: "TA 2026/27",
  nama_proses: "Penyusunan jadwal",
  langkah: [],
};
const konteksRec = {
  id: "k1",
  kode: "K-01",
  tema: "Beban administrasi",
  gelombang: "G1",
  ruang_dugaan: "r",
  sumber_draft: "s",
  batas_pemeriksaan: "b",
  aktif: true,
};
const cakupanRec = {
  id: "c1",
  role_kode: "R-01",
  cabang: "Bandung",
  jabatan_id: null,
  status_unit: "Ada",
  pemegang_diperiksa: "Belum",
  inventori_ditinjau: "Belum",
  peta_diperkuat: "Belum",
  gap_variasi: null,
  pic_kode_orang: null,
};

beforeEach(() => {
  [get, patch, refresh, notifyGagal, notifySukses].forEach((m) => m.mockReset());
});

describe("useRekamanBerEtag", () => {
  it("mengembalikan data dan ETag dari respons yang sama", async () => {
    get.mockResolvedValue(ok({ id: "x" }, '"tag-9"'));
    const { result } = renderHook(() =>
      useRekamanBerEtag<{ id: string }>({
        accessToken: "tok",
        kunci: "x",
        ambil: (c) =>
          c.GET("/api/v1/redesain/konteks/{konteks_id}", {
            params: { path: { konteks_id: "x" } },
          }) as never,
      }),
    );
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ id: "x" });
    expect(result.current.etag).toBe('"tag-9"');
    expect(result.current.error).toBeNull();
  });

  it("GET gagal → error terisi dan data kosong (bukan data kosong sah)", async () => {
    get.mockResolvedValue(gagal(403));
    const { result } = renderHook(() =>
      useRekamanBerEtag<{ id: string }>({
        accessToken: "tok",
        kunci: "x",
        ambil: (c) =>
          c.GET("/api/v1/redesain/konteks/{konteks_id}", {
            params: { path: { konteks_id: "x" } },
          }) as never,
      }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
  });

  it("aktif=false tidak memanggil GET", () => {
    renderHook(() =>
      useRekamanBerEtag({
        accessToken: "tok",
        kunci: "x",
        aktif: false,
        ambil: (c) => c.GET("/api/v1/redesain/konteks/{konteks_id}", {} as never) as never,
      }),
    );
    expect(get).not.toHaveBeenCalled();
  });
});

describe("DetailsMuatMalas", () => {
  it("isi baru dirender setelah panel dibuka", () => {
    render(
      <DetailsMuatMalas ringkasan="Ubah">
        <p>ISI-FORM</p>
      </DetailsMuatMalas>,
    );
    expect(screen.queryByText("ISI-FORM")).toBeNull();
    const d = screen.getByText("Ubah").closest("details")!;
    d.open = true;
    fireEvent(d, new Event("toggle"));
    expect(screen.getByText("ISI-FORM")).toBeInTheDocument();
  });
});

describe("FormLangkah", () => {
  it("ubah memakai GET /langkah/{langkah_id} lalu PATCH ber-If-Match", async () => {
    get.mockResolvedValue(ok(langkahRec, '"l-1"'));
    patch.mockResolvedValue(ok(langkahRec, '"l-2"'));
    render(<FormLangkah prosesId="p1" awal={langkahRec as never} accessToken="tok" />);
    fireEvent.click(await screen.findByRole("button", { name: "Simpan langkah" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(get.mock.calls[0][0]).toBe("/api/v1/redesain/langkah/{langkah_id}");
    expect(get.mock.calls[0][1].params.path.langkah_id).toBe("l1");
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"l-1"' });
  });

  it("PATCH 412 → pesan baku, isian tetap", async () => {
    get.mockResolvedValue(ok(langkahRec));
    patch.mockResolvedValue(tak412());
    render(<FormLangkah prosesId="p1" awal={langkahRec as never} accessToken="tok" />);
    fireEvent.click(await screen.findByRole("button", { name: "Simpan langkah" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe(PESAN_DATA_BERUBAH);
    expect(screen.getByDisplayValue("Pengumpulan")).toBeInTheDocument();
  });

  it("tambah tidak melakukan GET detail", () => {
    render(<FormLangkah prosesId="p1" accessToken="tok" />);
    expect(get).not.toHaveBeenCalled();
  });
});

describe("FormProses", () => {
  it("ubah: PATCH membawa If-Match dari GET /proses/{proses_id}", async () => {
    get.mockResolvedValue(ok(prosesRec, '"p-1"'));
    patch.mockResolvedValue(ok(prosesRec));
    render(
      <FormProses
        masalahId="m1"
        sekolahTerkunci="s1"
        sekolah={[] as never}
        periodeBawaan="TA"
        awal={prosesRec as never}
        accessToken="tok"
      />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "Simpan proses" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"p-1"' });
  });
});

describe("KonteksForm", () => {
  it("ubah: PATCH membawa If-Match; 412 → pesan baku", async () => {
    get.mockResolvedValue(ok(konteksRec, '"k-1"'));
    patch.mockResolvedValueOnce(tak412());
    render(<KonteksForm awal={konteksRec as never} accessToken="tok" />);
    fireEvent.click(await screen.findByRole("button", { name: "Simpan perubahan" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"k-1"' });
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe(PESAN_DATA_BERUBAH);
  });
});

describe("UbahKeterangan", () => {
  it("GET baru dipanggil saat Ubah diklik (bukan saat dirender); PATCH ber-If-Match", async () => {
    get.mockResolvedValue(ok({ id: "ko1", keterangan_peran: "Guru" }, '"o-1"'));
    patch.mockResolvedValue(ok({ id: "ko1" }, '"o-2"'));
    render(<UbahKeterangan id="ko1" awal="Guru" accessToken="tok" />);
    expect(get).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ubah" }));
    const input = await screen.findByLabelText("Keterangan peran");
    fireEvent.change(input, { target: { value: "Narsum" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(get.mock.calls[0][0]).toBe("/api/v1/redesain/kode-orang/{kode_orang_id}");
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"o-1"' });
  });
});

describe("SelCabang", () => {
  it("sel-cabang mengirim If-Match dari GET detail yang dimuat saat panel dibuka", async () => {
    get.mockResolvedValue(ok(cakupanRec, '"c-1"'));
    patch.mockResolvedValue(ok(cakupanRec, '"c-2"'));
    render(<SelCabang rec={cakupanRec as never} jabatan={[]} accessToken="tok" />);
    expect(get).not.toHaveBeenCalled();
    const d = screen.getByText(/Ubah Bandung/).closest("details")!;
    d.open = true;
    fireEvent(d, new Event("toggle"));
    fireEvent.click(await screen.findByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(get.mock.calls[0][0]).toBe("/api/v1/redesain/cakupan-jabatan/{cakupan_id}");
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"c-1"' });
  });
});

describe("WizardKonfirmasi — ETag berantai", () => {
  const konf = {
    id: "kf1",
    masalah_id: "m1",
    status: "draf",
    cerita_sebelum: "Cerita",
    cerita_dikunci_pada: null,
    dugaan_ditampilkan_pada: null,
  };
  const masalah = {
    id: "m1",
    kode: "M-001",
    konteks_kode: "K-01",
    konteks_tema: "Administrasi",
    periode_acuan: "2026",
    sumber_awal_keterbatasan: "Wawancara",
    status_awal: "Terkonfirmasi",
  };

  it("dua PATCH berturut-turut memakai ETag dari respons PATCH sebelumnya", async () => {
    patch.mockResolvedValueOnce(ok({}, '"e1"')).mockResolvedValueOnce(ok({}, '"e2"'));
    render(
      <WizardKonfirmasi
        konfirmasi={konf as never}
        masalah={masalah as never}
        dugaanAwal={null}
        etag={'"e0"'}
        accessToken="tok"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Simpan draf" }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("button", { name: "Simpan draf" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Simpan draf" }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(2));
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"e0"' });
    expect(patch.mock.calls[1][1].headers).toEqual({ "If-Match": '"e1"' });
  });

  it("PATCH 412 → pesan baku, isian cerita tidak hilang", async () => {
    patch.mockResolvedValueOnce(tak412());
    render(
      <WizardKonfirmasi
        konfirmasi={konf as never}
        masalah={masalah as never}
        dugaanAwal={null}
        etag={'"e0"'}
        accessToken="tok"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Simpan draf" }));
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe(PESAN_DATA_BERUBAH);
    expect(screen.getByDisplayValue("Cerita")).toBeInTheDocument();
  });
});

describe("jaring pengaman — PATCH redesain tanpa headerIfMatch", () => {
  /** Kumpulkan berkas .tsx/.ts non-test di bawah dua segmen redesain. */
  function kumpulkan(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) return kumpulkan(p);
      return /\.tsx?$/.test(n) ? [p] : [];
    });
  }

  it("setiap berkas yang memanggil .PATCH( redesain menyertakan headerIfMatch", () => {
    const akar = join(process.cwd(), "src/app/(auth)");
    const berkas = [
      ...kumpulkan(join(akar, "redesain")),
      ...kumpulkan(join(akar, "redesain-sekolah")),
    ];
    const pemanggil = berkas.filter((f) => /\.PATCH\(/.test(readFileSync(f, "utf8")));
    expect(pemanggil.length).toBeGreaterThanOrEqual(12);
    const tanpa = pemanggil.filter((f) => !readFileSync(f, "utf8").includes("headerIfMatch"));
    expect(tanpa).toEqual([]);
  });
});
