import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DetilTugasRead, JabatanRead, TugasPokokRead } from "@/lib/api/schema";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

import { FilterUraianTugas } from "@/app/(auth)/master-data/uraian-tugas/filter-uraian-tugas";

const jabatan = [
  { id: "jbt_1", nama: "Guru Kelas" },
  { id: "jbt_2", nama: "Kepala Sekolah" },
] as unknown as JabatanRead[];

const tugasPokok = [
  { id: "tp_1", nama: "Pengajaran", jabatan_ids: ["jbt_1"] },
  { id: "tp_2", nama: "Manajemen", jabatan_ids: ["jbt_2"] },
] as unknown as TugasPokokRead[];

const detilTugas = [
  { id: "dt_1", nama: "Menyusun RPP", tugas_pokok_id: "tp_1", jabatan_ids: ["jbt_1"] },
  { id: "dt_2", nama: "Rapat Anggaran", tugas_pokok_id: "tp_2", jabatan_ids: ["jbt_2"] },
] as unknown as DetilTugasRead[];

beforeEach(() => {
  push.mockReset();
});

describe("FilterUraianTugas", () => {
  it("mengubah select jabatan → push ke URL ber-jabatan tanpa tp/dt/hlm", () => {
    render(
      <FilterUraianTugas
        jabatan={jabatan}
        tugasPokok={tugasPokok}
        detilTugas={detilTugas}
        filter={{ jabatanId: null, tugasPokokId: null, detilTugasId: null }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Jabatan"), { target: { value: "jbt_1" } });

    expect(push).toHaveBeenCalledWith("/master-data/uraian-tugas?jabatan=jbt_1");
  });

  it("mengubah tugas pokok mempertahankan jabatan tapi membuang dt", () => {
    render(
      <FilterUraianTugas
        jabatan={jabatan}
        tugasPokok={tugasPokok}
        detilTugas={detilTugas}
        filter={{ jabatanId: "jbt_1", tugasPokokId: null, detilTugasId: "dt_1" }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Tugas Pokok"), { target: { value: "tp_1" } });

    expect(push).toHaveBeenCalledWith("/master-data/uraian-tugas?jabatan=jbt_1&tp=tp_1");
  });

  it("dropdown tugas pokok & detil tugas menyempit sesuai jabatan terpilih", () => {
    render(
      <FilterUraianTugas
        jabatan={jabatan}
        tugasPokok={tugasPokok}
        detilTugas={detilTugas}
        filter={{ jabatanId: "jbt_1", tugasPokokId: null, detilTugasId: null }}
      />,
    );

    const opsiTp = screen.getByLabelText("Tugas Pokok") as HTMLSelectElement;
    expect(Array.from(opsiTp.options).map((o) => o.value)).toEqual(["", "tp_1"]);

    const opsiDt = screen.getByLabelText("Detil Tugas") as HTMLSelectElement;
    expect(Array.from(opsiDt.options).map((o) => o.value)).toEqual(["", "dt_1"]);
  });

  it("tautan Hapus filter hanya muncul saat ada filter aktif", () => {
    const { rerender } = render(
      <FilterUraianTugas
        jabatan={jabatan}
        tugasPokok={tugasPokok}
        detilTugas={detilTugas}
        filter={{ jabatanId: null, tugasPokokId: null, detilTugasId: null }}
      />,
    );
    expect(screen.queryByText("Hapus filter")).not.toBeInTheDocument();

    rerender(
      <FilterUraianTugas
        jabatan={jabatan}
        tugasPokok={tugasPokok}
        detilTugas={detilTugas}
        filter={{ jabatanId: "jbt_1", tugasPokokId: null, detilTugasId: null }}
      />,
    );
    fireEvent.click(screen.getByText("Hapus filter"));
    expect(push).toHaveBeenCalledWith("/master-data/uraian-tugas");
  });
});
