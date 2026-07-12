import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PartisipanRead } from "@/lib/api/schema";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post }),
}));

import { AssignRespondenBanyak } from "@/app/(auth)/task-inventory/[sesi_id]/assign-responden-banyak";

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

const partisipan = [par("par_a", "Agustinus"), par("par_b", "Susana")];

beforeEach(() => {
  refresh.mockReset();
  post.mockReset();
});

describe("AssignRespondenBanyak (Task Inventory)", () => {
  it("render checkbox untuk setiap partisipan", () => {
    render(<AssignRespondenBanyak sesiId="tises_1" partisipan={partisipan} accessToken="tok" />);
    expect(screen.getByText("Agustinus")).toBeInTheDocument();
    expect(screen.getByText("Susana")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("tombol submit disabled sampai ada yang dipilih", () => {
    render(<AssignRespondenBanyak sesiId="tises_1" partisipan={partisipan} accessToken="tok" />);
    expect(screen.getByRole("button", { name: /Tugaskan Terpilih/ })).toBeDisabled();
  });

  it("pilih semua lalu submit mengirim seluruh partisipan_ids", async () => {
    post.mockResolvedValue({
      data: { created: [{ id: "trsp-1" }, { id: "trsp-2" }], skipped: [] },
      error: null,
      response: { headers: { get: () => "req-1" } },
    });
    render(<AssignRespondenBanyak sesiId="tises_1" partisipan={partisipan} accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Pilih semua" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tugaskan Terpilih/ }));
    });
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/{sesi_id}/responden/bulk",
      expect.objectContaining({
        params: { path: { sesi_id: "tises_1" } },
        body: { partisipan_ids: ["par_a", "par_b"] },
      }),
    );
    expect(refresh).toHaveBeenCalled();
    expect(await screen.findByText(/2 responden berhasil ditambahkan/)).toBeInTheDocument();
  });

  it("batalkan pilihan mengosongkan seleksi", () => {
    render(<AssignRespondenBanyak sesiId="tises_1" partisipan={partisipan} accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Pilih semua" }));
    fireEvent.click(screen.getByRole("button", { name: "Batalkan pilihan" }));
    expect(screen.getByRole("button", { name: /Tugaskan Terpilih \(0\)/ })).toBeDisabled();
  });

  it("menampilkan alasan skip berlabel Bahasa Indonesia", async () => {
    post.mockResolvedValue({
      data: {
        created: [],
        skipped: [{ partisipan_id: "par_a", alasan: "bukan_anggota_sme_panel" }],
      },
      error: null,
      response: { headers: { get: () => "req-1" } },
    });
    render(<AssignRespondenBanyak sesiId="tises_1" partisipan={partisipan} accessToken="tok" />);
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tugaskan Terpilih/ }));
    });
    expect(await screen.findByText(/Bukan anggota SME panel/)).toBeInTheDocument();
  });

  it("render kosong bila tidak ada partisipan", () => {
    const { container } = render(
      <AssignRespondenBanyak sesiId="tises_1" partisipan={[]} accessToken="tok" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
