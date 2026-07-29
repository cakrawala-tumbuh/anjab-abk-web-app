import { describe, expect, it } from "vitest";
import type { TiTaskTerpilihRead } from "@/lib/api/schema";
import { urutkanTaskTahap3 } from "@/lib/task-inventory-tahap3-urutan";

function task(
  kode: string,
  tugasPokok: string,
  detilTugas: string,
  uraianTugas: string,
): TiTaskTerpilihRead {
  return {
    kode,
    tugas_pokok: tugasPokok,
    detil_tugas: detilTugas,
    uraian_tugas: uraianTugas,
  } as unknown as TiTaskTerpilihRead;
}

describe("urutkanTaskTahap3", () => {
  it("mengurutkan berjenjang: tugas_pokok, lalu detil_tugas, lalu alfabet uraian_tugas", () => {
    const acak = [
      task("TI5", "Kesiswaan", "Pramuka", "Mendampingi upacara"),
      task("TI1", "Kesiswaan", "Ekskul", "Melatih paduan suara"),
      task("TI4", "Kesiswaan", "Pramuka", "Membina regu"),
      task("TI2", "Kurikulum", "RPP", "Menyusun RPP"),
      task("TI3", "Kesiswaan", "Ekskul", "Melatih basket"),
      task("TI6", "Kurikulum", "Penilaian", "Membuat soal ujian"),
    ];

    const hasil = urutkanTaskTahap3(acak);

    expect(hasil.map((t) => t.kode)).toEqual(["TI3", "TI1", "TI4", "TI5", "TI6", "TI2"]);
  });

  it("task ber-detil_tugas kosong ('') mendahului yang terisi dalam tugas pokok yang sama", () => {
    const tasks = [
      task("TI2", "Kesiswaan", "Pramuka", "Membina pramuka"),
      task("TI1", "Kesiswaan", "", "Tugas langsung di bawah tugas pokok"),
    ];

    const hasil = urutkanTaskTahap3(tasks);

    expect(hasil.map((t) => t.kode)).toEqual(["TI1", "TI2"]);
  });

  it("dua task dengan tugas_pokok/detil_tugas/uraian_tugas identik terurut menurut kode sebagai pemutus", () => {
    const tasks = [
      task("TIz", "Kesiswaan", "Pramuka", "Mendampingi kegiatan"),
      task("TIa", "Kesiswaan", "Pramuka", "Mendampingi kegiatan"),
    ];

    const hasil = urutkanTaskTahap3(tasks);

    expect(hasil.map((t) => t.kode)).toEqual(["TIa", "TIz"]);
  });

  it("tidak memutasi array masukan", () => {
    const asli = [
      task("TI2", "Kesiswaan", "Pramuka", "B"),
      task("TI1", "Kesiswaan", "Pramuka", "A"),
    ];
    const salinanUrutanAsli = [...asli];

    urutkanTaskTahap3(asli);

    expect(asli).toEqual(salinanUrutanAsli);
  });

  it("array kosong menghasilkan array kosong", () => {
    expect(urutkanTaskTahap3([])).toEqual([]);
  });
});
