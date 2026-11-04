import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TiCatalogRead, TiUsulanRead } from "@/lib/api/schema";
import { PESAN_DATA_BERUBAH } from "@/lib/konkurensi";
import { PESAN_DATA_SUDAH_HILANG } from "@/lib/hapus-ber-etag";
import { toast } from "sonner";

// ── Mock router & API client ────────────────────────────────────────────────
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const put = vi.fn();
const post = vi.fn();
const del = vi.fn();
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ PUT: put, POST: post, DELETE: del, GET: get }),
}));

import { SeleksiForm } from "@/app/(auth)/task-inventory/tahap1/[responden_id]/seleksi-form";

// ── Catalog uji: 2 tugas pokok; salah satu detil null (langsung di bawah TP) ──
const catalog: TiCatalogRead[] = [
  {
    kode: "TI-A",
    unit: "TK",
    jabatan_id: "jbt_1",
    tugas_pokok_id: "tp1",
    tugas_pokok: "Pengelolaan SDM",
    detil_tugas_id: "dt1",
    detil_tugas: "Evaluasi Kinerja",
    uraian_tugas: "Menyusun evaluasi karyawan",
    urutan: 1,
  },
  {
    kode: "TI-B",
    unit: "TK",
    jabatan_id: "jbt_1",
    tugas_pokok_id: "tp1",
    tugas_pokok: "Pengelolaan SDM",
    detil_tugas_id: "dt2",
    detil_tugas: "Rekrutmen",
    uraian_tugas: "Mewawancarai kandidat",
    urutan: 2,
  },
  {
    kode: "TI-C",
    unit: "TK",
    jabatan_id: "jbt_1",
    tugas_pokok_id: "tp2",
    tugas_pokok: "Keuangan",
    detil_tugas_id: null,
    detil_tugas: null,
    uraian_tugas: "Menyusun anggaran tahunan",
    urutan: 1,
  },
];

function renderForm(
  usulanAwal: TiUsulanRead[] = [],
  tahap1Submit = false,
  seleksiEtag: string | null = null,
) {
  return render(
    <SeleksiForm
      respondenId="trsp_1"
      catalog={catalog}
      terpilihAwal={[]}
      usulanAwal={usulanAwal}
      tahap1Submit={tahap1Submit}
      seleksiEtag={seleksiEtag}
      accessToken="tok"
    />,
  );
}

beforeEach(() => {
  push.mockReset();
  refresh.mockReset();
  put.mockReset();
  post.mockReset();
  del.mockReset();
  get.mockReset();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  get.mockResolvedValue({
    data: { id: "tius_1" },
    error: undefined,
    response: { status: 200, headers: { get: (n: string) => (n === "etag" ? '"u1"' : "req-1") } },
  });
  put.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
  post.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
  del.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
});

describe("SeleksiForm — cascade 3 level Tahap 1", () => {
  it("Level 1 hanya menampilkan tugas pokok, bukan detil/uraian", () => {
    renderForm();
    expect(screen.getByRole("checkbox", { name: "Pengelolaan SDM" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Keuangan" })).toBeInTheDocument();
    // Detil & uraian tugas belum muncul di level 1.
    expect(screen.queryByText("Evaluasi Kinerja")).not.toBeInTheDocument();
    expect(screen.queryByText("Menyusun evaluasi karyawan")).not.toBeInTheDocument();
  });

  it("Level 1 wajib pilih minimal satu tugas pokok", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Lanjut ke Detil Tugas" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/minimal satu tugas pokok/i);
  });

  it("Level 2 hanya menampilkan detil tugas dari tugas pokok terpilih", () => {
    renderForm();
    fireEvent.click(screen.getByRole("checkbox", { name: "Pengelolaan SDM" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut ke Detil Tugas" }));

    expect(screen.getByRole("checkbox", { name: "Evaluasi Kinerja" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Rekrutmen" })).toBeInTheDocument();
    // Detil dari tugas pokok yang TIDAK dipilih (Keuangan) tak boleh muncul.
    expect(
      screen.queryByRole("checkbox", { name: /Langsung di bawah tugas pokok/i }),
    ).not.toBeInTheDocument();
  });

  it("Level 3 hanya menampilkan uraian tugas dari detil tugas terpilih, lalu submit", async () => {
    renderForm();
    // Level 1
    fireEvent.click(screen.getByRole("checkbox", { name: "Pengelolaan SDM" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut ke Detil Tugas" }));
    // Level 2 — pilih hanya "Evaluasi Kinerja"
    fireEvent.click(screen.getByRole("checkbox", { name: "Evaluasi Kinerja" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut ke Uraian Tugas" }));
    // Level 3 — hanya uraian dari "Evaluasi Kinerja" yang muncul
    expect(
      screen.getByRole("checkbox", { name: "Menyusun evaluasi karyawan" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Mewawancarai kandidat" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Menyusun evaluasi karyawan" }));
    // Bar tombol Simpan/Kirim Seleksi muncul di atas & bawah daftar (duplikat) — pakai yang pertama.
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Kirim Seleksi" })[0]);
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/responden/{responden_id}/seleksi",
      expect.objectContaining({
        params: { path: { responden_id: "trsp_1" } },
        body: { task_kode: ["TI-A"] },
      }),
    );
    expect(post).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/responden/{responden_id}/seleksi/submit",
      expect.objectContaining({
        params: { path: { responden_id: "trsp_1" } },
      }),
    );
    expect(push).toHaveBeenCalledWith("/kuesioner");
  });

  it("mengubah pilihan tugas pokok membuang detil & uraian yang tak lagi valid", () => {
    renderForm();
    // Pilih kedua tugas pokok, lanjut, pilih semua detil, lalu kembali & batalkan TP1.
    fireEvent.click(screen.getByRole("checkbox", { name: "Pengelolaan SDM" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Keuangan" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut ke Detil Tugas" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Evaluasi Kinerja" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Langsung di bawah tugas pokok/i }));
    // Kembali ke level 1, batalkan "Pengelolaan SDM"
    fireEvent.click(screen.getByRole("button", { name: "Kembali" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Pengelolaan SDM" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut ke Detil Tugas" }));
    // Hanya detil dari "Keuangan" yang tersisa.
    expect(screen.queryByRole("checkbox", { name: "Evaluasi Kinerja" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /Langsung di bawah tugas pokok/i }),
    ).toBeInTheDocument();
  });
});

// ── Navigasi bersama ke Level 3, grup "Evaluasi Kinerja · Pengelolaan SDM" ───
function keLevel3ViaEvaluasiKinerja() {
  fireEvent.click(screen.getByRole("checkbox", { name: "Pengelolaan SDM" }));
  fireEvent.click(screen.getByRole("button", { name: "Lanjut ke Detil Tugas" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Evaluasi Kinerja" }));
  fireEvent.click(screen.getByRole("button", { name: "Lanjut ke Uraian Tugas" }));
}

function keLevel3ViaKeuangan() {
  fireEvent.click(screen.getByRole("checkbox", { name: "Keuangan" }));
  fireEvent.click(screen.getByRole("button", { name: "Lanjut ke Detil Tugas" }));
  fireEvent.click(screen.getByRole("checkbox", { name: /Langsung di bawah tugas pokok/i }));
  fireEvent.click(screen.getByRole("button", { name: "Lanjut ke Uraian Tugas" }));
}

describe("SeleksiForm — usulan tugas tambahan di langkah Uraian Tugas (issue #45)", () => {
  it("mengirim POST usulan dengan tugas_pokok_id & detil_tugas_id grup asal", async () => {
    renderForm();
    keLevel3ViaEvaluasiKinerja();

    fireEvent.click(screen.getByRole("button", { name: "Tambah tugas yang tidak ada di daftar" }));
    fireEvent.change(screen.getByPlaceholderText(/Tuliskan uraian tugas/i), {
      target: { value: "Menyusun ulang jadwal piket." },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Usulan" }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/responden/{responden_id}/usulan",
      expect.objectContaining({
        params: { path: { responden_id: "trsp_1" } },
        body: {
          tugas_pokok_id: "tp1",
          detil_tugas_id: "dt1",
          uraian: "Menyusun ulang jadwal piket.",
        },
      }),
    );
    expect(refresh).toHaveBeenCalled();
    // Usulan TIDAK memicu PUT seleksi maupun POST submit.
    expect(put).not.toHaveBeenCalled();
  });

  it("grup sentinel '(Langsung di bawah tugas pokok)' mengirim detil_tugas_id: null", async () => {
    renderForm();
    keLevel3ViaKeuangan();

    fireEvent.click(screen.getByRole("button", { name: "Tambah tugas yang tidak ada di daftar" }));
    fireEvent.change(screen.getByPlaceholderText(/Tuliskan uraian tugas/i), {
      target: { value: "Menyusun laporan kas kecil." },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Usulan" }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/responden/{responden_id}/usulan",
      expect.objectContaining({
        body: {
          tugas_pokok_id: "tp2",
          detil_tugas_id: null,
          uraian: "Menyusun laporan kas kecil.",
        },
      }),
    );
  });

  it("usulan kosong ditolak di klien tanpa memanggil POST", async () => {
    renderForm();
    keLevel3ViaEvaluasiKinerja();

    fireEvent.click(screen.getByRole("button", { name: "Tambah tugas yang tidak ada di daftar" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Usulan" }));
    });

    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/tidak boleh kosong/i);
  });

  it("klik Hapus pada usulan tersimpan memanggil DELETE /usulan/{id}", async () => {
    const usulanAwal: TiUsulanRead[] = [
      {
        id: "tius_1",
        sesi_id: "sesi_1",
        responden_id: "trsp_1",
        tugas_pokok_id: "tp1",
        tugas_pokok: "Pengelolaan SDM",
        detil_tugas_id: "dt1",
        detil_tugas: "Evaluasi Kinerja",
        uraian: "Menyusun ulang jadwal piket.",
        disetujui: null,
        task_kode: null,
        created_at: "2026-07-26T00:00:00Z",
      },
    ];
    renderForm(usulanAwal);
    keLevel3ViaEvaluasiKinerja();

    expect(screen.getByText("Menyusun ulang jadwal piket.")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    });

    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(del).toHaveBeenCalledWith(
      "/api/v1/task-inventory/usulan/{usulan_id}",
      expect.objectContaining({ params: { path: { usulan_id: "tius_1" } } }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("tahap1Submit=true: kontrol tambah/hapus usulan tidak dirender", () => {
    const usulanAwal: TiUsulanRead[] = [
      {
        id: "tius_1",
        sesi_id: "sesi_1",
        responden_id: "trsp_1",
        tugas_pokok_id: "tp1",
        tugas_pokok: "Pengelolaan SDM",
        detil_tugas_id: "dt1",
        detil_tugas: "Evaluasi Kinerja",
        uraian: "Menyusun ulang jadwal piket.",
        disetujui: null,
        task_kode: null,
        created_at: "2026-07-26T00:00:00Z",
      },
    ];
    renderForm(usulanAwal, true);
    keLevel3ViaEvaluasiKinerja();

    expect(
      screen.queryByRole("button", { name: "Tambah tugas yang tidak ada di daftar" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hapus" })).not.toBeInTheDocument();
    // Usulan yang sudah tersimpan tetap tidak ditampilkan sama sekali di mode ini
    // (bukan hanya kontrolnya) — konsisten dengan "disembunyikan", bukan read-only.
    expect(screen.queryByText("Menyusun ulang jadwal piket.")).not.toBeInTheDocument();
  });
});

// ── Kunci optimistik If-Match (issue #88) ───────────────────────────────────
const usulanTersimpan: TiUsulanRead = {
  id: "tius_1",
  sesi_id: "sesi_1",
  responden_id: "trsp_1",
  tugas_pokok_id: "tp1",
  tugas_pokok: "Pengelolaan SDM",
  detil_tugas_id: "dt1",
  detil_tugas: "Evaluasi Kinerja",
  uraian: "Menyusun ulang jadwal piket.",
  disetujui: null,
  task_kode: null,
  created_at: "2026-07-26T00:00:00Z",
};

describe("SeleksiForm — If-Match (issue #88)", () => {
  async function klikSimpan() {
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Simpan" })[0]);
    });
  }

  it("PUT pertama memakai ETag dari server; PUT berikutnya memakai ETag dari respons simpan sebelumnya", async () => {
    put
      .mockResolvedValueOnce({
        error: null,
        response: { headers: { get: (n: string) => (n === "etag" ? '"s2"' : "req-1") } },
      })
      .mockResolvedValueOnce({
        error: null,
        response: { headers: { get: (n: string) => (n === "etag" ? '"s3"' : "req-1") } },
      });
    renderForm([], false, '"s1"');
    keLevel3ViaEvaluasiKinerja();
    fireEvent.click(screen.getByRole("checkbox", { name: "Menyusun evaluasi karyawan" }));

    await klikSimpan();
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1].headers).toEqual({ "If-Match": '"s1"' });

    await klikSimpan();
    await waitFor(() => expect(put).toHaveBeenCalledTimes(2));
    expect(put.mock.calls[1][1].headers).toEqual({ "If-Match": '"s2"' });
  });

  it("belum pernah menyimpan (ETag null): PUT pertama tanpa If-Match", async () => {
    renderForm();
    keLevel3ViaEvaluasiKinerja();
    fireEvent.click(screen.getByRole("checkbox", { name: "Menyusun evaluasi karyawan" }));
    await klikSimpan();
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1].headers).toEqual({});
  });

  it("PUT 412 -> pesan baku data berubah", async () => {
    put.mockResolvedValue({
      error: { error: "precondition_failed", message: "etag" },
      response: { status: 412, headers: { get: () => "req-1" } },
    });
    renderForm([], false, '"s1"');
    keLevel3ViaEvaluasiKinerja();
    fireEvent.click(screen.getByRole("checkbox", { name: "Menyusun evaluasi karyawan" }));
    await klikSimpan();
    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(vi.mocked(toast.error).mock.calls.at(-1)?.[0]).toBe(PESAN_DATA_BERUBAH);
  });

  it("DELETE usulan mengirim ETag dari GET usulan", async () => {
    renderForm([usulanTersimpan]);
    keLevel3ViaEvaluasiKinerja();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    });
    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(get).toHaveBeenCalledWith("/api/v1/task-inventory/usulan/{usulan_id}", {
      params: { path: { usulan_id: "tius_1" } },
    });
    expect(del.mock.calls[0][1].headers).toEqual({ "If-Match": '"u1"' });
  });

  it("DELETE usulan 412 -> pesan baku, tanpa 'Usulan dihapus.'", async () => {
    del.mockResolvedValue({
      error: { error: "precondition_failed", message: "etag" },
      response: { status: 412, headers: { get: () => "req-1" } },
    });
    renderForm([usulanTersimpan]);
    keLevel3ViaEvaluasiKinerja();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    });
    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(vi.mocked(toast.error).mock.calls.at(-1)?.[0]).toBe(PESAN_DATA_BERUBAH);
    expect(vi.mocked(toast.success)).not.toHaveBeenCalledWith("Usulan dihapus.");
  });

  it("GET usulan 404 -> pesan 'sudah tidak ada' dan muat ulang, DELETE tidak dipanggil", async () => {
    get.mockResolvedValue({
      data: undefined,
      error: { error: "not_found", message: "tidak ada" },
      response: { status: 404, headers: { get: () => "req-1" } },
    });
    renderForm([usulanTersimpan]);
    keLevel3ViaEvaluasiKinerja();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(del).not.toHaveBeenCalled();
    expect(vi.mocked(toast.error).mock.calls.at(-1)?.[0]).toBe(PESAN_DATA_SUDAH_HILANG);
  });
});
