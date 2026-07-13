import { describe, expect, it } from "vitest";
import { STATUS_LABEL } from "@/lib/format/ti-status";

describe("STATUS_LABEL — halaman daftar Task Inventory", () => {
  it("memetakan keenam status ke label yang benar", () => {
    expect(STATUS_LABEL.DRAFT.label).toBe("Draft");
    expect(STATUS_LABEL.TAHAP1.label).toBe("Tahap 1 — Seleksi");
    expect(STATUS_LABEL.TAHAP2.label).toBe("Tahap 2 — Review Koordinator");
    expect(STATUS_LABEL.TAHAP3.label).toBe("Tahap 3 — Detailing");
    expect(STATUS_LABEL.CLOSED.label).toBe("Tertutup");
    expect(STATUS_LABEL.ANALYZED.label).toBe("Teranalisis");
  });

  it("TAHAP2 tidak lagi dilabeli 'Detailing' (itu milik TAHAP3)", () => {
    expect(STATUS_LABEL.TAHAP2.label).not.toContain("Detailing");
  });

  it("setiap status valid punya kelas warna berbeda dari status lain", () => {
    const classes = Object.values(STATUS_LABEL).map((s) => s.cls);
    expect(new Set(classes).size).toBe(classes.length);
  });
});
