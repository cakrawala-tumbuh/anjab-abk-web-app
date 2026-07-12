import { describe, it, expect } from "vitest";
import { formatAlasanSkip } from "@/lib/format/bulk-skip-alasan";

describe("formatAlasanSkip", () => {
  it("menerjemahkan seluruh kode alasan yang dikenal", () => {
    expect(formatAlasanSkip("sudah_terdaftar")).toBe("Sudah terdaftar");
    expect(formatAlasanSkip("duplikat_input")).toBe("Duplikat dalam input");
    expect(formatAlasanSkip("bukan_anggota_sme_panel")).toBe("Bukan anggota SME panel");
    expect(formatAlasanSkip("kapasitas_penuh")).toBe("Kapasitas sesi penuh");
  });

  it("mengembalikan kode asli untuk alasan yang tidak dikenal", () => {
    expect(formatAlasanSkip("alasan_asing")).toBe("alasan_asing");
  });
});
