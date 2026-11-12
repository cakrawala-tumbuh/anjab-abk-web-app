import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type { CeritaPrabankRead } from "@/lib/api/schema";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh }) }));

const put = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api/client", () => ({ withServerAuth: () => ({ PUT: put, POST: post }) }));

import { CeritaBebas } from "@/app/(auth)/task-inventory/tahap1/[responden_id]/cerita-bebas";

const resp = (status = 200) => ({ headers: { get: () => "req-1" }, status });
const BEKUKAN = "/api/v1/task-inventory/sesi/responden/{responden_id}/cerita-prabank/bekukan";
const PAPARAN = "/api/v1/task-inventory/sesi/responden/{responden_id}/paparan";

const cerita: CeritaPrabankRead = { id: "c1", teks: "Saya mengajar kelas X.", frozen_at: null };

beforeEach(() => {
  put.mockReset();
  post.mockReset();
  refresh.mockReset();
  vi.mocked(toast.error).mockClear();
});

function tampil(c: CeritaPrabankRead | null = cerita) {
  return render(<CeritaBebas respondenId="r1" cerita={c} accessToken="tok" />);
}

describe("CeritaBebas", () => {
  it("Bekukan & lanjut memanggil bekukan lalu paparan BANK_TUGAS berurutan, lalu refresh", async () => {
    post.mockResolvedValue({ data: {}, error: undefined, response: resp(201) });
    tampil();
    fireEvent.click(screen.getByRole("button", { name: /Bekukan & lanjut/ }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(post.mock.calls.map((c) => c[0])).toEqual([BEKUKAN, PAPARAN]);
    expect(post.mock.calls[1][1].body).toEqual({ jenis: "BANK_TUGAS" });
  });

  it("paparan 409 -> pesan tampil, tanpa refresh", async () => {
    post
      .mockResolvedValueOnce({ data: {}, error: undefined, response: resp() })
      .mockResolvedValueOnce({
        data: undefined,
        error: { error: "conflict", message: "Paparan ditolak." },
        response: resp(409),
      });
    tampil();
    fireEvent.click(screen.getByRole("button", { name: /Bekukan & lanjut/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Paparan ditolak.");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("bekukan gagal -> paparan tidak dikirim, tanpa refresh", async () => {
    post.mockResolvedValueOnce({
      data: undefined,
      error: { error: "CERITA_KOSONG", message: "Cerita kosong." },
      response: resp(422),
    });
    tampil();
    fireEvent.click(screen.getByRole("button", { name: /Bekukan & lanjut/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Cerita kosong.");
    expect(post).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("setelah bekukan sukses tapi paparan gagal, ulang hanya mengirim paparan", async () => {
    post
      .mockResolvedValueOnce({ data: {}, error: undefined, response: resp() })
      .mockResolvedValueOnce({
        data: undefined,
        error: { error: "internal_error", message: "Gagal." },
        response: resp(500),
      })
      .mockResolvedValueOnce({ data: {}, error: undefined, response: resp(201) });
    tampil();
    fireEvent.click(screen.getByRole("button", { name: /Bekukan & lanjut/ }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: /Lanjut ke daftar tugas/ }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(post.mock.calls.map((c) => c[0])).toEqual([BEKUKAN, PAPARAN, PAPARAN]);
  });

  it("Lewati cerita: Batal tidak mengirim apa pun; OK hanya mengirim paparan", async () => {
    post.mockResolvedValue({ data: {}, error: undefined, response: resp(201) });
    tampil();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: /Lewati cerita/ }));
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringMatching(/tidak akan tercatat/));
    expect(post).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /Lewati cerita/ }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(post.mock.calls.map((c) => c[0])).toEqual([PAPARAN]);
    confirmSpy.mockRestore();
  });

  it("teks diubah belum disimpan -> Bekukan nonaktif; Simpan memanggil PUT lalu mengaktifkannya", async () => {
    put.mockResolvedValue({
      data: { id: "c1", teks: "Teks baru", frozen_at: null },
      error: undefined,
      response: resp(),
    });
    tampil();
    fireEvent.change(screen.getByLabelText(/Cerita pekerjaan/), { target: { value: "Teks baru" } });
    expect(screen.getByRole("button", { name: /Bekukan & lanjut/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /Simpan cerita/ }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1].body).toEqual({ teks: "Teks baru" });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Bekukan & lanjut/ })).toBeEnabled(),
    );
  });

  it("cerita yang sudah beku tampil baca-saja; hanya tombol lanjut (tanpa bekukan ulang)", async () => {
    post.mockResolvedValue({ data: {}, error: undefined, response: resp(201) });
    tampil({ ...cerita, frozen_at: "2026-11-12T00:00:00Z" });
    expect(screen.getByLabelText(/Cerita pekerjaan/)).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: /Lewati cerita/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Lanjut ke daftar tugas/ }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(post.mock.calls.map((c) => c[0])).toEqual([PAPARAN]);
  });
});
