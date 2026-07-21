import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WcpDimensiWithItemsRead, WcpJawabanRead } from "@/lib/api/schema";

// Router
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

// Klien API — dimock agar setiap panggilan backend TERDETEKSI. Inti test ini:
// dalam mode demo, PUT/POST tidak boleh terpanggil sama sekali.
const put = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: vi.fn(() => ({ PUT: put, POST: post })),
}));

import { withServerAuth } from "@/lib/api/client";
import { WcpForm } from "@/app/(auth)/wcp/isi/[responden_id]/wcp-form";

const dimensi = [
  {
    kode: "SC",
    nama: "Supervisory Climate",
    urutan: 1,
    is_risk: false,
    items: [
      { item_id: "w1", pernyataan: "Pernyataan 1", urutan: 1 },
      { item_id: "w2", pernyataan: "Pernyataan 2", urutan: 2 },
    ],
  },
] as unknown as WcpDimensiWithItemsRead[];

function pilih(container: HTMLElement, itemId: string, nilai: number) {
  const radio = container.querySelector<HTMLInputElement>(
    `input[name="${itemId}"][value="${nilai}"]`,
  );
  fireEvent.click(radio!);
}

beforeEach(() => {
  refresh.mockReset();
  put.mockReset();
  post.mockReset();
  vi.mocked(withServerAuth).mockClear();
});

describe("WcpForm — mode demo tidak menyentuh backend", () => {
  it("banner demo tampil", () => {
    render(
      <WcpForm
        demo
        respondenId="demo"
        dimensi={dimensi}
        jawabanAwal={[] as WcpJawabanRead[]}
        sudahSubmit={false}
        accessToken={undefined}
      />,
    );
    expect(screen.getByText(/Mode Demo\./)).toBeInTheDocument();
    expect(screen.getByText(/tidak disimpan/)).toBeInTheDocument();
  });

  it("Kirim Jawaban di mode demo → panel 'Peragaan selesai', TANPA PUT/POST/refresh", async () => {
    const { container } = render(
      <WcpForm
        demo
        respondenId="demo"
        dimensi={dimensi}
        jawabanAwal={[] as WcpJawabanRead[]}
        sudahSubmit={false}
        accessToken="tok"
      />,
    );
    pilih(container, "w1", 5);
    pilih(container, "w2", 4);
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Kirim Jawaban" })[0]);
    });
    expect(await screen.findByText("Peragaan selesai.")).toBeInTheDocument();
    expect(withServerAuth).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("Simpan di mode demo → pesan draft-tidak-disimpan, TANPA PUT", async () => {
    render(
      <WcpForm
        demo
        respondenId="demo"
        dimensi={dimensi}
        jawabanAwal={[] as WcpJawabanRead[]}
        sudahSubmit={false}
        accessToken="tok"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Simpan" })[0]);
    });
    expect(await screen.findByText("Mode demo — draft tidak disimpan.")).toBeInTheDocument();
    expect(withServerAuth).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });
});
