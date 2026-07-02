import { describe, expect, it } from "vitest";
import { schema as opmSesiSchema } from "@/app/(auth)/opm/buat/opm-sesi-form";

const VALID_OPM = {
  jabatan_id: "jbt_a1b2c3d4",
  ti_sesi_id: "tises_a1b2c3d4",
  periode: "2026-06",
  min_responden: 3,
  max_responden: 10,
};

describe("OpmSesiSchema", () => {
  it("menerima payload valid", () => {
    expect(opmSesiSchema.safeParse(VALID_OPM).success).toBe(true);
  });

  it("menolak format periode yang salah", () => {
    const cases = ["2025-6", "25-06", "2025/06", "202506", "2025-1"];
    for (const periode of cases) {
      const result = opmSesiSchema.safeParse({ ...VALID_OPM, periode });
      expect(result.success, `periode "${periode}" seharusnya ditolak`).toBe(false);
    }
  });

  it("menerima periode format YYYY-MM yang valid", () => {
    expect(opmSesiSchema.safeParse({ ...VALID_OPM, periode: "2024-01" }).success).toBe(true);
    expect(opmSesiSchema.safeParse({ ...VALID_OPM, periode: "2030-12" }).success).toBe(true);
  });

  it("menolak jabatan_id kosong", () => {
    expect(opmSesiSchema.safeParse({ ...VALID_OPM, jabatan_id: "" }).success).toBe(false);
  });

  it("menolak ti_sesi_id kosong", () => {
    expect(opmSesiSchema.safeParse({ ...VALID_OPM, ti_sesi_id: "" }).success).toBe(false);
  });

  it("menolak min_responden > max_responden", () => {
    const result = opmSesiSchema.safeParse({
      ...VALID_OPM,
      min_responden: 10,
      max_responden: 5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("max_responden");
    }
  });

  it("menerima min_responden == max_responden", () => {
    expect(
      opmSesiSchema.safeParse({ ...VALID_OPM, min_responden: 5, max_responden: 5 }).success,
    ).toBe(true);
  });

  it("menolak min_responden < 1", () => {
    expect(opmSesiSchema.safeParse({ ...VALID_OPM, min_responden: 0 }).success).toBe(false);
  });

  it("menerima catatan opsional", () => {
    expect(opmSesiSchema.safeParse({ ...VALID_OPM, catatan: "Catatan sesi OPM" }).success).toBe(
      true,
    );
    expect(opmSesiSchema.safeParse({ ...VALID_OPM, catatan: undefined }).success).toBe(true);
  });

  it("menolak catatan > 500 karakter", () => {
    expect(opmSesiSchema.safeParse({ ...VALID_OPM, catatan: "a".repeat(501) }).success).toBe(false);
  });
});
