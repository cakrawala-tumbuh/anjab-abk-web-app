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
const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ PATCH: patch, GET: get }),
}));

import { PESAN_DATA_BERUBAH } from "@/lib/konkurensi";
import { AturKoordinator } from "@/app/(auth)/task-inventory/[sesi_id]/atur-koordinator";

// ── Fixtures ────────────────────────────────────────────────────────────────
function resp(
  id: string,
  kode: string,
  partisipanId: string | null,
  over: Partial<TiRespondenRead> = {},
): TiRespondenRead {
  return {
    id,
    sesi_id: "sesi_1",
    kode_orang: kode,
    partisipan_id: partisipanId,
    tahap1_submit: false,
    tahap1_submitted_at: null,
    tahap3_submit: false,
    tahap3_submitted_at: null,
    created_at: "2026-09-08T00:00:00Z",
    ...over,
  };
}
const responden = [resp("trsp_a", "O-0001", "par_a"), resp("trsp_b", "O-0002", "par_b")];
// Responden manual (tanpa partisipan_id) tidak boleh muncul sebagai kandidat.
const respondenManual = resp("trsp_x", "O-0099", null);

/** Respons GET detail sesi: koordinator saat ini + ETag dari header yang sama. */
function okSesi(koordinatorId: string | null, etag = '"v1"') {
  return {
    data: { id: "sesi_1", koordinator_id: koordinatorId },
    error: undefined,
    response: { status: 200, headers: { get: (n: string) => (n === "etag" ? etag : "req-1") } },
  };
}

/** Render lalu tunggu GET detail selesai (kontrol baru tampil setelahnya). */
async function renderCmp(
  over: { koordinatorId?: string | null; responden?: TiRespondenRead[] } = {},
) {
  const { koordinatorId = null, responden: daftar = responden } = over;
  get.mockResolvedValue(okSesi(koordinatorId));
  const hasil = render(<AturKoordinator sesiId="sesi_1" responden={daftar} accessToken="tok" />);
  await screen.findByText("Koordinator SME Panel");
  return hasil;
}

const toastSukses = vi.mocked(toast.success);
const toastError = vi.mocked(toast.error);

beforeEach(() => {
  refresh.mockReset();
  patch.mockReset();
  get.mockReset();
  toastSukses.mockReset();
  toastError.mockReset();
  patch.mockResolvedValue({
    error: null,
    response: { headers: { get: (n: string) => (n === "etag" ? '"v2"' : "req-1") } },
  });
});

describe("AturKoordinator — hanya responden sesi yang dapat dipilih", () => {
  it("opsi select = responden sesi (berkode orang) + opsi kosong; responden manual tidak muncul", async () => {
    await renderCmp({ responden: [...responden, respondenManual] });
    expect(screen.getByRole("option", { name: "O-0001" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "O-0002" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "— Tidak ada koordinator —" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "O-0099" })).toBeNull();
    // total opsi = 2 responden bertaut partisipan + 1 kosong
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("menampilkan koordinator saat ini berdasarkan kode orang, bukan id", async () => {
    await renderCmp({ koordinatorId: "par_b" });
    // "O-0002" juga muncul sebagai opsi; batasi ke baris "Saat ini:"
    expect(screen.getByText(/Saat ini:/)).toHaveTextContent("O-0002");
  });

  it("tombol Simpan nonaktif sampai pilihan berubah", async () => {
    await renderCmp({ koordinatorId: "par_a" });
    expect(screen.getByRole("button", { name: "Simpan Koordinator" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Pilih koordinator"), { target: { value: "par_b" } });
    expect(screen.getByRole("button", { name: "Simpan Koordinator" })).toBeEnabled();
  });
});

describe("AturKoordinator — submit PATCH koordinator_id", () => {
  it("mengirim koordinator_id terpilih", async () => {
    await renderCmp();
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
    await renderCmp({ koordinatorId: "par_a" });
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
    await renderCmp({ koordinatorId: null });
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
    await renderCmp({ koordinatorId: "par_a" });
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
    await renderCmp({ koordinatorId: null });
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
  it("daftar responden kosong: tidak ada select, tampil pesan penjelasan", async () => {
    await renderCmp({ responden: [] });
    expect(screen.queryByLabelText("Pilih koordinator")).toBeNull();
    expect(screen.getByText(/Belum ada responden pada sesi ini/)).toBeInTheDocument();
  });

  it("seluruh responden manual (tanpa partisipan_id): tidak ada select, tampil pesan penjelasan", async () => {
    await renderCmp({ responden: [respondenManual] });
    expect(screen.queryByLabelText("Pilih koordinator")).toBeNull();
    expect(screen.getByText(/Belum ada responden pada sesi ini/)).toBeInTheDocument();
  });
});

describe("AturKoordinator — kunci optimistik If-Match", () => {
  it("PATCH mengirim ETag dari GET detail sesi sebagai If-Match", async () => {
    await renderCmp();
    fireEvent.change(screen.getByLabelText("Pilih koordinator"), { target: { value: "par_a" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Koordinator" }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"v1"' });
    expect(get).toHaveBeenCalledWith("/api/v1/task-inventory/sesi/{sesi_id}", {
      params: { path: { sesi_id: "sesi_1" } },
    });
  });

  it("simpan kedua memakai ETag dari respons simpan pertama", async () => {
    await renderCmp();
    fireEvent.change(screen.getByLabelText("Pilih koordinator"), { target: { value: "par_a" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Koordinator" }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText("Pilih koordinator"), { target: { value: "par_b" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Koordinator" }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(2));
    expect(patch.mock.calls[1][1].headers).toEqual({ "If-Match": '"v2"' });
  });

  it("412 -> pesan baku data berubah", async () => {
    patch.mockResolvedValue({
      error: { error: "precondition_failed", message: "etag" },
      response: { status: 412, headers: { get: () => "req-1" } },
    });
    await renderCmp();
    fireEvent.change(screen.getByLabelText("Pilih koordinator"), { target: { value: "par_a" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Koordinator" }));
    });
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(screen.getByRole("alert")).toHaveTextContent(PESAN_DATA_BERUBAH);
  });

  it("GET detail gagal: tombol simpan tidak tersedia, galat tampil", async () => {
    get.mockResolvedValue({
      data: undefined,
      error: { error: "forbidden", message: "Akses ditolak." },
      response: { status: 403, headers: { get: () => "req-1" } },
    });
    render(<AturKoordinator sesiId="sesi_1" responden={responden} accessToken="tok" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Akses ditolak.");
    expect(screen.queryByRole("button", { name: "Simpan Koordinator" })).toBeNull();
  });
});
