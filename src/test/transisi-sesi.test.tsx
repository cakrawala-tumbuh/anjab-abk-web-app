import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TiSesiRead } from "@/lib/api/schema";

// ── Mock router & API client ────────────────────────────────────────────────
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post, DELETE: vi.fn() }),
}));

import { TransisiSesi } from "@/app/(auth)/task-inventory/[sesi_id]/transisi-sesi";

const sesiTahap1: TiSesiRead = {
  id: "tises_1",
  jabatan_id: "jbt_1",
  jabatan_nama: "Guru Kelas",
  cabang: "Bandung",
  status: "TAHAP1",
  jumlah_task_terpilih: null,
  created_at: "2026-06-01T00:00:00Z",
};

beforeEach(() => {
  refresh.mockReset();
  post.mockReset();
  post.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
  vi.spyOn(window, "confirm");
});

describe("TransisiSesi — Cancel membatalkan transisi (bukan memaksa)", () => {
  it("Cancel pada dialog Mulai Tahap 2 tidak mengirim POST dan tidak refresh", () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<TransisiSesi sesi={sesiTahap1} accessToken="tok" belumSubmitTahap1={2} />);

    fireEvent.click(screen.getByRole("button", { name: /Mulai Tahap 2/ }));

    expect(post).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("TransisiSesi — OK melanjutkan transisi", () => {
  it("OK pada dialog Mulai Tahap 2 mengirim POST tanpa paksa=true selama checkbox tidak dicentang", async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    render(<TransisiSesi sesi={sesiTahap1} accessToken="tok" belumSubmitTahap1={0} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Mulai Tahap 2/ }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap2",
      expect.objectContaining({
        params: { path: { sesi_id: "tises_1" }, query: { paksa: false } },
      }),
    );
  });

  it("mencentang checkbox paksa lalu OK mengirim POST dengan paksa=true", async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    render(<TransisiSesi sesi={sesiTahap1} accessToken="tok" belumSubmitTahap1={2} />);

    // Checkbox hanya tampil karena belumSubmitTahap1 > 0
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Mulai Tahap 2/ }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/{sesi_id}/mulai-tahap2",
      expect.objectContaining({
        params: { path: { sesi_id: "tises_1" }, query: { paksa: true } },
      }),
    );
  });
});

describe("TransisiSesi — checkbox paksa hanya muncul saat ada yang belum selesai", () => {
  it("tidak menampilkan checkbox saat belumSubmitTahap1 = 0 (default)", () => {
    render(<TransisiSesi sesi={sesiTahap1} accessToken="tok" />);
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("menampilkan checkbox saat belumSubmitTahap1 > 0", () => {
    render(<TransisiSesi sesi={sesiTahap1} accessToken="tok" belumSubmitTahap1={3} />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByText(/3 partisipan belum submit Tahap 1/)).toBeInTheDocument();
  });
});
