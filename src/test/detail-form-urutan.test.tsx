import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
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
import { urutkanTaskTahap3 } from "@/lib/task-inventory-tahap3-urutan";

function task(kode: string, tugasPokok: string, uraianTugas: string): TiTaskTerpilihRead {
  return {
    kode,
    tugas_pokok: tugasPokok,
    detil_tugas: "",
    uraian_tugas: uraianTugas,
    n_relevan: 1,
    pct_relevan: 100,
    std_sumber_bukti: null,
    std_kondisi: null,
    std_frekuensi_teks: null,
    std_durasi_per_kali: null,
    std_jam_per_minggu: null,
    std_peak4w_hours: null,
    std_va_type: null,
  } as unknown as TiTaskTerpilihRead;
}

beforeEach(() => {
  refresh.mockReset();
  push.mockReset();
  put.mockReset();
  put.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
});

describe("DetailForm — Tahap 3: merender sesuai urutan prop `tasks` (backlog #49)", () => {
  it("kartu task dirender dalam urutan `urutkanTaskTahap3`, bukan urutan asli dari API", () => {
    // Urutan API acak (mis. -n_relevan, kode) — sengaja tidak alfabetis/hierarkis.
    const acak = [
      task("TIz", "Kesiswaan", "Zebra tugas"),
      task("TIa", "Akademik", "Alpha tugas"),
      task("TIm", "Kesiswaan", "Mangga tugas"),
    ];
    const terurut = urutkanTaskTahap3(acak);

    render(<DetailForm respondenId="tresp_1" tasks={terurut} detailAwal={[]} accessToken="tok" />);

    const checkboxes = screen.getAllByRole("checkbox");
    // Urutan hasil urutkanTaskTahap3: Akademik/Alpha, Kesiswaan/Mangga, Kesiswaan/Zebra.
    const labelTexts = checkboxes.map((c) => c.closest("label")?.textContent ?? "");
    expect(labelTexts[0]).toMatch(/Alpha tugas/);
    expect(labelTexts[1]).toMatch(/Mangga tugas/);
    expect(labelTexts[2]).toMatch(/Zebra tugas/);
  });

  it("mencentang satu task lalu menyimpan tetap mengirim task_kode yang benar meski urutan render diubah", async () => {
    const acak = [task("TIz", "Kesiswaan", "Zebra tugas"), task("TIa", "Akademik", "Alpha tugas")];
    const terurut = urutkanTaskTahap3(acak); // TIa (Alpha) dulu, baru TIz (Zebra)

    render(<DetailForm respondenId="tresp_1" tasks={terurut} detailAwal={[]} accessToken="tok" />);

    const checkboxZebra = screen.getByRole("checkbox", { name: /Zebra tugas/ });
    await act(async () => {
      fireEvent.click(checkboxZebra);
    });

    const durasiInputs = screen.getAllByLabelText(/Durasi\/kali \(menit\)/i);
    await act(async () => {
      fireEvent.change(durasiInputs[0], { target: { value: "30" } });
    });

    const tombolSimpan = screen.getAllByRole("button", { name: /Simpan/ })[0];
    await act(async () => {
      fireEvent.click(tombolSimpan);
    });

    await waitFor(() => expect(put).toHaveBeenCalled());
    const body = put.mock.calls[0][1].body as { detail: Array<{ task_kode: string }> };
    expect(body.detail).toHaveLength(1);
    expect(body.detail[0].task_kode).toBe("TIz");
  });
});
