import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type { JabatanRead, TiSesiRead } from "@/lib/api/schema";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post }),
}));

import { OpmSesiForm } from "@/app/(auth)/opm/buat/opm-sesi-form";

const jabatan = [{ id: "jbt_gr_sd", nama: "Guru Kelas SD" }] as unknown as JabatanRead[];

const tiSesi = [
  {
    id: "tises_1",
    jabatan_id: "jbt_gr_sd",
    periode: "2026-06",
    status: "CLOSED",
    jumlah_task_terpilih: 19,
  },
] as unknown as TiSesiRead[];

const petaAnggota = { jbt_gr_sd: 11 };

const OK = {
  data: { id: "opses_1" },
  error: null,
  response: { headers: { get: () => "req-1" } },
};

function maxInput(): HTMLInputElement {
  return screen.getByLabelText(/^Maks\. Responden/) as HTMLInputElement;
}

async function isiForm() {
  await act(async () => {
    fireEvent.change(screen.getByLabelText(/^Jabatan/), { target: { value: "jbt_gr_sd" } });
  });
  await act(async () => {
    fireEvent.change(screen.getByLabelText(/^Analisis Jabatan Task Inventory/), {
      target: { value: "tises_1" },
    });
    fireEvent.change(screen.getByLabelText(/^Periode/), { target: { value: "2026-07" } });
  });
}

beforeEach(() => {
  push.mockReset();
  post.mockReset();
  post.mockResolvedValue(OK);
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
});

describe("OpmSesiForm — jumlah anggota SME panel", () => {
  it("tidak menampilkan info panel sebelum jabatan dipilih", () => {
    render(
      <OpmSesiForm jabatan={jabatan} tiSesi={tiSesi} petaAnggota={petaAnggota} accessToken="tok" />,
    );
    expect(screen.queryByTestId("sme-panel-info")).not.toBeInTheDocument();
    expect(maxInput().value).toBe("10");
  });

  it("menampilkan jumlah anggota panel, prefill Maks. Responden, dan mengirimkannya", async () => {
    render(
      <OpmSesiForm jabatan={jabatan} tiSesi={tiSesi} petaAnggota={petaAnggota} accessToken="tok" />,
    );

    await isiForm();

    expect(screen.getByTestId("sme-panel-info")).toHaveTextContent("11 anggota");
    expect(maxInput().value).toBe("11");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Mulai Analisis Jabatan/ }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1].body).toMatchObject({
      jabatan_id: "jbt_gr_sd",
      ti_sesi_id: "tises_1",
      max_responden: 11,
    });
    expect(push).toHaveBeenCalledWith("/opm/opses_1");
  });
});

describe("OpmSesiForm — 422 backend tampil utuh", () => {
  it("pesan backend (menyebut kedua angka) muncul di toast dan error inline", async () => {
    const pesan = "Jumlah anggota SME panel (11) melebihi max_responden (10).";
    post.mockResolvedValue({
      data: undefined,
      error: { error: "validation_error", message: pesan },
      response: { headers: { get: () => "req-422" } },
    });

    render(<OpmSesiForm jabatan={jabatan} tiSesi={tiSesi} petaAnggota={{}} accessToken="tok" />);

    await isiForm();
    expect(maxInput().value).toBe("10");

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
