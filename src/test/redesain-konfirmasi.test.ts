import { describe, it, expect } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { navForGroups } from "@/components/shell/sidebar";
import {
  OPSI_INDIKASI,
  OPSI_KESESUAIAN,
  OPSI_SKALA,
  fieldKurang,
  langkahAwal,
  langkahMaks,
  pesanGagalWizard,
  pesanKode409,
} from "@/lib/redesain-konfirmasi";

describe("langkahMaks / langkahAwal", () => {
  it("draf tanpa cerita_dikunci_pada → hanya langkah 1", () => {
    const k = { status: "draf", cerita_dikunci_pada: null, dugaan_ditampilkan_pada: null };
    expect(langkahMaks(k)).toBe(1);
    expect(langkahAwal(k)).toBe(1);
  });
  it("cerita terkunci, dugaan belum tampil → langkah 2", () => {
    const k = { status: "draf", cerita_dikunci_pada: "t", dugaan_ditampilkan_pada: null };
    expect(langkahMaks(k)).toBe(2);
    expect(langkahAwal(k)).toBe(2);
  });
  it("dugaan tampil → sampai langkah 5, awal langkah 3", () => {
    const k = { status: "draf", cerita_dikunci_pada: "t", dugaan_ditampilkan_pada: "t" };
    expect(langkahMaks(k)).toBe(5);
    expect(langkahAwal(k)).toBe(3);
  });
  it("terkirim → langkah 5", () => {
    expect(langkahMaks({ status: "terkirim" })).toBe(5);
    expect(langkahAwal({ status: "terkirim" })).toBe(5);
  });
});

describe("pemetaan error", () => {
  const e = (code: string, status: number, details: unknown[] = []) =>
    new ApiError({ code, message: "pesan backend", details }, "r", status);

  it("kode 409 dipetakan", () => {
    expect(pesanKode409(e("CERITA_SUDAH_DIKUNCI", 409))).toBe(
      "Cerita sudah dikunci dan tidak dapat diubah",
    );
    expect(pesanKode409(e("CERITA_BELUM_DIKUNCI", 409))).toBe(
      "Selesaikan langkah sebelumnya dahulu",
    );
    expect(pesanKode409(e("DUGAAN_BELUM_DITAMPILKAN", 409))).toBe(
      "Selesaikan langkah sebelumnya dahulu",
    );
    expect(pesanKode409(e("lain", 409))).toBeNull();
    expect(pesanKode409(new Error("x"))).toBeNull();
  });
  it("422 menyebut field dari details", () => {
    const err = e("validation_error", 422, [
      { loc: ["body", "k3"], msg: "Wajib diisi.", type: "missing" },
      { loc: ["body", "k3"], msg: "dup", type: "missing" },
      { loc: ["body", "peran"], msg: "Wajib diisi.", type: "missing" },
    ]);
    expect(fieldKurang(err)).toEqual(["k3", "peran"]);
    expect(pesanGagalWizard(err)).toContain("K3");
    expect(pesanGagalWizard(err)).toContain("Jabatan/peran");
  });
  it("galat lain memakai pesan backend", () => {
    expect(pesanGagalWizard(e("x", 500))).toBe("pesan backend");
  });
});

describe("kosakata pilihan", () => {
  it("indikasi_risiko hanya tiga nilai A-2; kesesuaian empat nilai; skala empat nilai", () => {
    expect([...OPSI_INDIKASI]).toEqual(["Ada indikasi", "Tidak terlihat", "Belum tahu"]);
    expect([...OPSI_KESESUAIAN]).toEqual(["Ya", "Sebagian", "Tidak", "Belum bisa memastikan"]);
    expect([...OPSI_SKALA]).toEqual(["Tinggi", "Sedang", "Rendah", "Belum tahu"]);
  });
});

describe("menu sekolah-pengisi", () => {
  it("memuat 'Konfirmasi Redesain' hanya untuk grup sekolah-pengisi", () => {
    const labels = (g: string[]) => navForGroups(g).map((x) => x.label);
    expect(labels(["sekolah-pengisi"])).toContain("Konfirmasi Redesain");
    expect(labels(["admin"])).not.toContain("Konfirmasi Redesain");
    expect(labels(["partisipan"])).not.toContain("Konfirmasi Redesain");
  });
});
