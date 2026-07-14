import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
}));

const put = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ PUT: put, POST: post }),
}));

import { DetailForm } from "@/app/(auth)/task-inventory/tahap3/[responden_id]/detail-form";

// Sesi TAHAP3 tapi himpunan task final KOSONG — kondisi sah (koordinator tidak
// menyetujui satu pun task partial), bukan kegagalan. Halaman tidak boleh
// menampilkan formulir kosong yang tampak sah.
describe("DetailForm — Tahap 3 dengan 0 task final", () => {
  it("menampilkan pesan eksplisit 'tidak ada task final', bukan formulir kosong", () => {
    render(<DetailForm respondenId="tresp_1" tasks={[]} detailAwal={[]} accessToken="tok" />);

    expect(screen.getByRole("alert")).toHaveTextContent(/Tidak ada task final/i);
    expect(screen.getByText(/Hubungi administrator/i)).toBeInTheDocument();
  });

  it("tombol 'Kirim Detail' tidak aktif", () => {
    render(<DetailForm respondenId="tresp_1" tasks={[]} detailAwal={[]} accessToken="tok" />);

    const kirim = screen.getByRole("button", { name: "Kirim Detail" });
    expect(kirim).toBeDisabled();
  });

  it("tidak menampilkan ringkasan menyesatkan '0 dari 0 task' maupun tombol Simpan", () => {
    render(<DetailForm respondenId="tresp_1" tasks={[]} detailAwal={[]} accessToken="tok" />);

    expect(screen.queryByText(/Ditandai dikerjakan/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull();
  });
});
