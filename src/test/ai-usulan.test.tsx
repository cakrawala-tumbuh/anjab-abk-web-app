import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IsiUsulan } from "@/components/isi-usulan";
import {
  ISIAN_PUTUSAN_KOSONG,
  bacaFilterUsulan,
  bodyPutusan,
  domainUsulan,
  hrefSasaran,
  labelFungsi,
  labelHasilSerap,
  labelSasaran,
  validasiPutusan,
  type IsianPutusan,
} from "@/lib/ai-usulan";

const isian = (p: Partial<IsianPutusan>): IsianPutusan => ({ ...ISIAN_PUTUSAN_KOSONG, ...p });

describe("IsiUsulan", () => {
  it("merender objek bersarang dan larik (bentuk isi P01)", () => {
    render(
      <IsiUsulan
        nilai={{
          butir: [{ klaim: "Guru mengajar 24 jam", kutipan: ["a", "b"] }],
          ringkasan: "Ringkas",
        }}
      />,
    );
    expect(screen.getByText("butir")).toBeTruthy();
    expect(screen.getByText("Guru mengajar 24 jam")).toBeTruthy();
    expect(screen.getByText("a")).toBeTruthy();
    expect(screen.getByText("b")).toBeTruthy();
    expect(screen.getByText("Ringkas")).toBeTruthy();
  });

  it("merender isi bergaya P09 (kritik) dengan kunci bergaris bawah", () => {
    render(
      <IsiUsulan
        nilai={{ temuan_kritik: [{ jenis: "KLAIM_TANPA_BUKTI", saran: "Tambah sumber" }], skor: 3 }}
      />,
    );
    expect(screen.getByText("temuan kritik")).toBeTruthy();
    expect(screen.getByText("KLAIM_TANPA_BUKTI")).toBeTruthy();
    expect(screen.getByText("Tambah sumber")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("nilai kosong tampil sebagai tanda strip dan tidak melempar", () => {
    render(<IsiUsulan nilai={{ a: null, b: [] }} />);
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});

describe("validasiPutusan", () => {
  it("menerima APPROVE polos, REVISE lengkap, REJECT lengkap", () => {
    expect(validasiPutusan(isian({ putusan: "APPROVE" }))).toEqual({});
    expect(
      validasiPutusan(isian({ putusan: "REVISE", tingkat_koreksi: "MINOR", teks_koreksi: "x" })),
    ).toEqual({});
    expect(
      validasiPutusan(isian({ putusan: "REJECT", tingkat_koreksi: "MAJOR", catatan: "alasan" })),
    ).toEqual({});
  });

  it("menolak REVISE tanpa teks_koreksi", () => {
    const g = validasiPutusan(isian({ putusan: "REVISE", tingkat_koreksi: "MINOR" }));
    expect(g.teks_koreksi).toMatch(/wajib/);
  });

  it("menolak REJECT dengan catatan 4 karakter", () => {
    const g = validasiPutusan(
      isian({ putusan: "REJECT", tingkat_koreksi: "MAJOR", catatan: " abcd " }),
    );
    expect(g.catatan).toMatch(/minimal 5/);
  });

  it("menolak APPROVE dengan tingkat_koreksi", () => {
    const g = validasiPutusan(isian({ putusan: "APPROVE", tingkat_koreksi: "MINOR" }));
    expect(g.tingkat_koreksi).toBeTruthy();
  });

  it("menolak REVISE/REJECT tanpa tingkat_koreksi dan putusan kosong", () => {
    expect(
      validasiPutusan(isian({ putusan: "REVISE", teks_koreksi: "x" })).tingkat_koreksi,
    ).toBeTruthy();
    expect(validasiPutusan(ISIAN_PUTUSAN_KOSONG).putusan).toBeTruthy();
  });

  it("bodyPutusan hanya mengirim field yang relevan", () => {
    expect(bodyPutusan(isian({ putusan: "APPROVE" }))).toEqual({ putusan: "APPROVE" });
    expect(
      bodyPutusan(isian({ putusan: "REJECT", tingkat_koreksi: "MAJOR", catatan: " alasan " })),
    ).toEqual({ putusan: "REJECT", tingkat_koreksi: "MAJOR", catatan: "alasan" });
  });
});

describe("label", () => {
  it("fungsi dan sasaran asing tampil mentah tanpa melempar", () => {
    expect(labelFungsi("P99")).toBe("P99");
    expect(labelSasaran("OBJEK_BARU")).toBe("OBJEK_BARU");
    expect(labelFungsi("P09")).toContain("P09");
    expect(labelHasilSerap(null)).toBe("Belum diserap");
    expect(labelHasilSerap("ASING")).toBe("ASING");
  });

  it("hanya NARASI_KASUS yang ditautkan", () => {
    expect(hrefSasaran("NARASI_KASUS", "k1")).toBe("/narasi/kasus/k1");
    expect(hrefSasaran("NARASI_SUMBER", "s1")).toBeNull();
  });
});

describe("domainUsulan", () => {
  it("merakit domain untuk tiap kombinasi fungsi x sasaran_jenis", () => {
    expect(domainUsulan({ fungsi: null, sasaran_jenis: null })).toEqual([]);
    expect(domainUsulan({ fungsi: "P09", sasaran_jenis: null })).toEqual([["fungsi", "=", "P09"]]);
    expect(domainUsulan({ fungsi: null, sasaran_jenis: "NARASI_KASUS" })).toEqual([
      ["sasaran_jenis", "=", "NARASI_KASUS"],
    ]);
    expect(domainUsulan({ fungsi: "P01", sasaran_jenis: "NARASI_SUMBER" })).toEqual([
      ["fungsi", "=", "P01"],
      ["sasaran_jenis", "=", "NARASI_SUMBER"],
    ]);
  });

  it("tidak pernah memuat field putusan", () => {
    const d = domainUsulan({ fungsi: "P01", sasaran_jenis: "NARASI_KASUS" });
    expect(JSON.stringify(d)).not.toMatch(/putusan/);
  });

  it("bacaFilterUsulan membaca fungsi dan sasaran dari searchParams", () => {
    expect(bacaFilterUsulan({ fungsi: " P09 ", sasaran: "NARASI_KASUS" })).toEqual({
      fungsi: "P09",
      sasaran_jenis: "NARASI_KASUS",
    });
  });
});
