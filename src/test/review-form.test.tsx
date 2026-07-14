import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type { TiTahap2ReviewRead } from "@/lib/api/schema";

// ── Mock router & API client ────────────────────────────────────────────────
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post }),
}));

import { ReviewForm } from "@/app/(auth)/task-inventory/tahap2/[sesi_id]/review-form";

// ── Fixtures ────────────────────────────────────────────────────────────────
const review: TiTahap2ReviewRead = {
  sesi_id: "sesi_1",
  tasks: [
    { task_kode: "TIaaa", n_relevan: 2, n_total: 3, disetujui: null },
    { task_kode: "TIbbb", n_relevan: 1, n_total: 3, disetujui: true },
  ],
  jumlah_belum_diputuskan: 1,
};

// TIbbb sengaja tidak ada di map → uji fallback ke kode
const kodeToUraian = { TIaaa: "Menyusun evaluasi karyawan" };

function renderForm(readOnly: boolean) {
  return render(
    <ReviewForm
      sesiId="sesi_1"
      review={review}
      accessToken="tok"
      readOnly={readOnly}
      kodeToUraian={kodeToUraian}
    />,
  );
}

const toastSukses = vi.mocked(toast.success);
const toastError = vi.mocked(toast.error);

beforeEach(() => {
  refresh.mockReset();
  post.mockReset();
  toastSukses.mockReset();
  toastError.mockReset();
  post.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
});

describe("ReviewForm — Requirement A: tampilkan nama uraian tugas", () => {
  it("menampilkan nama uraian tugas bila tersedia di kodeToUraian", () => {
    renderForm(false);
    expect(screen.getByText("Menyusun evaluasi karyawan")).toBeInTheDocument();
    // kode tetap muncul sebagai keterangan sekunder
    expect(screen.getByText("TIaaa")).toBeInTheDocument();
  });

  it("fallback ke kode bila nama tidak ada di kodeToUraian", () => {
    renderForm(false);
    // TIbbb tidak ada di kodeToUraian → kode tampil sebagai label utama
    expect(screen.getByText("TIbbb")).toBeInTheDocument();
  });
});

describe("ReviewForm — Requirement B: read-only menyembunyikan kontrol edit", () => {
  it("readOnly=true: tombol simpan, setujui semua, tolak semua, ya, tidak tidak ada", () => {
    renderForm(true);
    expect(screen.queryByRole("button", { name: "Simpan Keputusan" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Setujui Semua" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Tolak Semua" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ya" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Tidak" })).toBeNull();
  });

  it("readOnly=true: kolom keputusan menampilkan teks status", () => {
    renderForm(true);
    // TIbbb disetujui=true → tampil teks disetujui
    expect(screen.getByText("✓ Disetujui")).toBeInTheDocument();
    // TIaaa disetujui=null → tampil —
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("readOnly=false: tombol simpan, ya, tidak ada", () => {
    renderForm(false);
    // Bar tombol muncul di atas & bawah tabel (duplikat).
    expect(screen.getAllByRole("button", { name: "Simpan Keputusan" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Ya" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Tidak" })).toHaveLength(2);
  });
});

describe("ReviewForm — Requirement (011): counter 'Belum diputuskan' di header reaktif", () => {
  // Fixture dengan 2 task belum diputuskan (TIaaa, TIccc) + 1 sudah (TIbbb) agar
  // penurunan counter (2 → 1 → hilang) bisa diuji bertahap, bukan langsung ke 0.
  const reviewMultiPending: TiTahap2ReviewRead = {
    sesi_id: "sesi_1",
    tasks: [
      { task_kode: "TIaaa", n_relevan: 2, n_total: 3, disetujui: null },
      { task_kode: "TIbbb", n_relevan: 1, n_total: 3, disetujui: true },
      { task_kode: "TIccc", n_relevan: 1, n_total: 3, disetujui: null },
    ],
    jumlah_belum_diputuskan: 2,
  };

  function renderWithMultiPending(readOnly = false) {
    return render(
      <ReviewForm
        sesiId="sesi_1"
        review={reviewMultiPending}
        accessToken="tok"
        readOnly={readOnly}
        kodeToUraian={{}}
      />,
    );
  }

  it("counter di header tampil sesuai jumlah task belum diputuskan saat render awal", () => {
    renderWithMultiPending();
    expect(screen.getByText("Belum diputuskan:").closest("span")).toHaveTextContent(
      "Belum diputuskan: 2",
    );
  });

  it("counter berkurang seketika saat satu task diputuskan, tanpa reload/refresh", () => {
    renderWithMultiPending();
    const yaButtons = screen.getAllByRole("button", { name: "Ya" });
    // Urutan baris tabel = urutan review.tasks: TIaaa, TIbbb, TIccc.
    fireEvent.click(yaButtons[0]); // putuskan TIaaa

    expect(screen.getByText("Belum diputuskan:").closest("span")).toHaveTextContent(
      "Belum diputuskan: 1",
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("counter menghilang begitu semua task sudah diputuskan via klik (tanpa Simpan)", () => {
    renderWithMultiPending();
    const yaButtons = screen.getAllByRole("button", { name: "Ya" });
    fireEvent.click(yaButtons[0]); // putuskan TIaaa
    fireEvent.click(yaButtons[2]); // putuskan TIccc (satu-satunya sisa)

    expect(screen.queryByText("Belum diputuskan:")).toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("readOnly=true: counter tidak pernah ditampilkan meski ada task belum diputuskan", () => {
    renderWithMultiPending(true);
    expect(screen.queryByText("Belum diputuskan:")).toBeNull();
  });
});

describe("ReviewForm — regresi: sukses Tahap 2 tidak boleh senyap", () => {
  beforeEach(() => {
    vi.stubGlobal("confirm", () => true);
  });

  it("semua task diputuskan + POST sukses: toast sukses memuat jumlah keputusan", async () => {
    renderForm(false);
    // TIaaa masih null → putuskan agar tidak ada yang tersisa (TIbbb sudah true).
    fireEvent.click(screen.getAllByRole("button", { name: "Ya" })[0]);

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Simpan Keputusan" })[0]);
    });

    await waitFor(() => expect(toastSukses).toHaveBeenCalledTimes(1));
    // Inti regresi: dulu POST sukses hanya router.refresh(), tanpa notifikasi apa pun.
    expect(toastSukses).toHaveBeenCalledWith(expect.stringMatching(/\d+ keputusan tersimpan\./));
    expect(toastSukses).toHaveBeenCalledWith(expect.stringContaining("2 keputusan tersimpan."));
    expect(toastError).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it("ada task belum diputuskan + confirm OK: toast menyebut jumlah terkirim DAN dilewati", async () => {
    renderForm(false);
    // TIaaa dibiarkan null → dibuang dari payload.
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Simpan Keputusan" })[0]);
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    // Payload hanya berisi task yang sudah diputuskan (TIbbb).
    expect(post).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/{sesi_id}/tahap2",
      expect.objectContaining({
        body: { keputusan: [{ task_kode: "TIbbb", disetujui: true }] },
      }),
    );
    // User harus tahu sebagian task dibuang dari payload.
    expect(toastSukses).toHaveBeenCalledWith(
      expect.stringMatching(/keputusan tersimpan.*belum diputuskan/),
    );
  });

  it("confirm dibatalkan saat ada task belum diputuskan: tidak ada POST", async () => {
    vi.stubGlobal("confirm", () => false);
    renderForm(false);

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Simpan Keputusan" })[0]);
    });

    expect(post).not.toHaveBeenCalled();
    expect(toastSukses).not.toHaveBeenCalled();
  });

  it("POST gagal: toast.error dipanggil dan error inline tampil", async () => {
    post.mockResolvedValue({
      error: { error: "conflict", message: "Sesi bukan TAHAP2." },
      response: { headers: { get: () => "req-1" } },
    });
    renderForm(false);
    fireEvent.click(screen.getAllByRole("button", { name: "Ya" })[0]);

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Simpan Keputusan" })[0]);
    });

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("Sesi bukan TAHAP2.", expect.anything());
    expect(toastSukses).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Sesi bukan TAHAP2.");
  });
});

describe("ReviewForm — submit memakai kode, bukan nama", () => {
  it("payload POST menggunakan task_kode, bukan nama uraian tugas", async () => {
    renderForm(false);
    // Klik "Ya" pada baris TIaaa (nama: "Menyusun evaluasi karyawan")
    // getAllByRole karena ada 2 baris dengan tombol Ya
    const yaButtons = screen.getAllByRole("button", { name: "Ya" });
    fireEvent.click(yaButtons[0]); // baris TIaaa (urutan pertama di review.tasks)

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Simpan Keputusan" })[0]);
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/{sesi_id}/tahap2",
      expect.objectContaining({
        params: { path: { sesi_id: "sesi_1" } },
        body: {
          keputusan: expect.arrayContaining([{ task_kode: "TIaaa", disetujui: true }]),
        },
      }),
    );
  });
});
