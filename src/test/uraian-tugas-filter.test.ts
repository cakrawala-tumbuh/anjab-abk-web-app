import { describe, expect, it } from "vitest";
import type { DetilTugasRead, TugasPokokRead } from "@/lib/api/schema";
import {
  bacaFilter,
  domainFilter,
  opsiDetilTugas,
  opsiTugasPokok,
} from "@/lib/uraian-tugas-filter";

function tugasPokok(id: string, jabatanIds: string[]): TugasPokokRead {
  return { id, nama: id, jabatan_ids: jabatanIds, created_at: "" } as TugasPokokRead;
}

function detilTugas(id: string, tugasPokokId: string, jabatanIds: string[]): DetilTugasRead {
  return {
    id,
    nama: id,
    tugas_pokok_id: tugasPokokId,
    jabatan_ids: jabatanIds,
    created_at: "",
  } as DetilTugasRead;
}

describe("bacaFilter", () => {
  it("mengembalikan null untuk key yang tidak ada", () => {
    expect(bacaFilter({})).toEqual({ jabatanId: null, tugasPokokId: null, detilTugasId: null });
  });

  it("mengabaikan nilai kosong sebagai tidak difilter", () => {
    expect(bacaFilter({ jabatan: "", tp: "", dt: "" })).toEqual({
      jabatanId: null,
      tugasPokokId: null,
      detilTugasId: null,
    });
  });

  it("membaca ketiga filter yang terisi", () => {
    expect(bacaFilter({ jabatan: "jbt_1", tp: "tp_1", dt: "dt_1" })).toEqual({
      jabatanId: "jbt_1",
      tugasPokokId: "tp_1",
      detilTugasId: "dt_1",
    });
  });

  it("mengambil elemen pertama bila query berulang", () => {
    expect(bacaFilter({ jabatan: ["jbt_1", "jbt_2"] })).toEqual({
      jabatanId: "jbt_1",
      tugasPokokId: null,
      detilTugasId: null,
    });
  });
});

describe("domainFilter", () => {
  it("tanpa filter → domain kosong", () => {
    expect(domainFilter({ jabatanId: null, tugasPokokId: null, detilTugasId: null })).toEqual([]);
  });

  it("satu filter → satu kondisi", () => {
    expect(domainFilter({ jabatanId: "jbt_1", tugasPokokId: null, detilTugasId: null })).toEqual([
      ["jabatan_id", "=", "jbt_1"],
    ]);
  });

  it("ketiga filter terisi → tiga kondisi", () => {
    expect(
      domainFilter({ jabatanId: "jbt_1", tugasPokokId: "tp_1", detilTugasId: "dt_1" }),
    ).toEqual([
      ["jabatan_id", "=", "jbt_1"],
      ["tugas_pokok_id", "=", "tp_1"],
      ["detil_tugas_id", "=", "dt_1"],
    ]);
  });
});

describe("opsiTugasPokok", () => {
  const daftar = [tugasPokok("tp_1", ["jbt_1"]), tugasPokok("tp_2", ["jbt_2"])];

  it("jabatan null → seluruh daftar dikembalikan apa adanya", () => {
    expect(opsiTugasPokok(daftar, null)).toEqual(daftar);
  });

  it("menyaring sesuai jabatan_ids", () => {
    expect(opsiTugasPokok(daftar, "jbt_1")).toEqual([tugasPokok("tp_1", ["jbt_1"])]);
  });
});

describe("opsiDetilTugas", () => {
  const daftar = [
    detilTugas("dt_1", "tp_1", ["jbt_1"]),
    detilTugas("dt_2", "tp_1", ["jbt_2"]),
    detilTugas("dt_3", "tp_2", ["jbt_1"]),
  ];

  it("keduanya null → seluruh daftar dikembalikan apa adanya", () => {
    expect(opsiDetilTugas(daftar, null, null)).toEqual(daftar);
  });

  it("menyaring sesuai tugas_pokok_id saja", () => {
    expect(opsiDetilTugas(daftar, null, "tp_1")).toEqual([
      detilTugas("dt_1", "tp_1", ["jbt_1"]),
      detilTugas("dt_2", "tp_1", ["jbt_2"]),
    ]);
  });

  it("menyaring sesuai jabatan_ids saja", () => {
    expect(opsiDetilTugas(daftar, "jbt_1", null)).toEqual([
      detilTugas("dt_1", "tp_1", ["jbt_1"]),
      detilTugas("dt_3", "tp_2", ["jbt_1"]),
    ]);
  });

  it("menyaring keduanya sekaligus (AND)", () => {
    expect(opsiDetilTugas(daftar, "jbt_1", "tp_1")).toEqual([
      detilTugas("dt_1", "tp_1", ["jbt_1"]),
    ]);
  });
});
