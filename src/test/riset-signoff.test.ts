import { describe, it, expect } from "vitest";
import { ApiError } from "@/lib/api/errors";
import {
  BATAS_BERKAS_BYTE,
  alasanNonaktifP08,
  formSignoff,
  formatUkuran,
  galatFieldSignoff,
  pathUnduhSignoff,
  pesanGalatSignoff,
  tanggalLokal,
  validasiSignoff,
  type IsianSignoff,
} from "@/lib/riset-signoff";

const HARI_INI = "2026-11-13";
const sah = (o: Partial<IsianSignoff> = {}): IsianSignoff => ({
  pi_nama: "Dr. Ayu",
  tanggal_persetujuan_etik: "2026-11-01",
  nomor_persetujuan_etik: "KEPK/12/2026",
  berkas: { name: "etik.pdf", type: "application/pdf", size: 1000 },
  ...o,
});
const galat = (code: string, status: number, details: unknown[] = []) =>
  new ApiError({ code, message: `pesan ${code}`, details }, "r1", status);

describe("validasiSignoff", () => {
  it("kasus sah lolos", () => {
    expect(validasiSignoff(sah(), HARI_INI)).toEqual({});
  });

  it("tanggal hari ini lolos, besok ditolak", () => {
    expect(validasiSignoff(sah({ tanggal_persetujuan_etik: HARI_INI }), HARI_INI)).toEqual({});
    expect(
      validasiSignoff(sah({ tanggal_persetujuan_etik: "2026-11-14" }), HARI_INI)
        .tanggal_persetujuan_etik,
    ).toMatch(/masa depan/);
  });

  it("tanggal kosong atau tak sah ditolak", () => {
    expect(
      validasiSignoff(sah({ tanggal_persetujuan_etik: "" }), HARI_INI).tanggal_persetujuan_etik,
    ).toMatch(/wajib/);
    expect(
      validasiSignoff(sah({ tanggal_persetujuan_etik: "2026-13-45" }), HARI_INI)
        .tanggal_persetujuan_etik,
    ).toMatch(/tidak sah/);
  });

  it("nama PI kosong atau hanya spasi ditolak; terlalu panjang ditolak", () => {
    expect(validasiSignoff(sah({ pi_nama: "   " }), HARI_INI).pi_nama).toMatch(/wajib/);
    expect(validasiSignoff(sah({ pi_nama: "x".repeat(201) }), HARI_INI).pi_nama).toMatch(/200/);
  });

  it("nomor opsional, tetapi dibatasi 100 karakter", () => {
    expect(validasiSignoff(sah({ nomor_persetujuan_etik: "" }), HARI_INI)).toEqual({});
    expect(
      validasiSignoff(sah({ nomor_persetujuan_etik: "n".repeat(101) }), HARI_INI)
        .nomor_persetujuan_etik,
    ).toMatch(/100/);
  });

  it("berkas: wajib, harus PDF, tidak kosong, maksimal 5 MiB", () => {
    expect(validasiSignoff(sah({ berkas: null }), HARI_INI).lampiran).toMatch(/wajib/);
    expect(
      validasiSignoff(sah({ berkas: { name: "a.png", type: "image/png", size: 10 } }), HARI_INI)
        .lampiran,
    ).toMatch(/PDF/);
    expect(
      validasiSignoff(
        sah({ berkas: { name: "a.pdf", type: "application/pdf", size: 0 } }),
        HARI_INI,
      ).lampiran,
    ).toMatch(/kosong/);
    expect(
      validasiSignoff(
        sah({ berkas: { name: "a.pdf", type: "application/pdf", size: BATAS_BERKAS_BYTE + 1 } }),
        HARI_INI,
      ).lampiran,
    ).toMatch(/5 MiB/);
    // tepat 5 MiB masih sah
    expect(
      validasiSignoff(
        sah({ berkas: { name: "a.pdf", type: "application/pdf", size: BATAS_BERKAS_BYTE } }),
        HARI_INI,
      ),
    ).toEqual({});
  });

  it("MIME kosong: ekstensi .pdf diterima, selain itu ditolak", () => {
    expect(
      validasiSignoff(sah({ berkas: { name: "etik.PDF", type: "", size: 5 } }), HARI_INI),
    ).toEqual({});
    expect(
      validasiSignoff(sah({ berkas: { name: "etik.docx", type: "", size: 5 } }), HARI_INI).lampiran,
    ).toMatch(/PDF/);
  });
});

describe("formSignoff", () => {
  it("memuat field wajib dan berkas; nomor kosong tidak dikirim", () => {
    const f = new File(["%PDF-1"], "etik.pdf", { type: "application/pdf" });
    const fd = formSignoff(sah({ pi_nama: "  Dr. Ayu ", nomor_persetujuan_etik: " " }), f);
    expect(fd.get("pi_nama")).toBe("Dr. Ayu");
    expect(fd.get("tanggal_persetujuan_etik")).toBe("2026-11-01");
    expect(fd.has("nomor_persetujuan_etik")).toBe(false);
    expect((fd.get("lampiran") as File).name).toBe("etik.pdf");
    expect(formSignoff(sah(), f).get("nomor_persetujuan_etik")).toBe("KEPK/12/2026");
  });
});

describe("pesanGalatSignoff / galatFieldSignoff", () => {
  it.each([
    ["SIGNOFF_SUDAH_ADA", 409, /sudah punya sign-off/],
    ["PROTOKOL_BELUM_TERKUNCI", 409, /Kunci protokol dulu/],
    ["LAMPIRAN_BUKAN_PDF", 422, /bukan PDF/],
    ["LAMPIRAN_TERLALU_BESAR", 422, /5 MiB/],
    ["payload_too_large", 413, /5 MiB/],
  ])("%s (%i) -> pesan Indonesia spesifik", (kode, status, pola) => {
    expect(pesanGalatSignoff(galat(kode, status))).toMatch(pola);
  });

  it("kode lain memakai pesan backend apa adanya", () => {
    expect(pesanGalatSignoff(galat("forbidden", 403))).toBe("pesan forbidden");
  });

  it("422 validasi form dipetakan ke field", () => {
    const e = galat("validation_error", 422, [
      { loc: ["body", "tanggal_persetujuan_etik"], msg: "Tanggal di masa depan" },
    ]);
    expect(galatFieldSignoff(e)).toEqual({ tanggal_persetujuan_etik: "Tanggal di masa depan" });
  });
});

describe("pembantu lain", () => {
  it("alasanNonaktifP08", () => {
    expect(alasanNonaktifP08(true, 1)).toBeUndefined();
    expect(alasanNonaktifP08(false, 1)).toMatch(/Butuh sign-off PI\/etik/);
    expect(alasanNonaktifP08(true, 0)).toBe("Butuh minimal satu statistik terverifikasi.");
    expect(alasanNonaktifP08(false, 0)).toMatch(/sign-off.*statistik/);
  });

  it("formatUkuran dan tanggalLokal dan pathUnduhSignoff", () => {
    expect(formatUkuran(512)).toBe("512 B");
    expect(formatUkuran(2048)).toBe("2 KiB");
    expect(formatUkuran(5 * 1024 * 1024)).toBe("5 MiB");
    expect(tanggalLokal(new Date(2026, 10, 3))).toBe("2026-11-03");
    expect(pathUnduhSignoff("a/b")).toBe("/api/riset/protokol/a%2Fb/sign-off/lampiran");
  });
});
