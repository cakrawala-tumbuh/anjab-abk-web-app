import { render, screen, act, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TiTaskTerpilihRead } from "@/lib/api/schema";

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

/** Task tanpa nilai standar apa pun — dipakai untuk kasus "pilih manual". */
const taskPolos: TiTaskTerpilihRead = {
  kode: "TIpolos",
  tugas_pokok: "Mengajar",
  detil_tugas: "Mengajar kelas",
  uraian_tugas: "Menyusun modul ajar",
  n_relevan: 3,
  pct_relevan: 100,
};

/** Task dengan prefill `std_va_type = "Context-Dependent"` — belum final. */
const taskContextDependent: TiTaskTerpilihRead = {
  ...taskPolos,
  kode: "TIcd",
  uraian_tugas: "Menangani insiden mendadak",
  std_sumber_bukti: "Aktual",
  std_kondisi: "Baseline",
  std_frekuensi_teks: "Mingguan",
  std_durasi_per_kali: "30",
  std_jam_per_minggu: 1,
  std_peak4w_hours: 0,
  std_va_type: "Context-Dependent",
};

function respOk(reqId = "req-1") {
  return { error: null, response: { headers: { get: () => reqId } } };
}

beforeEach(() => {
  refresh.mockReset();
  push.mockReset();
  put.mockReset();
  post.mockReset();
  put.mockResolvedValue(respOk());
  post.mockResolvedValue(respOk());
});

describe("DetailForm — selektor VA Type Tahap 3 hanya 3 opsi final (backlog #39)", () => {
  it("selektor VA Type memuat tepat 3 opsi (VA-Core/VA-Enable/NVA-Residual), tanpa Context-Dependent/Needs Validation", () => {
    render(
      <DetailForm respondenId="tresp_1" tasks={[taskPolos]} detailAwal={[]} accessToken="tok" />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Menyusun modul ajar/ }));

    const select = screen.getByRole("combobox", { name: /Jenis Nilai Tambah/i });
    const options = within(select)
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(options).toEqual(["VA-Core", "VA-Enable", "NVA-Residual"]);
  });

  it("task dengan prefill std_va_type='Context-Dependent' tidak diberi default valid (selektor kosong)", () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskContextDependent]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    // berstandar → checked otomatis via seed rowDariStandar saat dicentang manual.
    fireEvent.click(screen.getByRole("checkbox", { name: /Menangani insiden mendadak/ }));

    const select = screen.getByRole("combobox", {
      name: /Jenis Nilai Tambah/i,
    }) as HTMLSelectElement;
    expect(select.value).toBe("");
    expect(screen.getByText("— wajib dipilih")).toBeInTheDocument();
  });

  it("submit diblokir & pesan spesifik VA Type tampil selama baris masih 'Context-Dependent'", async () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskContextDependent]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Menangani insiden mendadak/ }));

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Kirim Detail" })[0]);
    });

    expect(screen.getByText(/pilih Jenis Nilai Tambah \(VA\) final/i)).toBeInTheDocument();
    expect(screen.getByText(/Context-Dependent.*belum final/i)).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("setelah dipilih salah satu dari 3 kanonik, submit berhasil terkirim", async () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskContextDependent]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Menangani insiden mendadak/ }));
    // Task berstandar → selektor terkunci selama "Setuju dengan isian standar" tercentang;
    // lepas dulu (pola UX yang sama dipakai field lain yang terkunci di komponen ini).
    fireEvent.click(screen.getByRole("checkbox", { name: /Setuju dengan isian standar/ }));

    const select = screen.getByRole("combobox", { name: /Jenis Nilai Tambah/i });
    fireEvent.change(select, { target: { value: "VA-Core" } });
    // durasi_per_kali SENGAJA tidak diprefill (lihat rowDariStandar) — isi manual
    // supaya baris valid selain va_type (bukan bagian cakupan #39, tapi wajib
    // supaya kegagalan skema tidak salah dikaitkan dengan VA Type).
    fireEvent.change(screen.getByRole("spinbutton", { name: /Durasi\/kali/i }), {
      target: { value: "30" },
    });

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Kirim Detail" })[0]);
    });

    expect(put).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/kuesioner");
  });

  it("422 backend saat submit ditampilkan role=alert dengan pesan spesifik task Context-Dependent, tidak ditelan", async () => {
    // Task sudah valid VA-Core di klien, tapi backend tetap menolak (mis. race
    // dengan draft lain) — pesan 422 backend wajib tampil apa adanya.
    post.mockResolvedValueOnce({
      error: {
        error: "validation_error",
        message:
          'Tidak dapat submit: task berikut masih bertipe VA "Context-Dependent", pastikan jadi VA-Core/VA-Enable/NVA-Residual sebelum finalisasi: TIcd.',
      },
      response: { headers: { get: () => "req-422" } },
    });

    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskContextDependent]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Menangani insiden mendadak/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Setuju dengan isian standar/ }));
    fireEvent.change(screen.getByRole("combobox", { name: /Jenis Nilai Tambah/i }), {
      target: { value: "VA-Core" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Durasi\/kali/i }), {
      target: { value: "30" },
    });

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Kirim Detail" })[0]);
    });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Context-Dependent/);
    expect(alert).toHaveTextContent(/TIcd/);
    expect(push).not.toHaveBeenCalled();
  });
});
