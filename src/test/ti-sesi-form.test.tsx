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

const OK = {
  data: { id: "tises_1" },
  error: null,
  response: { headers: { get: () => "req-1" } },
};

function pilihJabatan(id: string) {
  fireEvent.change(screen.getByLabelText(/^Jabatan/), { target: { value: id } });
}

function pilihCabang(nilai: string) {
  fireEvent.change(screen.getByLabelText(/^Cabang/), { target: { value: nilai } });
}

beforeEach(() => {
  push.mockReset();
  post.mockReset();
  post.mockResolvedValue(OK);
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
});

describe("TiSesiForm — dropdown Cabang", () => {
  it("merender dua opsi (Bandung, Semarang) plus placeholder", () => {
    render(<TiSesiForm kombinasi={kombinasi} accessToken="tok" />);
    const select = screen.getByLabelText(/^Cabang/) as HTMLSelectElement;
    const opsi = Array.from(select.options).map((o) => o.value);
    expect(opsi).toEqual(["", "Bandung", "Semarang"]);
  });

  it("tidak lagi menampilkan field Periode, Min. Responden, Maks. Responden", () => {
    render(<TiSesiForm kombinasi={kombinasi} accessToken="tok" />);
    expect(screen.queryByLabelText(/^Periode/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Min\. Responden/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Maks\. Responden/)).not.toBeInTheDocument();
  });

  it("tidak merender SmePanelInfo", () => {
    render(<TiSesiForm kombinasi={kombinasi} accessToken="tok" />);
    expect(screen.queryByTestId("sme-panel-info")).not.toBeInTheDocument();
  });

  it("menolak submit bila Cabang belum dipilih", async () => {
    render(<TiSesiForm kombinasi={kombinasi} accessToken="tok" />);

    await act(async () => {
      pilihJabatan("jbt_gr_sd");
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Mulai Analisis Jabatan/ }));
    });

    expect(post).not.toHaveBeenCalled();
    expect(await screen.findByText("Cabang wajib dipilih")).toBeInTheDocument();
  });

  it("submit sukses mengirim payload { jabatan_id, cabang } tanpa periode/min/max_responden", async () => {
    render(<TiSesiForm kombinasi={kombinasi} accessToken="tok" />);

    await act(async () => {
      pilihJabatan("jbt_gr_sd");
      pilihCabang("Bandung");
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Mulai Analisis Jabatan/ }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const body = post.mock.calls[0][1].body;
    expect(body).toEqual({
      jabatan_id: "jbt_gr_sd",
      cabang: "Bandung",
      catatan: null,
    });
    expect(vi.mocked(toast.success)).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/task-inventory/tises_1");
  });
});

describe("TiSesiForm — notifikasi kegagalan (regresi 026/017)", () => {
  it("pesan backend 422 tampil di toast dan error inline", async () => {
    const pesan = "Cabang wajib diisi untuk sesi baru.";
    post.mockResolvedValue({
      data: undefined,
      error: { error: "validation_error", message: pesan },
      response: { headers: { get: () => "req-422" } },
    });

    render(<TiSesiForm kombinasi={kombinasi} accessToken="tok" />);

    await act(async () => {
      pilihJabatan("jbt_gr_sd");
      pilihCabang("Semarang");
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

  it("kegagalan 5xx tampil di toast dan error inline", async () => {
    const pesan = "Terjadi kesalahan pada server.";
    post.mockResolvedValue({
      data: undefined,
      error: { error: "internal_error", message: pesan },
      response: { headers: { get: () => "req-500" } },
    });

    render(<TiSesiForm kombinasi={kombinasi} accessToken="tok" />);

    await act(async () => {
      pilihJabatan("jbt_satpam");
      pilihCabang("Bandung");
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Mulai Analisis Jabatan/ }));
    });

    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(1));
    expect(vi.mocked(toast.error).mock.calls[0][0]).toBe(pesan);
    expect(await screen.findByText(pesan)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
