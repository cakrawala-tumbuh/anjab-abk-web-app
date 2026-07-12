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

import { AssignRespondenBanyak } from "@/app/(auth)/opm/[sesi_id]/assign-responden-banyak";

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

describe("AssignRespondenBanyak (OPM)", () => {
  it("render checkbox untuk setiap partisipan tersedia", () => {
    render(<AssignRespondenBanyak sesiId="opses_1" partisipan={partisipan} accessToken="tok" />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("submit mengirim partisipan_ids terpilih tanpa jabatan_label/nama", async () => {
    post.mockResolvedValue({
      data: { created: [{ id: "oprs-1" }], skipped: [] },
      error: null,
      response: { headers: { get: () => "req-1" } },
    });
    render(<AssignRespondenBanyak sesiId="opses_1" partisipan={partisipan} accessToken="tok" />);
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tugaskan Terpilih/ }));
    });
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      "/api/v1/opm/sesi/{sesi_id}/responden/bulk",
      expect.objectContaining({
        params: { path: { sesi_id: "opses_1" } },
        body: { partisipan_ids: ["par_a"] },
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("menampilkan ringkasan skipped dengan label Indonesia", async () => {
    post.mockResolvedValue({
      data: {
        created: [],
        skipped: [{ partisipan_id: "par_a", alasan: "kapasitas_penuh" }],
      },
      error: null,
      response: { headers: { get: () => "req-1" } },
    });
    render(<AssignRespondenBanyak sesiId="opses_1" partisipan={partisipan} accessToken="tok" />);
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tugaskan Terpilih/ }));
    });
    expect(await screen.findByText(/Kapasitas sesi penuh/)).toBeInTheDocument();
  });

  it("render null bila tidak ada partisipan tersedia", () => {
    const { container } = render(
      <AssignRespondenBanyak sesiId="opses_1" partisipan={[]} accessToken="tok" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
