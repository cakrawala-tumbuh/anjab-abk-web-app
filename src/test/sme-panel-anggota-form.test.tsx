import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";

// ── Mock router & API client ────────────────────────────────────────────────
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const patch = vi.fn();
const del = vi.fn();
vi.mock("@/lib/api/client", () => ({
  api: { GET: vi.fn() },
  withServerAuth: () => ({ PATCH: patch, DELETE: del }),
}));

import {
  SetKoordinatorButton,
  HapusAnggotaButton,
} from "@/app/(auth)/master-data/sme-panel/[id]/anggota-form";

const toastSukses = vi.mocked(toast.success);
const toastError = vi.mocked(toast.error);

const okResponse = { headers: { get: () => "req-1" } };
const forbidden = {
  error: { error: "forbidden", message: "Akses ditolak." },
  response: okResponse,
};

const alertSpy = vi.fn();

beforeEach(() => {
  refresh.mockReset();
  patch.mockReset();
  del.mockReset();
  toastSukses.mockReset();
  toastError.mockReset();
  alertSpy.mockReset();
  vi.stubGlobal("confirm", () => true);
  vi.stubGlobal("alert", alertSpy);
});

function renderSetKoordinator(isKoordinator: boolean) {
  return render(
    <SetKoordinatorButton
      panelId="pnl_1"
      partisipanId="par_a"
      isKoordinator={isKoordinator}
      accessToken="tok"
    />,
  );
}

async function klik(nama: string) {
  await act(async () => {
    screen.getByRole("button", { name: nama }).click();
  });
}

describe("SetKoordinatorButton — regresi: error PATCH tidak boleh ditelan", () => {
  it("PATCH gagal (403): toast.error dipanggil DAN router.refresh TIDAK dipanggil", async () => {
    patch.mockResolvedValue(forbidden);
    renderSetKoordinator(false);

    await klik("Jadikan Koordinator");

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("Akses ditolak.", expect.anything());
    // Inti regresi: dulu refresh() tetap jalan walau backend menolak.
    expect(refresh).not.toHaveBeenCalled();
    expect(toastSukses).not.toHaveBeenCalled();
  });

  it("PATCH sukses: toast.success + router.refresh dipanggil", async () => {
    patch.mockResolvedValue({ error: null, data: {}, response: okResponse });
    renderSetKoordinator(false);

    await klik("Jadikan Koordinator");

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith(
      "/api/v1/sme-panel/{panel_id}",
      expect.objectContaining({
        params: { path: { panel_id: "pnl_1" } },
        body: { koordinator_id: "par_a" },
      }),
    );
    expect(toastSukses).toHaveBeenCalledWith("Koordinator panel diperbarui.");
    expect(refresh).toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("isKoordinator=true: mengirim koordinator_id null dan memberi tahu dikosongkan", async () => {
    patch.mockResolvedValue({ error: null, data: {}, response: okResponse });
    renderSetKoordinator(true);

    await klik("Batalkan Koordinator");

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith(
      "/api/v1/sme-panel/{panel_id}",
      expect.objectContaining({ body: { koordinator_id: null } }),
    );
    expect(toastSukses).toHaveBeenCalledWith("Koordinator panel dikosongkan.");
    expect(refresh).toHaveBeenCalled();
  });
});

describe("HapusAnggotaButton — regresi: notifikasi lewat toast, bukan alert()", () => {
  function renderHapus() {
    return render(<HapusAnggotaButton panelId="pnl_1" partisipanId="par_a" accessToken="tok" />);
  }

  it("DELETE gagal: toast.error dipanggil, alert() TIDAK dipanggil", async () => {
    del.mockResolvedValue(forbidden);
    renderHapus();

    await klik("Hapus");

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("Akses ditolak.", expect.anything());
    expect(alertSpy).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("DELETE sukses: toast.success + router.refresh, tanpa alert()", async () => {
    del.mockResolvedValue({ error: null, data: {}, response: okResponse });
    renderHapus();

    await klik("Hapus");

    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(del).toHaveBeenCalledWith(
      "/api/v1/sme-panel/{panel_id}/anggota/{partisipan_id}",
      expect.objectContaining({
        params: { path: { panel_id: "pnl_1", partisipan_id: "par_a" } },
      }),
    );
    expect(toastSukses).toHaveBeenCalledWith("Anggota berhasil dikeluarkan dari panel.");
    expect(refresh).toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("confirm dibatalkan: tidak ada panggilan DELETE sama sekali", async () => {
    vi.stubGlobal("confirm", () => false);
    renderHapus();

    await klik("Hapus");

    expect(del).not.toHaveBeenCalled();
    expect(toastSukses).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });
});
