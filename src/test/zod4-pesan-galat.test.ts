import { describe, expect, it } from "vitest";
import { schema as penugasanSchema } from "@/app/(auth)/time-study/buat/ts-penugasan-form";
import { schema as tsLogSchema } from "@/app/(auth)/time-study/isi/[penugasan_id]/tambah/ts-log-form";
import { schema as partisipanSchema } from "@/app/(auth)/partisipan/tambah/partisipan-form";
import { schema as tiSesiSchema } from "@/app/(auth)/task-inventory/buat/ti-sesi-form";
import { schema as opmSchema } from "@/app/(auth)/opm/buat/opm-sesi-form";
import { schema as jabatanSchema } from "@/app/(auth)/master-data/jabatan/tambah/jabatan-form";
import { schema as mapelSchema } from "@/app/(auth)/master-data/mata-pelajaran/tambah/mata-pelajaran-form";

/** Ambil pesan galat pertama untuk path tertentu dari hasil `safeParse`. */
function pesan(
  hasil: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } },
  path: string,
): string | undefined {
  return hasil.error?.issues.find((i) => i.path.join(".") === path)?.message;
}

describe("migrasi zod 4 - pesan galat Indonesia dipertahankan", () => {
  it("penugasan time study: payload sah diterima", () => {
    const r = penugasanSchema.safeParse({ partisipan_id: "abc", catatan: "ok" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.partisipan_id).toBe("abc");
  });

  it("penugasan time study: field wajib kosong -> pesan wajib", () => {
    const r = penugasanSchema.safeParse({ partisipan_id: "" });
    expect(r.success).toBe(false);
    expect(pesan(r, "partisipan_id")).toBe("Partisipan wajib dipilih");
  });

  it("field angka diisi teks/NaN -> 'Isi angka'", () => {
    const base = {
      tanggal: "2025-06-01",
      waktu_masuk: "07:30",
      waktu_keluar: "16:00",
      day_color: "GREEN",
    };
    expect(pesan(tsLogSchema.safeParse({ ...base, jam_core: "abc" }), "jam_core")).toBe(
      "Isi angka",
    );
    expect(pesan(tsLogSchema.safeParse({ ...base, jam_core: Number.NaN }), "jam_core")).toBe(
      "Isi angka",
    );
    const ok = tsLogSchema.safeParse(base);
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.jam_core).toBe(0);
  });

  it("partisipan: masa kerja bertipe salah -> pesan khusus; email tak sah -> pesan email", () => {
    const base = {
      nama: "A",
      email: "bukan-email",
      sekolah_id: "s",
      jabatan_utama_id: "j",
      masa_kerja_tahun: "x",
    };
    const r = partisipanSchema.safeParse(base);
    expect(pesan(r, "email")).toBe("Format email tidak valid");
    expect(pesan(r, "masa_kerja_tahun")).toBe("Isi angka tahun");
    expect(
      partisipanSchema.safeParse({ ...base, email: "a@b.co", masa_kerja_tahun: 3 }).success,
    ).toBe(true);
    expect(pesan(partisipanSchema.safeParse({ ...base, email: "" }), "email")).toBe(
      "Format email tidak valid",
    );
  });

  it("cabang TI: kosong atau di luar enum -> 'Cabang wajib dipilih'", () => {
    const base = { jabatan_id: "j" };
    expect(pesan(tiSesiSchema.safeParse(base), "cabang")).toBe("Cabang wajib dipilih");
    expect(pesan(tiSesiSchema.safeParse({ ...base, cabang: "" }), "cabang")).toBe(
      "Cabang wajib dipilih",
    );
    expect(tiSesiSchema.safeParse({ ...base, cabang: "Bandung" }).success).toBe(true);
  });

  it("jenis jabatan: kosong -> 'Jenis wajib dipilih'", () => {
    const base = { kode: "K", nama: "N" };
    expect(pesan(jabatanSchema.safeParse(base), "jenis")).toBe("Jenis wajib dipilih");
    expect(jabatanSchema.safeParse({ ...base, jenis: "struktural" }).success).toBe(true);
  });

  it("kelompok mata pelajaran: '' atau tak dikenal -> 'Kelompok wajib dipilih'", () => {
    const base = { kode: "K", nama: "N" };
    expect(pesan(mapelSchema.safeParse({ ...base, kelompok: "" }), "kelompok")).toBe(
      "Kelompok wajib dipilih",
    );
    expect(pesan(mapelSchema.safeParse({ ...base, kelompok: "zzz" }), "kelompok")).toBe(
      "Kelompok wajib dipilih",
    );
    expect(mapelSchema.safeParse({ ...base, kelompok: "umum" }).success).toBe(true);
  });

  it("OPM: refine lintas field dan strictObject tetap berlaku", () => {
    const base = {
      jabatan_id: "j",
      ti_sesi_id: "t",
      periode: "2026-06",
      min_responden: 5,
      max_responden: 3,
    };
    expect(pesan(opmSchema.safeParse(base), "max_responden")).toBe("Maksimum harus ≥ minimum");
    expect(opmSchema.safeParse({ ...base, max_responden: 9 }).success).toBe(true);
    expect(opmSchema.safeParse({ ...base, max_responden: 9, ekstra: 1 }).success).toBe(false);
  });
});
