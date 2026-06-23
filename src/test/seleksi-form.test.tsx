import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TiCatalogRead } from "@/lib/api/schema";

// ── Mock router & API client ────────────────────────────────────────────────
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post }),
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

function renderForm() {
  return render(
    <SeleksiForm respondenId="trsp_1" sesiId="tises_1" catalog={catalog} accessToken="tok" />,
  );
}

beforeEach(() => {
  push.mockReset();
  refresh.mockReset();
  post.mockReset();
  post.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
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
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Kirim Seleksi" }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/responden/{responden_id}/seleksi",
      expect.objectContaining({
        params: { path: { responden_id: "trsp_1" } },
        body: { task_kode: ["TI-A"] },
      }),
    );
    expect(push).toHaveBeenCalledWith("/task-inventory/tises_1");
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
