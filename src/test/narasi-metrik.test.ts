import { describe, expect, it } from "vitest";
import {
  bacaFilterMetrik,
  formatMenit,
  formatPersen,
  queryFilterMetrik,
  rentangBawaan,
  TEKS_BELUM_ADA_DATA,
  uraiTanggal,
  validasiRentang,
} from "@/lib/narasi-metrik";

describe("formatPersen", () => {
  it("memformat rasio sebagai persen satu desimal berkoma", () => {
    expect(formatPersen(0.3333)).toBe("33,3%");
    expect(formatPersen(1)).toBe("100,0%");
  });
  it("0 tetap 0,0% (penyebut ada)", () => {
    expect(formatPersen(0)).toBe("0,0%");
  });
  it("null/undefined menjadi Belum ada data, bukan 0%", () => {
    expect(formatPersen(null)).toBe("Belum ada data");
    expect(formatPersen(undefined)).toBe(TEKS_BELUM_ADA_DATA);
  });
});

describe("formatMenit", () => {
  it("bilangan bulat berpemisah ribuan, pecahan satu desimal, null belum ada data", () => {
    expect(formatMenit(0)).toBe("0 menit");
    expect(formatMenit(1234)).toBe("1.234 menit");
    expect(formatMenit(2.5)).toBe("2,5 menit");
    expect(formatMenit(null)).toBe("Belum ada data");
  });
});

describe("validasiRentang", () => {
  it("menerima rentang sah termasuk tepat 366 hari inklusif", () => {
    expect(validasiRentang("2026-11-01", "2026-11-30")).toBeNull();
    expect(validasiRentang("2026-11-12", "2026-11-12")).toBeNull();
    expect(validasiRentang("2025-11-12", "2026-11-12")).toBeNull(); // 366 hari inklusif
  });
  it("menolak dari > sampai", () => {
    expect(validasiRentang("2026-11-30", "2026-11-01")).toMatch(/tidak boleh melewati/);
  });
  it("menolak rentang lebih dari 366 hari", () => {
    expect(validasiRentang("2025-11-11", "2026-11-12")).toMatch(/366 hari/);
  });
  it("menolak tanggal tak sah", () => {
    expect(validasiRentang("", "2026-11-12")).toMatch(/format/);
    expect(validasiRentang("2026-02-30", "2026-03-01")).toMatch(/format/);
    expect(uraiTanggal("2026-13-01")).toBeNull();
  });
});

describe("filter metrik", () => {
  const sekarang = new Date("2026-11-12T10:00:00Z");
  it("rentang bawaan = 30 hari terakhir termasuk hari ini", () => {
    expect(rentangBawaan(sekarang)).toEqual({ dari: "2026-10-14", sampai: "2026-11-12" });
  });
  it("membaca filter dari searchParams dan memakai bawaan bila kosong", () => {
    expect(bacaFilterMetrik({}, sekarang)).toEqual({
      dari: "2026-10-14",
      sampai: "2026-11-12",
      narrative_kind: null,
    });
    expect(
      bacaFilterMetrik(
        { dari: "2026-11-01", sampai: "2026-11-30", narrative_kind: "F1_FORMAL" },
        sekarang,
      ),
    ).toEqual({ dari: "2026-11-01", sampai: "2026-11-30", narrative_kind: "F1_FORMAL" });
  });
  it("jenis narasi tak dikenal dianggap semua", () => {
    expect(bacaFilterMetrik({ narrative_kind: "XYZ" }, sekarang).narrative_kind).toBeNull();
  });
  it("query hanya memuat narrative_kind bila diisi", () => {
    expect(queryFilterMetrik({ dari: "a", sampai: "b", narrative_kind: null })).toBe(
      "dari=a&sampai=b",
    );
    expect(queryFilterMetrik({ dari: "a", sampai: "b", narrative_kind: "F2_ACTUAL" })).toBe(
      "dari=a&sampai=b&narrative_kind=F2_ACTUAL",
    );
  });
});
