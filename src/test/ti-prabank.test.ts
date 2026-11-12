import { describe, it, expect } from "vitest";
import { ApiError } from "@/lib/api/errors";
import {
  BATAS_CERITA,
  PESAN_PAPARAN_BELUM_TERCATAT,
  perluCeritaBebas,
  petakanPaparanBelumTercatat,
  validasiCerita,
} from "@/lib/ti-prabank";

describe("perluCeritaBebas", () => {
  it("hanya true bila saklar hidup dan BELUM_TERPAPAR", () => {
    expect(perluCeritaBebas(true, "BELUM_TERPAPAR")).toBe(true);
    expect(perluCeritaBebas(false, "BELUM_TERPAPAR")).toBe(false);
    expect(perluCeritaBebas(true, "LOCKED_PRE_EXPOSURE")).toBe(false);
    expect(perluCeritaBebas(true, "EXPOSED")).toBe(false);
  });
});

describe("validasiCerita", () => {
  it("menolak kosong/spasi dan terlalu panjang; menerima yang sah", () => {
    expect(validasiCerita("")).not.toBeNull();
    expect(validasiCerita("   \n")).not.toBeNull();
    expect(validasiCerita("a".repeat(BATAS_CERITA + 1))).not.toBeNull();
    expect(validasiCerita("a".repeat(BATAS_CERITA))).toBeNull();
    expect(validasiCerita("Saya mengajar.")).toBeNull();
  });
});

describe("petakanPaparanBelumTercatat", () => {
  it("409 PAPARAN_BELUM_TERCATAT -> pesan muat ulang, requestId dan status dipertahankan", () => {
    const err = new ApiError({ code: "PAPARAN_BELUM_TERCATAT", message: "x" }, "req-9", 409);
    const hasil = petakanPaparanBelumTercatat(err) as ApiError;
    expect(hasil.message).toBe(PESAN_PAPARAN_BELUM_TERCATAT);
    expect(hasil.message).toMatch(/Muat ulang/);
    expect(hasil.requestId).toBe("req-9");
    expect(hasil.status).toBe(409);
  });

  it("kode lain dan non-ApiError dibiarkan apa adanya", () => {
    const lain = new ApiError({ code: "conflict", message: "y" }, null, 409);
    expect(petakanPaparanBelumTercatat(lain)).toBe(lain);
    const biasa = new Error("z");
    expect(petakanPaparanBelumTercatat(biasa)).toBe(biasa);
  });
});
