import { describe, expect, it } from "vitest";
import { schema as dcsEditSchema } from "@/app/(auth)/dcs/edit-instrumen";
import { schema as wcpEditSchema } from "@/app/(auth)/wcp/edit-instrumen";

const VALID = { min_responden: 6 };

describe("DcsEditInstrumenSchema", () => {
  it("menerima payload valid", () => {
    expect(dcsEditSchema.safeParse(VALID).success).toBe(true);
  });

  it("menolak min_responden < 1", () => {
    expect(dcsEditSchema.safeParse({ min_responden: 0 }).success).toBe(false);
  });

  it("menolak min_responden bukan angka", () => {
    expect(dcsEditSchema.safeParse({ min_responden: "abc" }).success).toBe(false);
  });

  it("menerima catatan opsional", () => {
    expect(dcsEditSchema.safeParse({ ...VALID, catatan: "Catatan instrumen" }).success).toBe(true);
    expect(dcsEditSchema.safeParse({ ...VALID, catatan: undefined }).success).toBe(true);
  });

  it("menolak catatan > 500 karakter", () => {
    expect(dcsEditSchema.safeParse({ ...VALID, catatan: "a".repeat(501) }).success).toBe(false);
  });
});

describe("WcpEditInstrumenSchema", () => {
  it("menerima payload valid", () => {
    expect(wcpEditSchema.safeParse(VALID).success).toBe(true);
  });

  it("menolak min_responden < 1", () => {
    expect(wcpEditSchema.safeParse({ min_responden: 0 }).success).toBe(false);
  });

  it("menerima catatan opsional", () => {
    expect(wcpEditSchema.safeParse({ ...VALID, catatan: "Catatan WCP" }).success).toBe(true);
  });

  it("menolak catatan > 500 karakter", () => {
    expect(wcpEditSchema.safeParse({ ...VALID, catatan: "b".repeat(501) }).success).toBe(false);
  });
});
