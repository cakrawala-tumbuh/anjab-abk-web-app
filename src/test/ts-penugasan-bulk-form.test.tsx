import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PartisipanRead, JabatanRead } from "@/lib/api/schema";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post }),
}));

import { TsPenugasanBulkForm } from "@/app/(auth)/time-study/tugaskan-banyak/ts-penugasan-bulk-form";

function par(id: string, nama: string): PartisipanRead {
  return {
    id,
    nama,
    email: `${id}@sekolah.id`,
    sekolah_id: "skl_1",
    jabatan_utama_id: "jbt_1",
    jabatan_tambahan_ids: [],
  } as unknown as PartisipanRead;
}

const jabatan = [{ id: "jbt_1", nama: "Guru Kelas" } as unknown as JabatanRead];
const partisipan = [par("par_a", "Agustinus"), par("par_b", "Susana")];

beforeEach(() => {
  refresh.mockReset();
  post.mockReset();
});

describe("TsPenugasanBulkForm", () => {
  it("render checkbox berlabel nama + jabatan", () => {
    render(<TsPenugasanBulkForm partisipan={partisipan} jabatan={jabatan} accessToken="tok" />);
    expect(screen.getByText("Agustinus")).toBeInTheDocument();
    expect(screen.getAllByText("Guru Kelas")).toHaveLength(2);
  });

  it("pilih semua lalu submit mengirim partisipan_ids + aktif + catatan", async () => {
    post.mockResolvedValue({
      data: { created: [{ id: "tpn-1" }, { id: "tpn-2" }], skipped: [] },
      error: null,
      response: { headers: { get: () => "req-1" } },
    });
    render(<TsPenugasanBulkForm partisipan={partisipan} jabatan={jabatan} accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Pilih semua" }));
    fireEvent.change(screen.getByLabelText(/Catatan/), { target: { value: "Batch Juli" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tugaskan Terpilih/ }));
    });
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      "/api/v1/time-study/penugasan/bulk",
      expect.objectContaining({
        body: { partisipan_ids: ["par_a", "par_b"], aktif: true, catatan: "Batch Juli" },
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("menampilkan ringkasan skipped dengan label Indonesia", async () => {
    post.mockResolvedValue({
      data: {
        created: [],
        skipped: [{ partisipan_id: "par_a", alasan: "sudah_terdaftar" }],
      },
      error: null,
      response: { headers: { get: () => "req-1" } },
    });
    render(<TsPenugasanBulkForm partisipan={partisipan} jabatan={jabatan} accessToken="tok" />);
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tugaskan Terpilih/ }));
    });
    expect(await screen.findByText(/Sudah terdaftar/)).toBeInTheDocument();
  });

  it("tampilkan pesan bila tidak ada partisipan tersedia", () => {
    render(<TsPenugasanBulkForm partisipan={[]} jabatan={jabatan} accessToken="tok" />);
    expect(
      screen.getByText(/Seluruh partisipan sudah memiliki penugasan Time Study/),
    ).toBeInTheDocument();
  });
});
