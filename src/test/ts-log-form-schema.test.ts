import { describe, expect, it } from "vitest";
import { schema as tsLogSchema } from "@/app/(auth)/time-study/isi/[penugasan_id]/tambah/ts-log-form";

const VALID = {
  tanggal: "2025-06-01",
  waktu_masuk: "07:30",
  waktu_keluar: "16:00",
  day_color: "GREEN",
  jam_core: 3,
  menit_core: 30,
};

describe("TsLogSchema", () => {
  it("menerima payload valid", () => {
    expect(tsLogSchema.safeParse(VALID).success).toBe(true);
  });

  it("menolak tanggal kosong", () => {
    expect(tsLogSchema.safeParse({ ...VALID, tanggal: "" }).success).toBe(false);
  });

  it("menolak format waktu yang salah", () => {
    const cases = ["7:30", "07:3", "0730", "07-30"];
    for (const waktu of cases) {
      const result = tsLogSchema.safeParse({ ...VALID, waktu_masuk: waktu });
      expect(result.success, `waktu_masuk "${waktu}" seharusnya ditolak`).toBe(false);
    }
  });

  it("menolak day_color di luar enum", () => {
    expect(tsLogSchema.safeParse({ ...VALID, day_color: "BLUE" }).success).toBe(false);
  });

  it("menolak jam di luar rentang 0-23", () => {
    expect(tsLogSchema.safeParse({ ...VALID, jam_core: 24 }).success).toBe(false);
    expect(tsLogSchema.safeParse({ ...VALID, jam_core: -1 }).success).toBe(false);
  });

  it("menolak menit di luar rentang 0-59", () => {
    expect(tsLogSchema.safeParse({ ...VALID, menit_core: 60 }).success).toBe(false);
  });

  it("menerima catatan opsional", () => {
    expect(tsLogSchema.safeParse({ ...VALID, catatan: "Hari sibuk" }).success).toBe(true);
  });

  it("menolak catatan > 500 karakter", () => {
    expect(tsLogSchema.safeParse({ ...VALID, catatan: "a".repeat(501) }).success).toBe(false);
  });
});
