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

/** Tiga task tanpa nilai standar apa pun — hanya `durasi_per_kali` yang wajib diisi
 * manual (field lain sudah punya default valid dari `rowDariStandar`). */
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

function isiDurasi(uraian: string, nilai: string) {
  const checkbox = checkboxTask(uraian);
  const card = checkbox.closest("div.rounded-lg") as HTMLElement;
  const durasi = card.querySelector('input[type="number"]') as HTMLInputElement;
  fireEvent.change(durasi, { target: { value: nilai } });
}

function textareaCatatan(uraian: string) {
  const checkbox = checkboxTask(uraian);
  const card = checkbox.closest("div.rounded-lg") as HTMLElement;
  return card.querySelector("textarea") as HTMLTextAreaElement;
}

function tombolKirim() {
  return screen.getAllByRole("button", { name: "Kirim Detail" });
}

beforeEach(() => {
  refresh.mockReset();
  push.mockReset();
  put.mockReset();
  post.mockReset();
  put.mockResolvedValue(respOk());
  post.mockResolvedValue(respOk());
});

describe("DetailForm — kunci 'Kirim Detail' sampai semua task lengkap (backlog #42)", () => {
  it("negatif: 3 task, 2 dicentang → tombol 'Kirim Detail' disabled, tidak ada POST submit", async () => {
    render(<DetailForm respondenId="tresp_1" tasks={tasks} detailAwal={[]} accessToken="tok" />);

    fireEvent.click(checkboxTask("Menyusun modul ajar"));
    fireEvent.click(checkboxTask("Memeriksa tugas siswa"));
    // Isi durasi kedua task yang dicentang — hanya task ketiga (tidak dicentang)
    // yang seharusnya terhitung belum lengkap.
    isiDurasi("Menyusun modul ajar", "30");
    isiDurasi("Memeriksa tugas siswa", "45");

    for (const btn of tombolKirim()) expect(btn).toBeDisabled();
    expect(screen.getAllByText(/1 task belum dilengkapi/i).length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(tombolKirim()[0]);
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("positif: seluruh task dicentang & valid → tombol aktif; klik memanggil PUT lalu POST submit", async () => {
    render(<DetailForm respondenId="tresp_1" tasks={tasks} detailAwal={[]} accessToken="tok" />);

    fireEvent.click(checkboxTask("Menyusun modul ajar"));
    fireEvent.click(checkboxTask("Memeriksa tugas siswa"));
    fireEvent.click(checkboxTask("Membina ekstrakurikuler"));
    isiDurasi("Menyusun modul ajar", "30");
    isiDurasi("Memeriksa tugas siswa", "45");
    isiDurasi("Membina ekstrakurikuler", "60");

    for (const btn of tombolKirim()) expect(btn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(tombolKirim()[0]);
    });

    expect(put).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/kuesioner");
  });

  it("negatif: seluruh task dicentang tetapi satu durasi dikosongkan → tombol kembali disabled", async () => {
    render(<DetailForm respondenId="tresp_1" tasks={tasks} detailAwal={[]} accessToken="tok" />);

    fireEvent.click(checkboxTask("Menyusun modul ajar"));
    fireEvent.click(checkboxTask("Memeriksa tugas siswa"));
    fireEvent.click(checkboxTask("Membina ekstrakurikuler"));
    isiDurasi("Menyusun modul ajar", "30");
    isiDurasi("Memeriksa tugas siswa", "45");
    // durasi task ketiga sengaja dibiarkan kosong

    for (const btn of tombolKirim()) expect(btn).toBeDisabled();
    expect(screen.getAllByText(/1 task belum dilengkapi/i).length).toBeGreaterThan(0);
  });

  it("positif: klik 'Simpan' saat baru 1 dari 3 task dicentang → PUT terpanggil dengan 1 entri, tanpa POST submit", async () => {
    render(<DetailForm respondenId="tresp_1" tasks={tasks} detailAwal={[]} accessToken="tok" />);

    fireEvent.click(checkboxTask("Menyusun modul ajar"));
    isiDurasi("Menyusun modul ajar", "30");

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Simpan" })[0]);
    });

    expect(put).toHaveBeenCalledTimes(1);
    const body = put.mock.calls[0][1].body;
    expect(body.detail).toHaveLength(1);
    expect(body.detail[0].task_kode).toBe("TI1");
    expect(post).not.toHaveBeenCalled();
  });
});

describe("DetailForm — kolom catatan per task (backlog #42)", () => {
  it("ketik catatan pada task kedua → body PUT memuat catatan hanya pada entri task kedua", async () => {
    render(<DetailForm respondenId="tresp_1" tasks={tasks} detailAwal={[]} accessToken="tok" />);

    fireEvent.click(checkboxTask("Menyusun modul ajar"));
    fireEvent.click(checkboxTask("Memeriksa tugas siswa"));
    fireEvent.click(checkboxTask("Membina ekstrakurikuler"));
    isiDurasi("Menyusun modul ajar", "30");
    isiDurasi("Memeriksa tugas siswa", "45");
    isiDurasi("Membina ekstrakurikuler", "60");

    fireEvent.change(textareaCatatan("Memeriksa tugas siswa"), {
      target: { value: "Task ini sebenarnya dikerjakan rekan lain." },
    });

    await act(async () => {
      fireEvent.click(tombolKirim()[0]);
    });

    expect(put).toHaveBeenCalledTimes(1);
    const body = put.mock.calls[0][1].body;
    const entriTI1 = body.detail.find((d: { task_kode: string }) => d.task_kode === "TI1");
    const entriTI2 = body.detail.find((d: { task_kode: string }) => d.task_kode === "TI2");
    const entriTI3 = body.detail.find((d: { task_kode: string }) => d.task_kode === "TI3");
    expect(entriTI2.catatan).toBe("Task ini sebenarnya dikerjakan rekan lain.");
    // Task tanpa catatan TIDAK mengirim catatan: "" — nilainya undefined (key hilang
    // setelah JSON.stringify, tapi di objek JS sebelum stringify tetap bisa diperiksa).
    expect(entriTI1.catatan).toBeUndefined();
    expect(entriTI3.catatan).toBeUndefined();
  });

  it("catatan tidak ikut terkunci oleh 'Setuju dengan isian standar'", async () => {
    const taskBerstandar: TiTaskTerpilihRead = {
      ...tasks[0],
      std_sumber_bukti: "Aktual",
      std_kondisi: "Baseline",
      std_frekuensi_teks: "Mingguan",
      std_durasi_per_kali: "30",
      std_jam_per_minggu: 2,
      std_peak4w_hours: 0,
      std_va_type: "VA-Core",
    };
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskBerstandar]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    fireEvent.click(checkboxTask("Menyusun modul ajar"));
    // "Setuju dengan isian standar" tercentang secara default (berstandar) — field
    // sibling seperti Sumber Bukti terkunci, tapi catatan tidak boleh ikut terkunci.
    expect(screen.getByLabelText(/Sumber Bukti/i)).toBeDisabled();
    const catatan = textareaCatatan("Menyusun modul ajar");
    expect(catatan).not.toBeDisabled();

    fireEvent.change(catatan, { target: { value: "Catatan meski setuju standar" } });
    expect(catatan.value).toBe("Catatan meski setuju standar");
  });

  it("detailAwal berisi catatan → textarea ter-seed dengan nilai itu saat halaman dimuat ulang", () => {
    const detailAwal: TiDetailRead[] = [
      {
        id: "tdet_1",
        responden_id: "tresp_1",
        sesi_id: "tsesi_1",
        task_kode: "TI1",
        sumber_bukti: "Aktual",
        kondisi: "Baseline",
        frekuensi_teks: "Mingguan",
        durasi_per_kali: 30,
        jam_per_minggu: 2,
        peak4w_hours: 0,
        va_type: "VA-Core",
        setuju_standar: true,
        catatan: "Catatan tersimpan dari sesi sebelumnya",
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

    expect(textareaCatatan("Menyusun modul ajar").value).toBe(
      "Catatan tersimpan dari sesi sebelumnya",
    );
  });
});
