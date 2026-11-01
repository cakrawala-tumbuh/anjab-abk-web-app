import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
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

import SesiPage from "@/app/(auth)/redesain/sesi/page";
import RekapSesiPage from "@/app/(auth)/redesain/sesi/rekap/page";
import { SesiForm } from "@/app/(auth)/redesain/sesi/sesi-form";
import { ApiError } from "@/lib/api/errors";
import {
  bacaFilterSesi,
  domainSesi,
  formatMenit,
  querySesi,
  labelMasalahTema,
} from "@/lib/redesain-sesi";
import type { KonteksRead, MasalahRead, SekolahRead, SesiRead } from "@/lib/api/schema";

const resp = (data: unknown, status = 200) => ({
  data: status < 400 ? data : undefined,
  error: status < 400 ? undefined : { error: "x", message: "ditolak" },
  response: { status, headers: { get: () => "req-1" } },
});
const halaman = (items: unknown[], total = items.length) =>
  resp({ items, total, limit: 500, offset: 0 });

const konteks = { id: "k1", kode: "K-01", tema: "Beban administrasi guru" } as KonteksRead;
const sekolah = { id: "s1", nama: "SD Contoh Bandung" } as SekolahRead;
const masalahRow = { id: "m1", kode: "M-K01-01", konteks_id: "k1" } as MasalahRead;
const sesiRow = (p: Partial<SesiRead> = {}): SesiRead => ({
  id: "x1",
  kode_sesi: "S-01",
  kode_orang: "O-0001",
  sekolah_id: "s1",
  peran: "Guru kelas",
  jenis_kegiatan: "Klarifikasi",
  menit_rencana: 60,
  menit_disepakati: null,
  waktu_kalender: null,
  catatan: null,
  status_izin: "Belum ditetapkan",
  versi_izin: null,
  pic_kode_orang: null,
  tindak_lanjut: null,
  masalah_ids: [],
  created_at: "2026-11-01T00:00:00Z",
  updated_at: "2026-11-01T00:00:00Z",
  ...p,
});

function siapkanGet() {
  get.mockImplementation(async (path: string) => {
    if (path === "/api/v1/sekolah") return halaman([sekolah]);
    if (path === "/api/v1/redesain/masalah") return halaman([masalahRow]);
    if (path === "/api/v1/redesain/konteks") return halaman([konteks]);
    if (path === "/api/v1/redesain/kode-orang")
      return halaman([
        { id: "ko1", kode: "O-0001", keterangan_peran: "Guru" },
        { id: "ko2", kode: "O-0002", keterangan_peran: null },
      ]);
    return resp(null, 404);
  });
}

beforeEach(() => {
  [get, post, patch, refresh, push, notifyGagal, notifySukses].forEach((m) => m.mockReset());
  authMock.mockResolvedValue({ accessToken: "tok" });
  siapkanGet();
});

const props = {
  sekolah: [sekolah],
  masalah: [masalahRow],
  konteks: [konteks],
  accessToken: "tok",
};

async function isiMinimal() {
  await screen.findAllByRole("option", { name: "O-0001 — Guru" });
  const sel = document.querySelector('select[name="kode_orang"]') as HTMLSelectElement;
  fireEvent.change(sel, { target: { value: "O-0001" } });
  fireEvent.change(screen.getByLabelText(/Kode sesi/), { target: { value: "S-09" } });
  fireEvent.change(screen.getByLabelText("Peran"), { target: { value: "Guru kelas" } });
}

describe("logika murni sesi", () => {
  it("filter query string → domain search dan sebaliknya", () => {
    const f = bacaFilterSesi({ sesi: "S-01", izin: "Tidak diotorisasi" });
    expect(domainSesi(f)).toEqual([
      ["kode_sesi", "=", "S-01"],
      ["status_izin", "=", "Tidak diotorisasi"],
    ]);
    expect(querySesi(f)).toBe("sesi=S-01&izin=Tidak+diotorisasi");
    expect(domainSesi(bacaFilterSesi({}))).toEqual([]);
  });
  it("formatMenit: null → em dash, 0 tetap 0", () => {
    expect(formatMenit(null)).toBe("—");
    expect(formatMenit(0)).toBe("0");
    expect(formatMenit(45)).toBe("45");
  });
  it("labelMasalahTema: kode — tema konteks", () => {
    expect(labelMasalahTema(masalahRow, new Map([["k1", konteks]]))).toBe(
      "M-K01-01 — Beban administrasi guru",
    );
  });
});

describe("index sesi", () => {
  it("meneruskan filter query string ke body POST /sesi/search dan merender nama sekolah", async () => {
    post.mockResolvedValue(halaman([sesiRow()]));
    render(
      await SesiPage({
        searchParams: Promise.resolve({ orang: "O-0001", jenis: "Klarifikasi" }),
      }),
    );
    expect(post).toHaveBeenCalledWith(
      "/api/v1/redesain/sesi/search",
      expect.objectContaining({
        body: expect.objectContaining({
          domain: [
            ["kode_orang", "=", "O-0001"],
            ["jenis_kegiatan", "=", "Klarifikasi"],
          ],
        }),
      }),
    );
    expect(screen.getByText("SD Contoh Bandung")).toBeInTheDocument();
    expect(screen.getAllByText("Catatan ini BUKAN Time Study").length).toBeGreaterThan(0);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
  it("gagal backend melempar, bukan tabel kosong", async () => {
    post.mockResolvedValue(resp(null, 403));
    await expect(SesiPage({ searchParams: Promise.resolve({}) })).rejects.toBeInstanceOf(ApiError);
  });
});

describe("form sesi", () => {
  it("mengirim masalah_ids terpilih dan menit_disepakati: null bila kosong", async () => {
    post.mockResolvedValue(resp(sesiRow()));
    render(<SesiForm {...props} />);
    await isiMinimal();
    fireEvent.click(screen.getByRole("checkbox", { name: /M-K01-01 — Beban administrasi guru/ }));
    fireEvent.submit(screen.getByRole("button", { name: "Catat sesi" }).closest("form")!);
    await waitFor(() => expect(post).toHaveBeenCalled());
    const body = post.mock.calls[0][1].body;
    expect(body.masalah_ids).toEqual(["m1"]);
    expect(body.menit_disepakati).toBeNull();
    expect(body.menit_rencana).toBeNull();
    await waitFor(() => expect(notifySukses).toHaveBeenCalled());
  });
  it("menit negatif ditolak validasi klien tanpa memanggil API", async () => {
    render(<SesiForm {...props} />);
    await isiMinimal();
    fireEvent.change(screen.getByLabelText("Menit rencana"), { target: { value: "-5" } });
    fireEvent.submit(screen.getByRole("button", { name: "Catat sesi" }).closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(/bilangan bulat 0 atau lebih/);
    expect(post).not.toHaveBeenCalled();
  });
  it("POST 409 menampilkan pesan pasangan ganda, tanpa toast sukses", async () => {
    post.mockResolvedValue(resp(null, 409));
    render(<SesiForm {...props} />);
    await isiMinimal();
    fireEvent.submit(screen.getByRole("button", { name: "Catat sesi" }).closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Orang ini sudah tercatat di sesi tersebut",
    );
    expect(notifySukses).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
  it("status 'Tidak diotorisasi' tetap memanggil POST tanpa peringatan pemblokir", async () => {
    post.mockResolvedValue(resp(sesiRow({ status_izin: "Tidak diotorisasi" })));
    render(<SesiForm {...props} />);
    await isiMinimal();
    fireEvent.change(screen.getByLabelText("Status izin"), {
      target: { value: "Tidak diotorisasi" },
    });
    expect(
      screen.getByText("Status izin hanya informasi; tidak menghalangi pencatatan"),
    ).toBeInTheDocument();
    fireEvent.submit(screen.getByRole("button", { name: "Catat sesi" }).closest("form")!);
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body.status_izin).toBe("Tidak diotorisasi");
    expect(notifyGagal).not.toHaveBeenCalled();
  });
  it("mode ubah memakai PATCH dengan id sesi", async () => {
    patch.mockResolvedValue(resp(sesiRow()));
    render(<SesiForm {...props} awal={sesiRow()} />);
    await screen.findAllByRole("option", { name: "O-0001 — Guru" });
    fireEvent.submit(screen.getByRole("button", { name: "Simpan perubahan" }).closest("form")!);
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(patch.mock.calls[0][1].params.path.sesi_id).toBe("x1");
  });
});

describe("rekap sesi", () => {
  it("merender — untuk null dan angka untuk nilai", async () => {
    get.mockResolvedValue(
      halaman([
        {
          kode_orang: "O-0001",
          jumlah_sesi: 3,
          total_menit_rencana: 120,
          total_menit_disepakati: null,
        },
      ]),
    );
    render(await RekapSesiPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0")).toBeNull();
  });
  it("403 melempar ApiError", async () => {
    get.mockResolvedValue(resp(null, 403));
    await expect(RekapSesiPage({ searchParams: Promise.resolve({}) })).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
