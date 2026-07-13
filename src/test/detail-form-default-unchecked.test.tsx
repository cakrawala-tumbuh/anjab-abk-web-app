import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TiTaskTerpilihRead } from "@/lib/api/schema";

// ── Mock router & API client ────────────────────────────────────────────────
const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));

const put = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ PUT: put, POST: vi.fn() }),
}));

import { DetailForm } from "@/app/(auth)/task-inventory/tahap3/[responden_id]/detail-form";

// Task dengan nilai standar lengkap — memicu banner & checkbox "Setuju dengan isian standar".
const taskBerstandar: TiTaskTerpilihRead = {
  kode: "TIaaa",
  tugas_pokok: "Mengajar",
  detil_tugas: "Mengajar kelas",
  uraian_tugas: "Menyusun rencana pembelajaran",
  n_relevan: 3,
  pct_relevan: 100,
  std_sumber_bukti: "Aktual",
  std_kondisi: "Baseline",
  std_frekuensi_teks: "Mingguan",
  std_durasi_per_kali: "60",
  std_jam_per_minggu: 4,
  std_peak4w_hours: 1,
  std_ai_mode: "Human-led",
  std_va_type: "VA-Core",
  std_dcs_flag: false,
};

beforeEach(() => {
  refresh.mockReset();
  push.mockReset();
  put.mockReset();
  put.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
});

describe("DetailForm — Tahap 3: default checkbox tidak tercentang", () => {
  it("checkbox 'dikerjakan' unchecked meski task punya nilai standar dan belum ada detail tersimpan", () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskBerstandar]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /Menyusun rencana pembelajaran/,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    // Ringkasan menunjukkan 0 dari 1 ditandai dikerjakan.
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("submit tanpa mencentang task apa pun menampilkan error dan tidak mengirim POST submit", async () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskBerstandar]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Kirim Detail" })[0]);
    });

    expect(
      screen.getByText("Tandai minimal satu tugas yang Anda kerjakan, lalu isi rinciannya."),
    ).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("banner Tahap 3 tidak lagi menyuruh 'biarkan tercentang'", () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskBerstandar]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );
    expect(screen.queryByText(/biarkan tercentang/)).toBeNull();
    expect(screen.getByText(/Centang tugas yang Anda kerjakan/)).toBeInTheDocument();
  });
});
