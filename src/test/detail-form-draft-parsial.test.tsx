import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TiDetailRead, TiTaskTerpilihRead } from "@/lib/api/schema";

// ── Mock router & API client ────────────────────────────────────────────────
const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));

const put = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ PUT: put, POST: post }),
}));

import { DetailForm } from "@/app/(auth)/task-inventory/tahap3/[responden_id]/detail-form";

/** Tiga task tanpa nilai standar — hanya `durasi_per_kali` yang tidak diprefill. */
const tasks: TiTaskTerpilihRead[] = [
  {
    kode: "TI1",
    tugas_pokok: "Mengajar",
    detil_tugas: "Mengajar kelas",
    uraian_tugas: "Menyusun modul ajar",
    n_relevan: 3,
    pct_relevan: 100,
  },
  {
    kode: "TI2",
    tugas_pokok: "Mengajar",
    detil_tugas: "Mengajar kelas",
    uraian_tugas: "Memeriksa tugas siswa",
    n_relevan: 3,
    pct_relevan: 100,
  },
  {
    kode: "TI3",
    tugas_pokok: "Kesiswaan",
    detil_tugas: "Pembinaan",
    uraian_tugas: "Membina ekstrakurikuler",
    n_relevan: 3,
    pct_relevan: 100,
  },
];

function respOk(reqId = "req-1") {
  return { error: null, response: { headers: { get: () => reqId } } };
}

function checkboxTask(uraian: string) {
  return screen.getByRole("checkbox", { name: new RegExp(uraian) });
}

function tombolSimpan() {
  return screen.getAllByRole("button", { name: "Simpan" });
}

beforeEach(() => {
  refresh.mockReset();
  push.mockReset();
  put.mockReset();
  post.mockReset();
  put.mockResolvedValue(respOk());
  post.mockResolvedValue(respOk());
});

describe("DetailForm — 'Simpan' menyimpan draft parsial tanpa syarat kelengkapan (backlog #55)", () => {
  it("positif: 3 task dicentang, hanya 1 durasi diisi → satu PUT dengan 3 entri, tanpa pesan error", async () => {
    render(<DetailForm respondenId="tresp_1" tasks={tasks} detailAwal={[]} accessToken="tok" />);

    fireEvent.click(checkboxTask("Menyusun modul ajar"));
    fireEvent.click(checkboxTask("Memeriksa tugas siswa"));
    fireEvent.click(checkboxTask("Membina ekstrakurikuler"));

    const durasiTI1 = screen
      .getByRole("checkbox", { name: /Menyusun modul ajar/ })
      .closest("div.rounded-lg")!
      .querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(durasiTI1, { target: { value: "30" } });

    await act(async () => {
      fireEvent.click(tombolSimpan()[0]);
    });

    expect(put).toHaveBeenCalledTimes(1);
    const body = put.mock.calls[0][1].body as { detail: unknown[] };
    expect(body.detail).toHaveLength(3);
    expect(screen.getByText("Draft tersimpan.")).toBeInTheDocument();
  });

  it("negatif: klik 'Simpan' tanpa satu pun field terisi selain centang → tetap satu PUT, tanpa role=alert 'Periksa isian pada task'", async () => {
    render(<DetailForm respondenId="tresp_1" tasks={tasks} detailAwal={[]} accessToken="tok" />);

    fireEvent.click(checkboxTask("Menyusun modul ajar"));
    fireEvent.click(checkboxTask("Memeriksa tugas siswa"));
    fireEvent.click(checkboxTask("Membina ekstrakurikuler"));
    // Seluruh durasi SENGAJA dibiarkan kosong — baris berstatus "belum lengkap".

    await act(async () => {
      fireEvent.click(tombolSimpan()[0]);
    });

    expect(put).toHaveBeenCalledTimes(1);
    const body = put.mock.calls[0][1].body as { detail: unknown[] };
    expect(body.detail).toHaveLength(3);
    expect(screen.queryByText(/Periksa isian pada task/i)).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    // Tombol "Kirim Detail" tetap terkunci — gerbang kelengkapan hanya pindah
    // ke submit, tidak dihapus.
    for (const btn of screen.getAllByRole("button", { name: "Kirim Detail" })) {
      expect(btn).toBeDisabled();
    }
    expect(post).not.toHaveBeenCalled();
  });

  it("positif: draft tersimpan (null pada field kosong) di-render ulang tanpa crash, baris tetap tercentang", () => {
    const detailAwal: TiDetailRead[] = [
      {
        id: "tdet_1",
        responden_id: "tresp_1",
        sesi_id: "tsesi_1",
        task_kode: "TI1",
        sumber_bukti: null,
        kondisi: null,
        frekuensi_teks: null,
        durasi_per_kali: null,
        jam_per_minggu: 0,
        peak4w_hours: 0,
        va_type: null,
        setuju_standar: false,
        catatan: null,
      },
    ];

    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[tasks[0]]}
        detailAwal={detailAwal}
        accessToken="tok"
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /Menyusun modul ajar/,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    const sumberBukti = screen.getByLabelText(/Sumber Bukti/i) as HTMLSelectElement;
    const kondisi = screen.getByLabelText(/^Kondisi/i) as HTMLSelectElement;
    const frekuensi = screen.getByLabelText(/^Frekuensi/i) as HTMLSelectElement;
    expect(sumberBukti.value).toBe("");
    expect(kondisi.value).toBe("");
    expect(frekuensi.value).toBe("");
    expect(screen.getAllByText(/wajib dipilih/i).length).toBeGreaterThan(0);

    // Tombol "Kirim Detail" tetap terkunci karena baris ini belum lengkap.
    for (const btn of screen.getAllByRole("button", { name: "Kirim Detail" })) {
      expect(btn).toBeDisabled();
    }
  });

  it("negatif: klik 'Kirim Detail' saat ada baris ber-va_type 'Context-Dependent' tetap ditolak (tombol terkunci)", () => {
    const taskCd: TiTaskTerpilihRead = {
      ...tasks[0],
      std_sumber_bukti: "Aktual",
      std_kondisi: "Baseline",
      std_frekuensi_teks: "Mingguan",
      std_durasi_per_kali: "30",
      std_jam_per_minggu: 1,
      std_peak4w_hours: 0,
      std_va_type: "Context-Dependent",
    };
    render(<DetailForm respondenId="tresp_1" tasks={[taskCd]} detailAwal={[]} accessToken="tok" />);

    fireEvent.click(checkboxTask("Menyusun modul ajar"));

    for (const btn of screen.getAllByRole("button", { name: "Kirim Detail" })) {
      expect(btn).toBeDisabled();
    }
    expect(post).not.toHaveBeenCalled();
  });
});
