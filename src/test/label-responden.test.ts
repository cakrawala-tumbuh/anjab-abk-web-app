import { describe, it, expect } from "vitest";
import { labelResponden } from "@/lib/format/label-responden";

describe("labelResponden", () => {
  it("memakai kode_orang apa adanya", () => {
    expect(labelResponden({ kode_orang: "O-0001", id: "wrsp_a1b2c3d4" })).toBe("O-0001");
  });

  it("responden eksternal (kode_orang null) tampil 'Responden eksternal' + 8 karakter id", () => {
    expect(labelResponden({ kode_orang: null, id: "tirs_ab12cd34ef" })).toBe(
      "Responden eksternal tirs_ab1",
    );
  });

  it("kode_orang tidak diisi (undefined) diperlakukan sama dengan null", () => {
    expect(labelResponden({ id: "tirs_ab12cd34ef" })).toBe("Responden eksternal tirs_ab1");
  });

  it("negatif: properti nama lama pada fixture tidak ikut dipakai", () => {
    const lama = { id: "wrsp_a1b2c3d4", kode_orang: "O-0002", nama: "Budi Santoso" };
    expect(labelResponden(lama)).toBe("O-0002");
    expect(labelResponden(lama)).not.toContain("Budi");
  });
});
