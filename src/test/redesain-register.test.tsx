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

import MasalahPage from "@/app/(auth)/redesain/masalah/page";
import KonteksPage from "@/app/(auth)/redesain/konteks/page";
import { PESAN_DATA_BERUBAH } from "@/lib/konkurensi";
import { MasalahForm } from "@/app/(auth)/redesain/masalah/masalah-form";
import { ToggleKonfirmasi } from "@/app/(auth)/redesain/masalah/toggle-konfirmasi";
import { KonteksForm } from "@/app/(auth)/redesain/konteks/konteks-form";
import {
  bacaFilterMasalah,
  domainMasalah,
  labelKonteks,
  labelSekolah,
  queryFilterMasalah,
} from "@/lib/redesain-register";
import type { KonteksRead, MasalahRead, SekolahRead, UraianTugasRead } from "@/lib/api/schema";

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
/** GET detail masalah berisi `data`+ETag; path lain tetap dilayani `siapkanGet`. */
function getDetailMasalah(data: unknown, etag = '"v1"') {
  const dasar = get.getMockImplementation()!;
  get.mockImplementation(async (path: string, ...r: unknown[]) =>
    path === "/api/v1/redesain/masalah/{masalah_id}" ? respEtag(data, etag) : dasar(path, ...r),
  );
}
const halaman = (items: unknown[], total = items.length) =>
  resp({ items, total, limit: 500, offset: 0 });

const konteks: KonteksRead = {
  id: "k1",
  kode: "K-01",
  tema: "Beban administrasi guru",
  gelombang: "G1",
  ruang_dugaan: "r",
  sumber_draft: "s",
  batas_pemeriksaan: "b",
  aktif: true,
  created_at: "2026-11-01T00:00:00Z",
  updated_at: "2026-11-01T00:00:00Z",
};
const sekolah = { id: "s1", nama: "SD Contoh Bandung" } as SekolahRead;
const uraian = { id: "u1", uraian: "Menyusun perangkat ajar" } as UraianTugasRead;
const masalah = (p: Partial<MasalahRead> = {}): MasalahRead => ({
  id: "m1",
  kode: "M-K01-01",
  konteks_id: "k1",
  sekolah_id: "s1",
  keterangan_sekolah: null,
  periode_acuan: "TA 2026/27",
  periode_pasti: false,
  rumusan_hipotesis: "h",
  sumber_awal_keterbatasan: "s",
  status_awal: "Hipotesis",
  gelombang: "G1",
  penjelasan_alternatif: null,
  pic_kode_orang: null,
  dibuka_untuk_konfirmasi: false,
  status_awal_dibekukan_pada: null,
  uraian_tugas_ids: [],
  created_at: "2026-11-01T00:00:00Z",
  updated_at: "2026-11-01T00:00:00Z",
  ...p,
});

function siapkanGet(opts: { konteksGagal?: boolean } = {}) {
  get.mockImplementation(async (path: string) => {
    if (path === "/api/v1/redesain/konteks")
      return opts.konteksGagal ? resp(null, 403) : halaman([konteks]);
    if (path === "/api/v1/sekolah") return halaman([sekolah]);
    if (path === "/api/v1/task-inventory/uraian-tugas") return halaman([uraian]);
    if (path === "/api/v1/redesain/kode-orang") return halaman([]);
    return resp(null, 404);
  });
}

beforeEach(() => {
  [get, post, patch, refresh, push, notifyGagal, notifySukses].forEach((m) => m.mockReset());
  authMock.mockResolvedValue({ accessToken: "tok" });
  siapkanGet();
});

describe("logika murni register", () => {
  it("bacaFilterMasalah + domainMasalah memuat status_awal", () => {
    const f = bacaFilterMasalah({ status: "Hipotesis", dibuka: "ya" });
    expect(domainMasalah(f)).toEqual([
      ["status_awal", "=", "Hipotesis"],
      ["dibuka_untuk_konfirmasi", "=", true],
    ]);
    expect(queryFilterMasalah(f)).toBe("status=Hipotesis&dibuka=ya");
    expect(domainMasalah(bacaFilterMasalah({}))).toEqual([]);
  });

  it("labelSekolah: nama master, keterangan, atau Belum ditetapkan", () => {
    const peta = new Map([[sekolah.id, sekolah]]);
    expect(labelSekolah(masalah(), peta)).toBe("SD Contoh Bandung");
    expect(
      labelSekolah(masalah({ sekolah_id: null, keterangan_sekolah: "TK Semarang" }), peta),
    ).toBe("TK Semarang");
    expect(labelSekolah(masalah({ sekolah_id: null }), peta)).toBe("Belum ditetapkan");
    expect(labelKonteks("k1", new Map([["k1", konteks]]))).toBe("K-01 — Beban administrasi guru");
  });
});

describe("index masalah", () => {
  it("merender kode, label konteks, dan nama sekolah (bukan id)", async () => {
    post.mockResolvedValue(halaman([masalah()]));
    render(await MasalahPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("M-K01-01")).toBeInTheDocument();
    expect(screen.getAllByText("K-01 — Beban administrasi guru").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SD Contoh Bandung").length).toBeGreaterThan(0);
    expect(screen.queryByText("s1")).toBeNull();
  });

  it("meneruskan filter query string ke body POST /masalah/search", async () => {
    post.mockResolvedValue(halaman([masalah()]));
    render(await MasalahPage({ searchParams: Promise.resolve({ status: "Hipotesis" }) }));
    expect(post).toHaveBeenCalledWith(
      "/api/v1/redesain/masalah/search",
      expect.objectContaining({
        body: expect.objectContaining({ domain: [["status_awal", "=", "Hipotesis"]] }),
      }),
    );
  });

  it("sekolah null menampilkan keterangan_sekolah atau 'Belum ditetapkan'", async () => {
    post.mockResolvedValue(
      halaman([
        masalah({ id: "a", kode: "M-A", sekolah_id: null, keterangan_sekolah: "TK Semarang" }),
        masalah({ id: "b", kode: "M-B", sekolah_id: null, keterangan_sekolah: null }),
      ]),
    );
    render(await MasalahPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("TK Semarang")).toBeInTheDocument();
    expect(screen.getByText("Belum ditetapkan")).toBeInTheDocument();
  });

  it("respons 403 melempar ApiError, bukan tabel kosong", async () => {
    post.mockResolvedValue(resp(null, 403));
    await expect(MasalahPage({ searchParams: Promise.resolve({}) })).rejects.toThrow();
  });
});

describe("toggle konfirmasi", () => {
  it("mengirim {dibuka: true} untuk masalah tertutup lalu refresh", async () => {
    post.mockResolvedValue(resp(masalah({ dibuka_untuk_konfirmasi: true })));
    render(<ToggleKonfirmasi id="m1" dibuka={false} accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: /Buka untuk konfirmasi sekolah/ }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      "/api/v1/redesain/masalah/{masalah_id}/status-konfirmasi",
      expect.objectContaining({ body: { dibuka: true } }),
    );
  });

  it("mengirim {dibuka: false} untuk masalah terbuka", async () => {
    post.mockResolvedValue(resp(masalah()));
    render(<ToggleKonfirmasi id="m1" dibuka={true} accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1].body).toEqual({ dibuka: false });
  });
});

describe("form masalah", () => {
  const props = {
    konteks: [konteks],
    sekolah: [sekolah],
    uraianTugas: [uraian],
    accessToken: "tok",
  };

  it("status_awal nonaktif + keterangan bila sudah dibekukan", async () => {
    const beku = masalah({ status_awal_dibekukan_pada: "2026-11-02T08:00:00Z" });
    getDetailMasalah(beku);
    render(<MasalahForm {...props} awal={beku} />);
    expect(await screen.findByLabelText("Status awal")).toBeDisabled();
    expect(
      screen.getByText(/Dibekukan sejak 2026-11-02T08:00:00Z \(konfirmasi pertama terkirim\)/),
    ).toBeInTheDocument();
  });

  it("status_awal aktif bila belum dibekukan", async () => {
    getDetailMasalah(masalah());
    render(<MasalahForm {...props} awal={masalah()} />);
    expect(await screen.findByLabelText("Status awal")).not.toBeDisabled();
  });

  it("mode ubah: GET detail dulu, PATCH membawa If-Match dari GET yang sama", async () => {
    getDetailMasalah(masalah({ rumusan_hipotesis: "dari GET" }), '"abc"');
    patch.mockResolvedValue(respEtag(masalah(), '"def"'));
    render(<MasalahForm {...props} awal={masalah({ rumusan_hipotesis: "dari daftar" })} />);
    expect(await screen.findByDisplayValue("dari GET")).toBeInTheDocument();
    expect(get.mock.calls[0][0]).toBe("/api/v1/redesain/masalah/{masalah_id}");
    fireEvent.submit(screen.getByRole("button", { name: "Simpan perubahan" }).closest("form")!);
    await waitFor(() => expect(patch).toHaveBeenCalled());
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"abc"' });
  });

  it("mode tambah tidak melakukan GET detail", () => {
    render(<MasalahForm {...props} />);
    expect(screen.getByRole("button", { name: "Tambah masalah" })).toBeInTheDocument();
    expect(get.mock.calls.map((c) => c[0])).not.toContain("/api/v1/redesain/masalah/{masalah_id}");
  });

  it("PATCH 412 → pesan baku data berubah, isian tidak hilang", async () => {
    getDetailMasalah(masalah({ rumusan_hipotesis: "dari GET" }));
    patch.mockResolvedValue({
      data: undefined,
      error: { error: { code: "precondition_failed", message: "x" } },
      response: { status: 412, headers: { get: () => "req-1" } },
    });
    render(<MasalahForm {...props} awal={masalah()} />);
    await screen.findByDisplayValue("dari GET");
    fireEvent.submit(screen.getByRole("button", { name: "Simpan perubahan" }).closest("form")!);
    await waitFor(() => expect(notifyGagal).toHaveBeenCalledTimes(1));
    expect((notifyGagal.mock.calls[0][0] as Error).message).toBe(PESAN_DATA_BERUBAH);
    expect(screen.getByDisplayValue("dari GET")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("GET detail gagal → tombol simpan tidak tersedia", async () => {
    const dasar = get.getMockImplementation()!;
    get.mockImplementation(async (path: string, ...r: unknown[]) =>
      path === "/api/v1/redesain/masalah/{masalah_id}" ? resp(null, 403) : dasar(path, ...r),
    );
    render(<MasalahForm {...props} awal={masalah()} />);
    await waitFor(() => expect(notifyGagal).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Simpan perubahan" })).not.toBeInTheDocument();
  });

  it("PATCH 409 → toast gagal, bukan sukses, tanpa pindah halaman", async () => {
    patch.mockResolvedValue(resp(null, 409));
    getDetailMasalah(masalah());
    render(<MasalahForm {...props} awal={masalah()} />);
    await screen.findByRole("button", { name: "Simpan perubahan" });
    fireEvent.submit(screen.getByRole("button", { name: "Simpan perubahan" }).closest("form")!);
    await waitFor(() => expect(notifyGagal).toHaveBeenCalledTimes(1));
    expect(notifySukses).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("opsi 'Belum ditetapkan' mengirim sekolah_id: null", async () => {
    post.mockResolvedValue(resp(masalah({ sekolah_id: null })));
    render(<MasalahForm {...props} />);
    fireEvent.change(screen.getByLabelText("Konteks"), { target: { value: "k1" } });
    fireEvent.change(screen.getByLabelText("Periode acuan"), { target: { value: "TA 2026/27" } });
    fireEvent.change(screen.getByLabelText("Rumusan hipotesis"), { target: { value: "h" } });
    fireEvent.change(screen.getByLabelText("Sumber awal dan keterbatasan"), {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByLabelText(/Keterangan sekolah/), { target: { value: "TK X" } });
    fireEvent.click(screen.getByRole("button", { name: "Tambah masalah" }));
    await waitFor(() => expect(post).toHaveBeenCalled());
    const body = post.mock.calls[0][1].body;
    expect(body.sekolah_id).toBeNull();
    expect(body.keterangan_sekolah).toBe("TK X");
  });
});

describe("konteks", () => {
  it("tambah dengan 409 menampilkan 'Kode konteks sudah dipakai'", async () => {
    post.mockResolvedValue(resp(null, 409));
    render(<KonteksForm accessToken="tok" />);
    fireEvent.change(screen.getByLabelText("Kode (K-NN)"), { target: { value: "K-01" } });
    fireEvent.change(screen.getByLabelText("Tema"), { target: { value: "t" } });
    fireEvent.change(screen.getByLabelText("Ruang dugaan"), { target: { value: "r" } });
    fireEvent.change(screen.getByLabelText("Sumber draf"), { target: { value: "s" } });
    fireEvent.change(screen.getByLabelText("Batas pemeriksaan"), { target: { value: "b" } });
    fireEvent.submit(screen.getByRole("button", { name: "Tambah konteks" }).closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("Kode konteks sudah dipakai");
    expect(notifySukses).not.toHaveBeenCalled();
  });

  it("index memuat label BELUM MENJADI TEMUAN dan daftar konteks", async () => {
    render(await KonteksPage());
    expect(screen.getByText("BELUM MENJADI TEMUAN")).toBeInTheDocument();
    expect(screen.getByText("K-01")).toBeInTheDocument();
  });

  it("index dengan respons 403 melempar ApiError", async () => {
    siapkanGet({ konteksGagal: true });
    await expect(KonteksPage()).rejects.toThrow();
  });
});
