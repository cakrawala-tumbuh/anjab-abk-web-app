import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
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

beforeEach(() => {
  refresh.mockReset();
  post.mockReset();
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
    expect(screen.getByRole("button", { name: "Simpan Keputusan" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Ya" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Tidak" })).toHaveLength(2);
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
      fireEvent.click(screen.getByRole("button", { name: "Simpan Keputusan" }));
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
