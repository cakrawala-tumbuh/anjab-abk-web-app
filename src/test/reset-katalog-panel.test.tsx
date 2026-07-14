import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";

// ── Mock router & API client ────────────────────────────────────────────────
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post }),
}));

import { ResetKatalogPanel } from "@/app/(auth)/master-data/task-inventory/utilitas/reset-katalog-panel";

const toastSukses = vi.mocked(toast.success);
const toastError = vi.mocked(toast.error);

// ── Fixtures ────────────────────────────────────────────────────────────────
const okResponse = { headers: { get: () => "req-1" } };

const purgeOk = {
  error: null,
  data: { deleted: { uraian_tugas: 120, detil_tugas: 40, tugas_pokok: 12 } },
  response: okResponse,
};
const reseedOk = {
  error: null,
  data: { created: { jabatan: 8, tugas_pokok: 12, detil_tugas: 40, uraian_tugas: 120 } },
  response: okResponse,
};
function gagal(message: string) {
  return { error: { error: "conflict", message }, response: okResponse };
}

function renderPanel() {
  return render(<ResetKatalogPanel accessToken="tok" initialTotal={120} />);
}

async function klikReset() {
  await act(async () => {
    screen.getByRole("button", { name: "Reset Katalog" }).click();
  });
}

beforeEach(() => {
  refresh.mockReset();
  post.mockReset();
  toastSukses.mockReset();
  toastError.mockReset();
  vi.stubGlobal("confirm", () => true);
});

describe("ResetKatalogPanel — regresi: pesan pemulihan setelah purge sukses & reseed gagal", () => {
  it("purge sukses + reseed gagal: error memberitahu katalog SUDAH DIKOSONGKAN", async () => {
    post.mockResolvedValueOnce(purgeOk).mockResolvedValueOnce(gagal("Seed file rusak."));
    renderPanel();

    await klikReset();

    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    // Inti regresi: dulu cabang ini digate state `emptied` yang di dalam catch masih
    // `false` (stale closure), sehingga pesan pemulihan tidak pernah muncul.
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/sudah dikosongkan/);
    expect(alert).toHaveTextContent(/klik ulang/);

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith(
      expect.stringContaining("sudah dikosongkan"),
      expect.anything(),
    );
    expect(toastSukses).not.toHaveBeenCalled();
    // Reset tidak tuntas → tidak ada ringkasan.
    expect(screen.queryByText(/✓ Katalog berhasil di-reset\./)).toBeNull();
  });

  it("purge gagal: pesan error dari API, TIDAK menyebut 'sudah dikosongkan'", async () => {
    post.mockResolvedValueOnce(gagal("Masih ada sesi Task Inventory."));
    renderPanel();

    await klikReset();

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    // Reseed tidak boleh dicoba bila purge gagal.
    expect(post).toHaveBeenCalledTimes(1);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Masih ada sesi Task Inventory.");
    expect(alert).not.toHaveTextContent(/sudah dikosongkan/);
    expect(toastError).toHaveBeenCalledWith("Masih ada sesi Task Inventory.", expect.anything());
  });

  it("purge + reseed sukses: toast sukses + ringkasan deleted/created tampil", async () => {
    post.mockResolvedValueOnce(purgeOk).mockResolvedValueOnce(reseedOk);
    renderPanel();

    await klikReset();

    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post).toHaveBeenNthCalledWith(1, "/api/v1/task-inventory/catalog/purge", {});
    expect(post).toHaveBeenNthCalledWith(2, "/api/v1/task-inventory/catalog/reseed", {});

    expect(toastSukses).toHaveBeenCalledWith("Katalog berhasil di-reset.");
    expect(toastError).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(refresh).toHaveBeenCalled();

    expect(screen.getByText(/Dihapus:/)).toHaveTextContent(
      "Dihapus: 120 uraian tugas, 40 detil tugas, 12 tugas pokok.",
    );
    expect(screen.getByText(/Diisi ulang:/)).toHaveTextContent(
      "Diisi ulang: 8 jabatan, 12 tugas pokok, 40 detil tugas, 120 uraian tugas.",
    );
  });

  it("confirm dibatalkan: tidak ada panggilan API sama sekali", async () => {
    vi.stubGlobal("confirm", () => false);
    renderPanel();

    await klikReset();

    expect(post).not.toHaveBeenCalled();
    expect(toastSukses).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });
});
