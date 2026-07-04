import { describe, expect, it } from "vitest";
import { schema as tsPenugasanSchema } from "@/app/(auth)/time-study/buat/ts-penugasan-form";

const VALID = {
  partisipan_id: "par_a1b2c3d4",
};

describe("TsPenugasanSchema", () => {
  it("menerima payload valid", () => {
    expect(tsPenugasanSchema.safeParse(VALID).success).toBe(true);
  });

  it("menolak partisipan_id kosong", () => {
    expect(tsPenugasanSchema.safeParse({ ...VALID, partisipan_id: "" }).success).toBe(false);
  });

  it("menolak partisipan_id hilang", () => {
    expect(tsPenugasanSchema.safeParse({}).success).toBe(false);
  });

  it("menerima catatan opsional", () => {
    expect(tsPenugasanSchema.safeParse({ ...VALID, catatan: "Sedang cuti" }).success).toBe(true);
    expect(tsPenugasanSchema.safeParse({ ...VALID, catatan: undefined }).success).toBe(true);
  });

  it("menolak catatan > 500 karakter", () => {
    expect(tsPenugasanSchema.safeParse({ ...VALID, catatan: "a".repeat(501) }).success).toBe(false);
  });
});
