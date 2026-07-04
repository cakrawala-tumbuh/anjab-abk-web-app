import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PartisipanRead } from "@/lib/api/schema";

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
const anggota = [par("par_a", "Agustinus Widjianta"), par("par_b", "Susana")];
// par_x sengaja BUKAN anggota panel → tidak boleh muncul sebagai opsi
const bukanAnggota = par("par_x", "Orang Luar");

function renderCmp(over: Partial<Parameters<typeof AturKoordinator>[0]> = {}) {
  return render(
    <AturKoordinator
      sesiId="sesi_1"
      koordinatorId={null}
      anggotaPanel={anggota}
      hasPanel={true}
      accessToken="tok"
      {...over}
    />,
  );
}

beforeEach(() => {
  refresh.mockReset();
  patch.mockReset();
  patch.mockResolvedValue({ error: null, response: { headers: { get: () => "req-1" } } });
});

describe("AturKoordinator — hanya anggota panel yang dapat dipilih", () => {
  it("opsi select = anggota panel + opsi kosong; non-anggota tidak muncul", () => {
    renderCmp();
    expect(screen.getByRole("option", { name: "Agustinus Widjianta" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Susana" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "— Tidak ada koordinator —" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: bukanAnggota.nama })).toBeNull();
    // total opsi = 2 anggota + 1 kosong
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

describe("AturKoordinator — tanpa panel / tanpa anggota", () => {
  it("hasPanel=false: tidak ada select, tampil peringatan", () => {
    renderCmp({ hasPanel: false, anggotaPanel: [] });
    expect(screen.queryByLabelText("Pilih koordinator")).toBeNull();
    expect(screen.getByText(/SME panel untuk jabatan ini belum dibuat/)).toBeInTheDocument();
  });

  it("panel tanpa anggota: tidak ada select, tampil peringatan", () => {
    renderCmp({ hasPanel: true, anggotaPanel: [] });
    expect(screen.queryByLabelText("Pilih koordinator")).toBeNull();
    expect(screen.getByText(/belum memiliki anggota/)).toBeInTheDocument();
  });
});
