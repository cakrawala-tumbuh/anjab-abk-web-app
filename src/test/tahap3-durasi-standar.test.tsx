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

// Petunjuk standar berbeda-beda per task — teks bebas, bukan angka menit.
const taskBerstandar: TiTaskTerpilihRead = {
  kode: "TIaaa",
  tugas_pokok: "Kesiswaan",
  detil_tugas: "Pramuka",
  uraian_tugas: "Mendampingi kegiatan pramuka",
  n_relevan: 3,
  pct_relevan: 100,
  std_sumber_bukti: "Aktual",
  std_kondisi: "Baseline",
  std_frekuensi_teks: "Mingguan",
  std_durasi_per_kali: "1-2 jam",
  std_jam_per_minggu: 4,
  std_peak4w_hours: 1,
  std_va_type: "VA-Core",
};

function checkboxTugas() {
  return screen.getByRole("checkbox", { name: /Mendampingi kegiatan pramuka/ });
}

function inputDurasi() {
  return screen.getByLabelText(/Durasi\/kali \(menit\)/i) as HTMLInputElement;
}

beforeEach(() => {
  refresh.mockReset();
  push.mockReset();
  put.mockReset();
  put.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
});

describe("DetailForm — Tahap 3: durasi standar (issue #22, Opsi A)", () => {
  it("saat 'Setuju dengan isian standar' tercentang: durasi TIDAK diprefill 60, field sibling terkunci, durasi tetap dapat diedit", async () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskBerstandar]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    await act(async () => {
      fireEvent.click(checkboxTugas());
    });

    // Field sibling terkunci saat setuju-standar (default true).
    expect(screen.getByLabelText(/Sumber Bukti/i)).toBeDisabled();
    expect(screen.getByLabelText(/^Kondisi/i)).toBeDisabled();
    expect(screen.getByLabelText(/^Frekuensi/i)).toBeDisabled();
    expect(screen.getByLabelText(/Jam\/minggu/i)).toBeDisabled();
    expect(screen.getByLabelText(/Jam peak/i)).toBeDisabled();
    expect(screen.getByLabelText(/VA Type/i)).toBeDisabled();

    // Durasi tetap dapat diedit (bukan bug lagi — keputusan produk Opsi A) dan KOSONG,
    // bukan 60 hard-code.
    const durasi = inputDurasi();
    expect(durasi).not.toBeDisabled();
    expect(durasi.value).toBe("");

    // Petunjuk standar teks tetap tampil, dan penanda "wajib diisi manual" muncul.
    expect(screen.getByText(/petunjuk standar: 1-2 jam/)).toBeInTheDocument();
    expect(screen.getByText(/wajib diisi manual/)).toBeInTheDocument();

    // Regresi eksplisit: 60 tidak lagi muncul sebagai nilai default di mana pun.
    expect(screen.queryByDisplayValue("60")).toBeNull();
  });

  it("submit dengan durasi kosong (setuju-standar) ditolak — tidak mengirim PUT", async () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskBerstandar]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    await act(async () => {
      fireEvent.click(checkboxTugas());
    });
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Kirim Detail" })[0]);
    });

    expect(screen.getByText(/Periksa isian pada task/)).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("mengisi durasi manual lalu submit → PUT membawa angka yang diisi responden, bukan 60", async () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskBerstandar]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    await act(async () => {
      fireEvent.click(checkboxTugas());
    });
    await act(async () => {
      fireEvent.change(inputDurasi(), { target: { value: "90" } });
    });
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Kirim Detail" })[0]);
    });

    expect(put).toHaveBeenCalled();
    const body = put.mock.calls[0][1].body;
    expect(body.detail[0].durasi_per_kali).toBe(90);
  });

  it("tanpa centang setuju-standar: seluruh field termasuk durasi tetap dapat diedit (tanpa regresi)", async () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskBerstandar]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    await act(async () => {
      fireEvent.click(checkboxTugas());
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("checkbox", { name: /Setuju dengan isian standar/ }));
    });

    expect(screen.getByLabelText(/Sumber Bukti/i)).not.toBeDisabled();
    expect(inputDurasi()).not.toBeDisabled();
    expect(screen.queryByText(/wajib diisi manual/)).toBeNull();
  });
});
