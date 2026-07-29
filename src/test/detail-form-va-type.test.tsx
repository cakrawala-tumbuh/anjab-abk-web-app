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

  it("tombol 'Kirim Detail' terkunci selama baris masih 'Context-Dependent'; klik 'Simpan' tetap menampilkan pesan spesifik VA Type (backlog #42)", async () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskContextDependent]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Menangani insiden mendadak/ }));

    // Task dicentang tapi va_type belum final (dan durasi belum diisi) → dihitung
    // belum lengkap, tombol "Kirim Detail" (kedua salinan) terkunci.
    for (const btn of screen.getAllByRole("button", { name: "Kirim Detail" })) {
      expect(btn).toBeDisabled();
    }

    // "Simpan" (draft) tetap menerima isian parsial — tapi baris yang SUDAH dicentang
    // tetap tervalidasi skema saat disimpan; pesan spesifik VA Type tetap tampil.
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Simpan" })[0]);
    });

    expect(screen.getByText(/pilih Jenis Nilai Tambah \(VA\) final/i)).toBeInTheDocument();
    expect(screen.getByText(/Context-Dependent.*belum final/i)).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("setelah dipilih salah satu dari 3 kanonik TANPA menyentuh 'Setuju dengan isian standar', submit berhasil terkirim (backlog #47)", async () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskContextDependent]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Menangani insiden mendadak/ }));
    // "Setuju dengan isian standar" TETAP tercentang (default) — selektor VA sudah
    // enabled tanpa perlu melepasnya (backlog #47, beda dari perilaku lama).

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
    // "Setuju dengan isian standar" TETAP tercentang — sama seperti test di atas.
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

describe("DetailForm — selektor VA tidak dikunci 'Setuju dengan isian standar' (backlog #47)", () => {
  it("positif: task Context-Dependent + standar lain terisi → selektor VA enabled walau 'Setuju' tercentang; isi VA+durasi → Kirim Detail aktif, submit terkirim", async () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskContextDependent]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Menangani insiden mendadak/ }));

    expect(screen.getByRole("checkbox", { name: /Setuju dengan isian standar/ })).toBeChecked();
    const select = screen.getByRole("combobox", { name: /Jenis Nilai Tambah/i });
    expect(select).not.toBeDisabled();

    fireEvent.change(select, { target: { value: "VA-Core" } });
    fireEvent.change(screen.getByRole("spinbutton", { name: /Durasi\/kali/i }), {
      target: { value: "30" },
    });

    for (const btn of screen.getAllByRole("button", { name: "Kirim Detail" })) {
      expect(btn).not.toBeDisabled();
    }

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Kirim Detail" })[0]);
    });

    expect(put).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/kuesioner");
  });

  it("positif: VA & catatan yang sudah diisi bertahan setelah 'Setuju' dilepas lalu dicentang ulang", () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskContextDependent]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Menangani insiden mendadak/ }));
    fireEvent.change(screen.getByRole("combobox", { name: /Jenis Nilai Tambah/i }), {
      target: { value: "VA-Core" },
    });
    const catatan = screen.getByPlaceholderText(/Tuliskan keberatan/i) as HTMLTextAreaElement;
    fireEvent.change(catatan, { target: { value: "Sudah saya kerjakan sendiri" } });

    const setujuCheckbox = screen.getByRole("checkbox", { name: /Setuju dengan isian standar/ });
    fireEvent.click(setujuCheckbox); // lepas
    fireEvent.click(setujuCheckbox); // centang ulang

    const selectSetelah = screen.getByRole("combobox", {
      name: /Jenis Nilai Tambah/i,
    }) as HTMLSelectElement;
    expect(selectSetelah.value).toBe("VA-Core");
    expect((screen.getByPlaceholderText(/Tuliskan keberatan/i) as HTMLTextAreaElement).value).toBe(
      "Sudah saya kerjakan sendiri",
    );
  });

  it("regresi lock: Sumber Bukti/Kondisi/Frekuensi tetap disabled selama 'Setuju' tercentang", () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskContextDependent]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Menangani insiden mendadak/ }));

    expect(screen.getByLabelText(/Sumber Bukti/i)).toBeDisabled();
    expect(screen.getByLabelText(/^Kondisi/i)).toBeDisabled();
    expect(screen.getByLabelText(/^Frekuensi/i)).toBeDisabled();
    expect(screen.getByRole("combobox", { name: /Jenis Nilai Tambah/i })).not.toBeDisabled();
  });

  it("negatif: VA dibiarkan belum dipilih → 'Kirim Detail' tetap disabled + teks 'N task belum dilengkapi' tetap tampil", () => {
    render(
      <DetailForm
        respondenId="tresp_1"
        tasks={[taskContextDependent]}
        detailAwal={[]}
        accessToken="tok"
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Menangani insiden mendadak/ }));
    fireEvent.change(screen.getByRole("spinbutton", { name: /Durasi\/kali/i }), {
      target: { value: "30" },
    });
    // VA sengaja dibiarkan belum dipilih.

    for (const btn of screen.getAllByRole("button", { name: "Kirim Detail" })) {
      expect(btn).toBeDisabled();
    }
    expect(screen.getAllByText(/1 task belum dilengkapi/i).length).toBeGreaterThan(0);
  });

  it("regresi: task ber-std_va_type final ('VA-Enable') tidak menampilkan selektor VA sama sekali; submit tetap berhasil", async () => {
    const taskFinal: TiTaskTerpilihRead = {
      ...taskContextDependent,
      kode: "TIfinal",
      uraian_tugas: "Menyusun jadwal ujian",
      std_va_type: "VA-Enable",
    };
    render(
      <DetailForm respondenId="tresp_1" tasks={[taskFinal]} detailAwal={[]} accessToken="tok" />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Menyusun jadwal ujian/ }));

    expect(screen.queryByRole("combobox", { name: /Jenis Nilai Tambah/i })).not.toBeInTheDocument();
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
});
