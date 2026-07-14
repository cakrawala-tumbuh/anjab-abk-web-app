import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PartisipanRead, JabatanRead } from "@/lib/api/schema";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post }),
}));

import { AssignResponden } from "@/app/(auth)/wcp/assign-responden";

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

const jabatan = [{ id: "jbt_1", nama: "Guru Kelas" } as unknown as JabatanRead];
const partisipan = [par("par_a", "Agustinus"), par("par_b", "Susana"), par("par_c", "Budi")];

beforeEach(() => {
  refresh.mockReset();
  post.mockReset();
});

describe("AssignResponden (WCP)", () => {
  it("submit created saja → panel menampilkan jumlah, tanpa daftar skip", async () => {
    post.mockResolvedValue({
      data: {
        created: [
          {
            id: "wrsp-1",
            jabatan_label: "Guru Kelas",
            partisipan_id: "par_a",
            sudah_submit: false,
          },
          {
            id: "wrsp-2",
            jabatan_label: "Guru Kelas",
            partisipan_id: "par_b",
            sudah_submit: false,
          },
          {
            id: "wrsp-3",
            jabatan_label: "Guru Kelas",
            partisipan_id: "par_c",
            sudah_submit: false,
          },
        ],
        skipped: [],
      },
      error: null,
      response: { headers: { get: () => "req-1" } },
    });
    render(<AssignResponden partisipan={partisipan} jabatan={jabatan} accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Pilih semua" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tugaskan Terpilih/ }));
    });
    expect(await screen.findByText("3 responden berhasil ditambahkan.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("submit created+skipped → menampilkan kedua bagian, alasan lewat formatAlasanSkip", async () => {
    post.mockResolvedValue({
      data: {
        created: [
          {
            id: "wrsp-1",
            jabatan_label: "Guru Kelas",
            partisipan_id: "par_a",
            sudah_submit: false,
          },
        ],
        skipped: [
          { partisipan_id: "par_b", alasan: "sudah_terdaftar" },
          { partisipan_id: "par_c", alasan: "kapasitas_penuh" },
        ],
      },
      error: null,
      response: { headers: { get: () => "req-1" } },
    });
    render(<AssignResponden partisipan={partisipan} jabatan={jabatan} accessToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: "Pilih semua" }));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tugaskan Terpilih/ }));
    });
    expect(await screen.findByText("1 responden berhasil ditambahkan.")).toBeInTheDocument();
    expect(screen.getByText(/Susana.*Sudah terdaftar/)).toBeInTheDocument();
    expect(screen.getByText(/Budi.*Kapasitas sesi penuh/)).toBeInTheDocument();
  });

  it("semua di-skip (0 dibuat) → tidak terlihat seperti sukses", async () => {
    post.mockResolvedValue({
      data: {
        created: [],
        skipped: [
          { partisipan_id: "par_a", alasan: "duplikat_input" },
          { partisipan_id: "par_b", alasan: "bukan_anggota_sme_panel" },
        ],
      },
      error: null,
      response: { headers: { get: () => "req-1" } },
    });
    render(<AssignResponden partisipan={partisipan} jabatan={jabatan} accessToken="tok" />);
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tugaskan Terpilih/ }));
    });
    expect(await screen.findByText("0 responden berhasil ditambahkan.")).toBeInTheDocument();
    expect(screen.getByText(/Duplikat dalam input/)).toBeInTheDocument();
    expect(screen.getByText(/Bukan anggota SME panel/)).toBeInTheDocument();
  });

  it("checkbox partisipan yang di-skip tetap tercentang setelah submit", async () => {
    post.mockResolvedValue({
      data: {
        created: [
          {
            id: "wrsp-1",
            jabatan_label: "Guru Kelas",
            partisipan_id: "par_a",
            sudah_submit: false,
          },
        ],
        skipped: [{ partisipan_id: "par_b", alasan: "sudah_terdaftar" }],
      },
      error: null,
      response: { headers: { get: () => "req-1" } },
    });
    render(<AssignResponden partisipan={partisipan} jabatan={jabatan} accessToken="tok" />);
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // par_a → created
    fireEvent.click(checkboxes[1]); // par_b → skipped
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tugaskan Terpilih/ }));
    });
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("1 responden berhasil ditambahkan.")).toBeInTheDocument();
    const checkboxesAfter = screen.getAllByRole("checkbox");
    expect(checkboxesAfter[0]).not.toBeChecked(); // par_a: berhasil dibuat → uncheck
    expect(checkboxesAfter[1]).toBeChecked(); // par_b: di-skip → tetap tercentang
  });
});
