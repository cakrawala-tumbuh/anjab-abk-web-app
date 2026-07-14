import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type { TiKombinasiRead } from "@/lib/api/schema";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post }),
}));

import { TiSesiForm } from "@/app/(auth)/task-inventory/buat/ti-sesi-form";

function kmb(jabatanId: string, nama: string): TiKombinasiRead {
  return {
    jabatan_id: jabatanId,
    jabatan_nama: nama,
    unit: "SD",
    kategori: "GURU",
  } as unknown as TiKombinasiRead;
}

const kombinasi = [kmb("jbt_gr_sd", "Guru Kelas SD"), kmb("jbt_satpam", "Satpam")];
// Guru Kelas SD punya panel 11 anggota (kondisi produksi YPII 2026-07-14);
// Satpam belum punya SME panel sama sekali.
const petaAnggota = { jbt_gr_sd: 11 };

const OK = {
  data: { id: "tises_1" },
  error: null,
  response: { headers: { get: () => "req-1" } },
};

function isiPeriode() {
  fireEvent.change(screen.getByLabelText(/^Periode/), { target: { value: "2026-07" } });
}

function pilihJabatan(id: string) {
  fireEvent.change(screen.getByLabelText(/^Jabatan/), { target: { value: id } });
}

function maxInput(): HTMLInputElement {
  return screen.getByLabelText(/^Maks\. Responden/) as HTMLInputElement;
}

beforeEach(() => {
  push.mockReset();
  post.mockReset();
  post.mockResolvedValue(OK);
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
});

describe("TiSesiForm — jumlah anggota SME panel", () => {
  it("tidak menampilkan info panel sebelum jabatan dipilih", () => {
    render(<TiSesiForm kombinasi={kombinasi} petaAnggota={petaAnggota} accessToken="tok" />);
    expect(screen.queryByTestId("sme-panel-info")).not.toBeInTheDocument();
  });

  it("menampilkan jumlah anggota panel dan mem-prefill Maks. Responden = 11", async () => {
    render(<TiSesiForm kombinasi={kombinasi} petaAnggota={petaAnggota} accessToken="tok" />);

    expect(maxInput().value).toBe("10");

    await act(async () => {
      pilihJabatan("jbt_gr_sd");
    });

    expect(screen.getByTestId("sme-panel-info")).toHaveTextContent("11 anggota");
    expect(maxInput().value).toBe("11");
  });

  it("mengirim max_responden = jumlah anggota panel", async () => {
    render(<TiSesiForm kombinasi={kombinasi} petaAnggota={petaAnggota} accessToken="tok" />);

    await act(async () => {
      pilihJabatan("jbt_gr_sd");
      isiPeriode();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Mulai Analisis Jabatan/ }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1].body).toMatchObject({
      jabatan_id: "jbt_gr_sd",
      max_responden: 11,
    });
  });

  it("jabatan tanpa SME panel: pesan eksplisit, submit tetap jalan", async () => {
    render(<TiSesiForm kombinasi={kombinasi} petaAnggota={petaAnggota} accessToken="tok" />);

    await act(async () => {
      pilihJabatan("jbt_satpam");
      isiPeriode();
    });

    expect(screen.getByTestId("sme-panel-info")).toHaveTextContent("belum punya SME panel");
    expect(maxInput().value).toBe("10");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Mulai Analisis Jabatan/ }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/task-inventory/tises_1");
  });
});

describe("TiSesiForm — 422 backend tampil utuh", () => {
  it("pesan backend (menyebut kedua angka) muncul di toast dan error inline", async () => {
    const pesan = "Jumlah anggota SME panel (11) melebihi max_responden (10).";
    post.mockResolvedValue({
      data: undefined,
      error: { error: "validation_error", message: pesan },
      response: { headers: { get: () => "req-422" } },
    });

    render(<TiSesiForm kombinasi={kombinasi} petaAnggota={{}} accessToken="tok" />);

    await act(async () => {
      pilihJabatan("jbt_gr_sd");
      isiPeriode();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Mulai Analisis Jabatan/ }));
    });

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(1));
    expect(vi.mocked(toast.error).mock.calls[0][0]).toBe(pesan);
    expect(vi.mocked(toast.error).mock.calls[0][1]).toMatchObject({
      description: "ID permintaan: req-422",
    });
    expect(await screen.findByText(pesan)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
