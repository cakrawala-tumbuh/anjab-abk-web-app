import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import {
  bacaFilterStatus,
  bodyKasusNegatif,
  galatField422,
  validasiKasusNegatif,
  validasiProtokol,
  validasiStatistik,
} from "@/lib/riset";

describe("bacaFilterStatus", () => {
  it("menerima TERKUNCI dan DRAF", () => {
    expect(bacaFilterStatus({ status: "TERKUNCI" })).toBe("TERKUNCI");
    expect(bacaFilterStatus({ status: ["DRAF", "x"] })).toBe("DRAF");
  });
  it("nilai asing atau kosong menjadi tanpa filter", () => {
    expect(bacaFilterStatus({ status: "LAIN" })).toBeNull();
    expect(bacaFilterStatus({ status: "terkunci" })).toBeNull();
    expect(bacaFilterStatus({})).toBeNull();
  });
});

describe("validasiProtokol", () => {
  it("isian kosong menghasilkan pesan untuk ketiga field", () => {
    const e = validasiProtokol({ kode: " ", judul: "", isi: "  " });
    expect(Object.keys(e).sort()).toEqual(["isi", "judul", "kode"]);
  });
  it("kode berspasi ditolak, kode sah lolos", () => {
    expect(validasiProtokol({ kode: "P 1", judul: "j", isi: "i" }).kode).toBeDefined();
    expect(validasiProtokol({ kode: "P-1.a:b_c", judul: "j", isi: "i" })).toEqual({});
  });
});

describe("validasiStatistik", () => {
  it("ketiga isian wajib", () => {
    const e = validasiStatistik({ nama_analisis: "", keluaran: "", kode_sumber_ref: "" });
    expect(Object.keys(e).sort()).toEqual(["keluaran", "kode_sumber_ref", "nama_analisis"]);
  });
  it("isian lengkap lolos", () => {
    expect(
      validasiStatistik({ nama_analisis: "a", keluaran: "k", kode_sumber_ref: "s@abc" }),
    ).toEqual({});
  });
});

describe("kasus negatif", () => {
  it("sumber_ref kosong sah dan dikirim null", () => {
    const i = { ringkasan: "r", alasan_negatif: "a", sumber_ref: "  " };
    expect(validasiKasusNegatif(i)).toEqual({});
    expect(bodyKasusNegatif(i).sumber_ref).toBeNull();
  });
  it("ringkasan dan alasan wajib", () => {
    const e = validasiKasusNegatif({ ringkasan: "", alasan_negatif: "", sumber_ref: "" });
    expect(Object.keys(e).sort()).toEqual(["alasan_negatif", "ringkasan"]);
  });
});

describe("galatField422", () => {
  it("memetakan loc terakhir yang dikenal", () => {
    const err = new ApiError(
      {
        code: "validation_error",
        message: "m",
        details: [{ loc: ["body", "kode"], msg: "salah" }],
      },
      "r",
      422,
    );
    expect(galatField422(err, ["kode", "judul"] as const)).toEqual({ kode: "salah" });
  });
  it("bukan 422 → kosong", () => {
    const err = new ApiError({ code: "c", message: "m" }, null, 409);
    expect(galatField422(err, ["kode"] as const)).toEqual({});
  });
});
