import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DcsSubSkalaWithItemsRead, DcsJawabanRead } from "@/lib/api/schema";

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
import { DcsForm } from "@/app/(auth)/dcs/isi/[responden_id]/dcs-form";

const subskala = [
  {
    kode: "DEMAND",
    nama: "Tuntutan Kerja",
    urutan: 1,
    items: [
      { item_id: "d1", pernyataan: "Pernyataan 1", urutan: 1 },
      { item_id: "d2", pernyataan: "Pernyataan 2", urutan: 2 },
    ],
  },
] as unknown as DcsSubSkalaWithItemsRead[];

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

describe("DcsForm — mode demo tidak menyentuh backend", () => {
  it("banner demo tampil", () => {
    render(
      <DcsForm
        demo
        respondenId="demo"
        subskala={subskala}
        jawabanAwal={[] as DcsJawabanRead[]}
        sudahSubmit={false}
        accessToken={undefined}
      />,
    );
    expect(screen.getByText(/Mode Demo\./)).toBeInTheDocument();
    expect(screen.getByText(/tidak disimpan/)).toBeInTheDocument();
  });

  it("Kirim Jawaban di mode demo → panel 'Peragaan selesai', TANPA PUT/POST/refresh", async () => {
    const { container } = render(
      <DcsForm
        demo
        respondenId="demo"
        subskala={subskala}
        jawabanAwal={[] as DcsJawabanRead[]}
        sudahSubmit={false}
        accessToken="tok"
      />,
    );
    pilih(container, "d1", 5);
    pilih(container, "d2", 4);
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Kirim Jawaban" })[0]);
    });
    expect(await screen.findByText("Peragaan selesai.")).toBeInTheDocument();
    // Bukti keras: tidak ada satu pun jalur tulis yang tersentuh.
    expect(withServerAuth).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("Simpan di mode demo → pesan draft-tidak-disimpan, TANPA PUT", async () => {
    render(
      <DcsForm
        demo
        respondenId="demo"
        subskala={subskala}
        jawabanAwal={[] as DcsJawabanRead[]}
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

  it("'Ulangi Demo' mengembalikan form kosong tanpa memanggil backend", async () => {
    const { container } = render(
      <DcsForm
        demo
        respondenId="demo"
        subskala={subskala}
        jawabanAwal={[] as DcsJawabanRead[]}
        sudahSubmit={false}
        accessToken="tok"
      />,
    );
    pilih(container, "d1", 5);
    pilih(container, "d2", 4);
    await act(async () => {
      fireEvent.click(screen.getAllByRole("button", { name: "Kirim Jawaban" })[0]);
    });
    await screen.findByText("Peragaan selesai.");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Ulangi Demo" }));
    });
    // Kembali ke form; penghitung "0 / 2" menandakan skor ter-reset.
    expect(screen.getAllByText(/0 \/ 2 pernyataan dijawab/)[0]).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
