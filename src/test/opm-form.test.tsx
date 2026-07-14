import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type { OpmSesiTaskRead } from "@/lib/api/schema";

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
function task(kode: string, urutan: number): OpmSesiTaskRead {
  return {
    task_kode: kode,
    uraian_tugas: `Uraian ${kode}`,
    tugas_pokok: `Pokok ${kode}`,
    detil_tugas: null,
    urutan,
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
