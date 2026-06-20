import { describe, expect, it } from "vitest";
import { schema as dcsSesiSchema } from "@/app/(auth)/dcs/buat/dcs-sesi-form";
import { schema as wcpSesiSchema } from "@/app/(auth)/wcp/buat/wcp-sesi-form";

const VALID_DCS = {
  jabatan_id: "jbt_a1b2c3d4",
  periode: "2025-06",
  min_responden: 6,
  max_responden: 8,
};

const VALID_WCP = {
  jabatan_id: "jbt_a1b2c3d4",
  periode: "2025-06",
  min_responden: 6,
  max_responden: 8,
};

describe("DcsSesiSchema", () => {
  it("menerima payload valid", () => {
    expect(dcsSesiSchema.safeParse(VALID_DCS).success).toBe(true);
  });

  it("menolak jabatan_id kosong", () => {
    const result = dcsSesiSchema.safeParse({ ...VALID_DCS, jabatan_id: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("jabatan_id");
    }
  });

  it("menolak format periode yang salah", () => {
    const cases = ["2025-6", "25-06", "2025/06", "202506", "2025-1"];
    for (const periode of cases) {
      const result = dcsSesiSchema.safeParse({ ...VALID_DCS, periode });
      expect(result.success, `periode "${periode}" seharusnya ditolak`).toBe(false);
    }
  });

  it("menerima periode format YYYY-MM yang valid", () => {
    expect(dcsSesiSchema.safeParse({ ...VALID_DCS, periode: "2024-01" }).success).toBe(true);
    expect(dcsSesiSchema.safeParse({ ...VALID_DCS, periode: "2030-12" }).success).toBe(true);
  });

  it("menolak min_responden > max_responden", () => {
    const result = dcsSesiSchema.safeParse({
      ...VALID_DCS,
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
      dcsSesiSchema.safeParse({ ...VALID_DCS, min_responden: 6, max_responden: 6 }).success,
    ).toBe(true);
  });

  it("menolak min_responden < 1", () => {
    expect(dcsSesiSchema.safeParse({ ...VALID_DCS, min_responden: 0 }).success).toBe(false);
  });

  it("menerima catatan opsional", () => {
    expect(
      dcsSesiSchema.safeParse({ ...VALID_DCS, catatan: "Catatan sesi" }).success,
    ).toBe(true);
    expect(dcsSesiSchema.safeParse({ ...VALID_DCS, catatan: undefined }).success).toBe(true);
  });

  it("menolak catatan > 500 karakter", () => {
    expect(
      dcsSesiSchema.safeParse({ ...VALID_DCS, catatan: "a".repeat(501) }).success,
    ).toBe(false);
  });
});

describe("WcpSesiSchema", () => {
  it("menerima payload valid", () => {
    expect(wcpSesiSchema.safeParse(VALID_WCP).success).toBe(true);
  });

  it("menolak jabatan_id kosong", () => {
    const result = wcpSesiSchema.safeParse({ ...VALID_WCP, jabatan_id: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("jabatan_id");
    }
  });

  it("menolak format periode yang salah", () => {
    const cases = ["2025-6", "25-06", "2025/06", "202506"];
    for (const periode of cases) {
      const result = wcpSesiSchema.safeParse({ ...VALID_WCP, periode });
      expect(result.success, `periode "${periode}" seharusnya ditolak`).toBe(false);
    }
  });

  it("menolak min_responden > max_responden", () => {
    const result = wcpSesiSchema.safeParse({
      ...VALID_WCP,
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
      wcpSesiSchema.safeParse({ ...VALID_WCP, min_responden: 8, max_responden: 8 }).success,
    ).toBe(true);
  });

  it("menolak min_responden < 1", () => {
    expect(wcpSesiSchema.safeParse({ ...VALID_WCP, min_responden: 0 }).success).toBe(false);
  });

  it("menerima catatan opsional", () => {
    expect(
      wcpSesiSchema.safeParse({ ...VALID_WCP, catatan: "Catatan WCP" }).success,
    ).toBe(true);
    expect(wcpSesiSchema.safeParse({ ...VALID_WCP, catatan: undefined }).success).toBe(true);
  });

  it("menolak catatan > 500 karakter", () => {
    expect(
      wcpSesiSchema.safeParse({ ...VALID_WCP, catatan: "b".repeat(501) }).success,
    ).toBe(false);
  });
});
