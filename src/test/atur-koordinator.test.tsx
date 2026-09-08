import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type { TiRespondenRead } from "@/lib/api/schema";

// ── Mock router & API client ────────────────────────────────────────────────
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ PATCH: patch }),
}));

import { AturKoordinator } from "@/app/(auth)/task-inventory/[sesi_id]/atur-koordinator";

// ── Fixtures ────────────────────────────────────────────────────────────────
function resp(
  id: string,
  nama: string,
  partisipanId: string | null,
  over: Partial<TiRespondenRead> = {},
): TiRespondenRead {
  return {
    id,
    sesi_id: "sesi_1",
    nama,
    partisipan_id: partisipanId,
    tahap1_submit: false,
    tahap1_submitted_at: null,
    tahap3_submit: false,
    tahap3_submitted_at: null,
    created_at: "2026-09-08T00:00:00Z",
    ...over,
  };
}
const responden = [
  resp("trsp_a", "Agustinus Widjianta", "par_a"),
  resp("trsp_b", "Susana", "par_b"),
];
// Responden manual (tanpa partisipan_id) tidak boleh muncul sebagai kandidat.
const respondenManual = resp("trsp_x", "Orang Manual", null);

function renderCmp(over: Partial<Parameters<typeof AturKoordinator>[0]> = {}) {
  return render(
    <AturKoordinator
      sesiId="sesi_1"
      koordinatorId={null}
      responden={responden}
      accessToken="tok"
      {...over}
    />,
  );
}

const toastSukses = vi.mocked(toast.success);
const toastError = vi.mocked(toast.error);

beforeEach(() => {
  refresh.mockReset();
  patch.mockReset();
  toastSukses.mockReset();
  toastError.mockReset();
  patch.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
});

describe("AturKoordinator — hanya responden sesi yang dapat dipilih", () => {
  it("opsi select = responden sesi (bernama) + opsi kosong; responden manual tidak muncul", () => {
    renderCmp({ responden: [...responden, respondenManual] });
    expect(screen.getByRole("option", { name: "Agustinus Widjianta" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Susana" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "— Tidak ada koordinator —" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Orang Manual" })).toBeNull();
    // total opsi = 2 responden bertaut partisipan + 1 kosong
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("menampilkan koordinator saat ini berdasarkan nama, bukan id", () => {
    renderCmp({ koordinatorId: "par_b" });
    // "Susana" juga muncul sebagai opsi; batasi ke baris "Saat ini:"
    expect(screen.getByText(/Saat ini:/)).toHaveTextContent("Susana");
  });

  it("tombol Simpan nonaktif sampai pilihan berubah", () => {
    renderCmp({ koordinatorId: "par_a" });
    expect(screen.getByRole("button", { name: "Simpan Koordinator" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Pilih koordinator"), { target: { value: "par_b" } });
    expect(screen.getByRole("button", { name: "Simpan Koordinator" })).toBeEnabled();
  });
});

describe("AturKoordinator — submit PATCH koordinator_id", () => {
  it("mengirim koordinator_id terpilih", async () => {
    renderCmp();
    fireEvent.change(screen.getByLabelText("Pilih koordinator"), { target: { value: "par_a" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Koordinator" }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/{sesi_id}",
      expect.objectContaining({
        params: { path: { sesi_id: "sesi_1" } },
        body: { koordinator_id: "par_a" },
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("memilih opsi kosong mengirim koordinator_id null (menghapus koordinator)", async () => {
    renderCmp({ koordinatorId: "par_a" });
    fireEvent.change(screen.getByLabelText("Pilih koordinator"), { target: { value: "" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Koordinator" }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith(
      "/api/v1/task-inventory/sesi/{sesi_id}",
      expect.objectContaining({ body: { koordinator_id: null } }),
    );
  });
});

describe("AturKoordinator — regresi: notifikasi sukses tidak boleh bergantung prop basi", () => {
  it("PATCH sukses walau prop koordinatorId belum ikut berubah: toast sukses TETAP muncul", async () => {
    // koordinatorId sengaja TIDAK diubah setelah PATCH — mensimulasikan router.refresh()
    // yang belum round-trip. Dulu banner digate `sukses && !berubah`, dan `berubah`
    // dihitung dari prop yang masih basi → pesan sukses tidak pernah terlihat.
    renderCmp({ koordinatorId: null });
    fireEvent.change(screen.getByLabelText("Pilih koordinator"), { target: { value: "par_a" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Koordinator" }));
    });

    await waitFor(() => expect(toastSukses).toHaveBeenCalledTimes(1));
    expect(toastSukses).toHaveBeenCalledWith("Koordinator diperbarui.");
    expect(toastError).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it("memilih opsi kosong: toast 'Koordinator dikosongkan.'", async () => {
    renderCmp({ koordinatorId: "par_a" });
    fireEvent.change(screen.getByLabelText("Pilih koordinator"), { target: { value: "" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Koordinator" }));
    });

    await waitFor(() => expect(toastSukses).toHaveBeenCalledTimes(1));
    expect(toastSukses).toHaveBeenCalledWith("Koordinator dikosongkan.");
  });

  it("PATCH gagal: toast.error DAN error inline role=alert dua-duanya tampil", async () => {
    patch.mockResolvedValue({
      error: { error: "forbidden", message: "Akses ditolak." },
      response: { headers: { get: () => "req-1" } },
    });
    renderCmp({ koordinatorId: null });
    fireEvent.change(screen.getByLabelText("Pilih koordinator"), { target: { value: "par_a" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Koordinator" }));
    });

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("Akses ditolak.", expect.anything());
    expect(screen.getByRole("alert")).toHaveTextContent("Akses ditolak.");
    expect(toastSukses).not.toHaveBeenCalled();
  });
});

describe("AturKoordinator — sesi belum punya responden (kandidat)", () => {
  it("daftar responden kosong: tidak ada select, tampil pesan penjelasan", () => {
    renderCmp({ responden: [] });
    expect(screen.queryByLabelText("Pilih koordinator")).toBeNull();
    expect(screen.getByText(/Belum ada responden pada sesi ini/)).toBeInTheDocument();
  });

  it("seluruh responden manual (tanpa partisipan_id): tidak ada select, tampil pesan penjelasan", () => {
    renderCmp({ responden: [respondenManual] });
    expect(screen.queryByLabelText("Pilih koordinator")).toBeNull();
    expect(screen.getByText(/Belum ada responden pada sesi ini/)).toBeInTheDocument();
  });
});
