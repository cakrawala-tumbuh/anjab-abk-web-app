import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type { OpmJawabanRead, OpmSesiTaskRead } from "@/lib/api/schema";

// ── Mock router & API client ────────────────────────────────────────────────
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const put = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ PUT: put, POST: post }),
}));

import { OpmForm } from "@/app/(auth)/opm/isi/[responden_id]/opm-form";

const toastSukses = vi.mocked(toast.success);
const toastError = vi.mocked(toast.error);

// ── Fixtures ────────────────────────────────────────────────────────────────
function task(
  kode: string,
  urutan: number,
  std?: { importance?: number | null; frequency?: number | null; criticality?: number | null },
): OpmSesiTaskRead {
  return {
    task_kode: kode,
    uraian_tugas: `Uraian ${kode}`,
    tugas_pokok: `Pokok ${kode}`,
    detil_tugas: null,
    urutan,
    std_importance: std?.importance ?? null,
    std_frequency: std?.frequency ?? null,
    std_criticality: std?.criticality ?? null,
  };
}

function jawabanTersimpan(
  taskKode: string,
  importance: number,
  frequency: number,
  criticality: number,
): OpmJawabanRead {
  return {
    id: `opjw_${taskKode}`,
    responden_id: "oprs_1",
    task_kode: taskKode,
    importance,
    frequency,
    criticality,
    catatan: null,
  };
}

const TASKS = [task("K001", 1), task("K002", 2), task("K003", 3)];
const DIMENSI = ["importance", "frequency", "criticality"] as const;

const okResponse = { headers: { get: () => "req-1" } };

function renderForm() {
  return render(
    <OpmForm
      respondenId="oprs_1"
      task={TASKS}
      jawabanAwal={[]}
      sudahSubmit={false}
      accessToken="tok"
    />,
  );
}

/** Nilai ketiga dimensi satu task — menjadikannya "lengkap". */
function nilaiLengkap(container: HTMLElement, kode: string, nilai = 4) {
  for (const dim of DIMENSI) {
    const input = container.querySelector<HTMLInputElement>(
      `input[name="${kode}-${dim}"][value="${nilai}"]`,
    );
    if (!input) throw new Error(`radio ${kode}-${dim}=${nilai} tidak ditemukan`);
    fireEvent.click(input);
  }
}

/** Nilai HANYA satu dimensi — task tetap parsial, tidak ikut terkirim. */
function nilaiParsial(container: HTMLElement, kode: string, nilai = 3) {
  const input = container.querySelector<HTMLInputElement>(
    `input[name="${kode}-importance"][value="${nilai}"]`,
  );
  if (!input) throw new Error(`radio ${kode}-importance=${nilai} tidak ditemukan`);
  fireEvent.click(input);
}

async function klikSimpan() {
  await act(async () => {
    fireEvent.click(screen.getAllByRole("button", { name: "Simpan" })[0]);
  });
}

beforeEach(() => {
  refresh.mockReset();
  put.mockReset();
  post.mockReset();
  toastSukses.mockReset();
  toastError.mockReset();
  put.mockResolvedValue({ error: null, data: [], response: okResponse });
  post.mockResolvedValue({ error: null, response: okResponse });
  vi.spyOn(window, "confirm");
});

describe("OpmForm — regresi: draft parsial tidak boleh dilaporkan sebagai tersimpan penuh", () => {
  it("hanya 1 dari 3 task lengkap: pesan menyebut '1 dari 3', bukan sekadar 'Draft tersimpan.'", async () => {
    const { container } = renderForm();

    nilaiLengkap(container, "K001");
    nilaiParsial(container, "K002"); // 1 dimensi saja → dibuang payload
    // K003 sama sekali tidak dinilai

    await klikSimpan();

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));

    // Inti regresi: user diberi tahu berapa yang benar-benar tersimpan.
    expect(toastSukses).toHaveBeenCalledWith(expect.stringContaining("1 dari 3"));
    expect(screen.getByText(/1 dari 3/)).toBeInTheDocument();

    // Bukti bahwa task parsial memang dibuang: body PUT hanya berisi 1 jawaban.
    const body = put.mock.calls[0][1].body as { jawaban: { task_kode: string }[] };
    expect(body.jawaban).toHaveLength(1);
    expect(body.jawaban[0].task_kode).toBe("K001");
    expect(toastError).not.toHaveBeenCalled();
  });

  it("semua task lengkap: pesan persis 'Draft tersimpan.' tanpa keterangan 'dari'", async () => {
    const { container } = renderForm();

    for (const t of TASKS) nilaiLengkap(container, t.task_kode);

    await klikSimpan();

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(toastSukses).toHaveBeenCalledWith("Draft tersimpan.");
    expect(toastSukses).not.toHaveBeenCalledWith(expect.stringContaining("dari"));

    const body = put.mock.calls[0][1].body as { jawaban: { task_kode: string }[] };
    expect(body.jawaban).toHaveLength(3);
  });

  it("PUT gagal: toast.error dipanggil dan tidak ada notifikasi sukses palsu", async () => {
    put.mockResolvedValue({
      error: { error: "conflict", message: "Sesi sudah ditutup." },
      response: okResponse,
    });
    const { container } = renderForm();

    nilaiLengkap(container, "K001");
    await klikSimpan();

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("Sesi sudah ditutup.", expect.anything());
    expect(toastSukses).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Sesi sudah ditutup.");
  });
});

describe("OpmForm — label skala 1-5 (issue #43: nilai 2-4 tidak lagi angka telanjang)", () => {
  it("kelima pil tiap dimensi memuat teks label, bukan hanya angka", () => {
    const { container } = render(
      <OpmForm
        respondenId="oprs_1"
        task={[task("K001", 1)]}
        jawabanAwal={[]}
        sudahSubmit={false}
        accessToken="tok"
      />,
    );

    for (const dim of DIMENSI) {
      for (const nilai of [1, 2, 3, 4, 5] as const) {
        const input = container.querySelector<HTMLInputElement>(
          `input[name="K001-${dim}"][value="${nilai}"]`,
        );
        expect(input).not.toBeNull();
        const label = input!.closest("label");
        expect(label).not.toBeNull();
        // Teks label harus lebih dari sekadar angka telanjang, mis. "3 — Rutin".
        expect(label!.textContent?.trim()).not.toBe(String(nilai));
        expect(label!.textContent).toMatch(/—/);
      }
    }
  });

  it("memilih nilai 3 pada frequency tetap mengirim frequency: 3 (label tidak mengubah nilai)", async () => {
    post.mockResolvedValue({ error: null, response: okResponse });
    const { container } = renderForm();

    // Lengkapi ketiga task (syarat tombol "Kirim Jawaban" aktif), lalu timpa
    // frequency K001 jadi 3 secara eksplisit.
    for (const t of TASKS) nilaiLengkap(container, t.task_kode, 4);
    const freq3 = container.querySelector<HTMLInputElement>(
      `input[name="K001-frequency"][value="3"]`,
    );
    if (!freq3) throw new Error("radio K001-frequency=3 tidak ditemukan");
    fireEvent.click(freq3);

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /Kirim Jawaban/ })[0]);
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const body = put.mock.calls[put.mock.calls.length - 1][1].body as {
      jawaban: { task_kode: string; frequency: number }[];
    };
    const k001 = body.jawaban.find((j) => j.task_kode === "K001");
    expect(k001?.frequency).toBe(3);
  });

  it("task yang belum dinilai ketiga dimensinya tetap membuat tombol 'Kirim Jawaban' nonaktif (regresi)", () => {
    const { container } = renderForm();

    // Hanya K001 dilengkapi; K002 & K003 dibiarkan kosong.
    nilaiLengkap(container, "K001", 4);

    const tombolKirim = screen.getAllByRole("button", { name: /Kirim Jawaban/ })[0];
    expect(tombolKirim).toBeDisabled();
  });
});

describe("OpmForm — prefill nilai standar & penanda nilai bawaan (issue #48)", () => {
  it("task std lengkap tanpa jawaban tersimpan: ketiga rating ter-select sesuai nilai standar + badge 'Nilai bawaan'", () => {
    const t = task("K001", 1, { importance: 4, frequency: 2, criticality: 5 });
    const { container } = render(
      <OpmForm
        respondenId="oprs_1"
        task={[t]}
        jawabanAwal={[]}
        sudahSubmit={false}
        accessToken="tok"
      />,
    );

    const imp4 = container.querySelector<HTMLInputElement>(
      'input[name="K001-importance"][value="4"]',
    );
    const freq2 = container.querySelector<HTMLInputElement>(
      'input[name="K001-frequency"][value="2"]',
    );
    const crit5 = container.querySelector<HTMLInputElement>(
      'input[name="K001-criticality"][value="5"]',
    );
    expect(imp4?.checked).toBe(true);
    expect(freq2?.checked).toBe(true);
    expect(crit5?.checked).toBe(true);

    expect(screen.getByText("Nilai bawaan")).toBeInTheDocument();

    // Tombol "Kirim Jawaban" langsung aktif karena task sudah lengkap dari prefill.
    expect(screen.getAllByRole("button", { name: /Kirim Jawaban/ })[0]).not.toBeDisabled();
  });

  it("jawaban tersimpan menang atas nilai standar — tampil nilai tersimpan, tanpa badge bawaan", () => {
    const t = task("K001", 1, { importance: 4, frequency: 2, criticality: 5 });
    const { container } = render(
      <OpmForm
        respondenId="oprs_1"
        task={[t]}
        jawabanAwal={[jawabanTersimpan("K001", 1, 1, 1)]}
        sudahSubmit={false}
        accessToken="tok"
      />,
    );

    const imp1 = container.querySelector<HTMLInputElement>(
      'input[name="K001-importance"][value="1"]',
    );
    const imp4 = container.querySelector<HTMLInputElement>(
      'input[name="K001-importance"][value="4"]',
    );
    expect(imp1?.checked).toBe(true);
    expect(imp4?.checked).toBe(false);

    expect(screen.queryByText("Nilai bawaan")).not.toBeInTheDocument();
  });

  it("task std null tetap kosong dan TIDAK diberi badge bawaan", () => {
    const t = task("K001", 1); // std_* semuanya null (default fixture)
    const { container } = render(
      <OpmForm
        respondenId="oprs_1"
        task={[t]}
        jawabanAwal={[]}
        sudahSubmit={false}
        accessToken="tok"
      />,
    );

    for (const dim of DIMENSI) {
      for (const nilai of [1, 2, 3, 4, 5] as const) {
        const input = container.querySelector<HTMLInputElement>(
          `input[name="K001-${dim}"][value="${nilai}"]`,
        );
        expect(input?.checked).toBe(false);
      }
    }
    expect(screen.queryByText("Nilai bawaan")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Kirim Jawaban/ })[0]).toBeDisabled();
  });

  it("mengubah satu dimensi menghilangkan badge bawaan HANYA pada task itu — task lain tidak terpengaruh", () => {
    const t1 = task("K001", 1, { importance: 4, frequency: 2, criticality: 5 });
    const t2 = task("K002", 2, { importance: 3, frequency: 3, criticality: 3 });
    const { container } = render(
      <OpmForm
        respondenId="oprs_1"
        task={[t1, t2]}
        jawabanAwal={[]}
        sudahSubmit={false}
        accessToken="tok"
      />,
    );

    expect(screen.getAllByText("Nilai bawaan")).toHaveLength(2);

    const imp5K001 = container.querySelector<HTMLInputElement>(
      'input[name="K001-importance"][value="5"]',
    );
    if (!imp5K001) throw new Error("radio K001-importance=5 tidak ditemukan");
    fireEvent.click(imp5K001);

    // Hanya K001 kehilangan badge; K002 tetap bawaan.
    expect(screen.getAllByText("Nilai bawaan")).toHaveLength(1);
  });

  it("submit final saat masih ada task bawaan: dialog konfirmasi menyebut jumlahnya; Batal = tidak ada request terkirim", async () => {
    const t = task("K001", 1, { importance: 4, frequency: 2, criticality: 5 });
    vi.mocked(window.confirm).mockReturnValue(false);
    render(
      <OpmForm
        respondenId="oprs_1"
        task={[t]}
        jawabanAwal={[]}
        sudahSubmit={false}
        accessToken="tok"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /Kirim Jawaban/ })[0]);
    });

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("1 dari 1 task"));
    expect(put).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("submit final saat masih ada task bawaan: OK melanjutkan mengirim, nilai bawaan ikut terkirim", async () => {
    const t = task("K001", 1, { importance: 4, frequency: 2, criticality: 5 });
    vi.mocked(window.confirm).mockReturnValue(true);
    render(
      <OpmForm
        respondenId="oprs_1"
        task={[t]}
        jawabanAwal={[]}
        sudahSubmit={false}
        accessToken="tok"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /Kirim Jawaban/ })[0]);
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const body = put.mock.calls[put.mock.calls.length - 1][1].body as {
      jawaban: { task_kode: string; importance: number; frequency: number; criticality: number }[];
    };
    expect(body.jawaban).toEqual([
      { task_kode: "K001", importance: 4, frequency: 2, criticality: 5, catatan: null },
    ]);
  });

  it("submit final saat TIDAK ada task bawaan: tidak ada dialog tambahan", async () => {
    const { container } = renderForm();
    for (const t of TASKS) nilaiLengkap(container, t.task_kode, 4);

    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: /Kirim Jawaban/ })[0]);
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(window.confirm).not.toHaveBeenCalled();
  });
});
