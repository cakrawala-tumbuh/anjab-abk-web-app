import { describe, expect, it } from "vitest";
import { schema as tiSesiSchema } from "@/app/(auth)/task-inventory/buat/ti-sesi-form";
import { detailItemSchema } from "@/app/(auth)/task-inventory/tahap3/[responden_id]/detail-form";

const VALID_SESI = {
  jabatan_id: "jbt_test",
  cabang: "Bandung",
};

const VALID_DETAIL = {
  task_kode: "TIf0b59714",
  sumber_bukti: "Aktual",
  kondisi: "Baseline",
  frekuensi_teks: "Mingguan",
  durasi_per_kali: 60,
  jam_per_minggu: 2,
  peak4w_hours: 0,
  va_type: "VA-Core",
};

describe("TiSesiSchema", () => {
  it("menerima payload valid", () => {
    expect(tiSesiSchema.safeParse(VALID_SESI).success).toBe(true);
  });

  it("menolak jabatan_id kosong", () => {
    const result = tiSesiSchema.safeParse({ ...VALID_SESI, jabatan_id: "" });
    expect(result.success).toBe(false);
  });

  it("menerima cabang Bandung maupun Semarang", () => {
    expect(tiSesiSchema.safeParse({ ...VALID_SESI, cabang: "Bandung" }).success).toBe(true);
    expect(tiSesiSchema.safeParse({ ...VALID_SESI, cabang: "Semarang" }).success).toBe(true);
  });

  it("menolak cabang kosong atau tidak dikenal", () => {
    expect(tiSesiSchema.safeParse({ ...VALID_SESI, cabang: "" }).success).toBe(false);
    expect(tiSesiSchema.safeParse({ ...VALID_SESI, cabang: "Jakarta" }).success).toBe(false);
    const { cabang, ...tanpaCabang } = VALID_SESI;
    void cabang;
    expect(tiSesiSchema.safeParse(tanpaCabang).success).toBe(false);
  });
});

describe("TiDetailItemSchema", () => {
  it("menerima entri detail valid", () => {
    expect(detailItemSchema.safeParse(VALID_DETAIL).success).toBe(true);
  });

  it("menolak enum sumber_bukti yang salah", () => {
    expect(detailItemSchema.safeParse({ ...VALID_DETAIL, sumber_bukti: "Salah" }).success).toBe(
      false,
    );
  });

  it("menolak enum va_type yang salah", () => {
    expect(detailItemSchema.safeParse({ ...VALID_DETAIL, va_type: "Y" }).success).toBe(false);
  });

  it("menolak jam_per_minggu negatif", () => {
    expect(detailItemSchema.safeParse({ ...VALID_DETAIL, jam_per_minggu: -1 }).success).toBe(false);
  });

  it("menolak frekuensi kosong", () => {
    expect(detailItemSchema.safeParse({ ...VALID_DETAIL, frekuensi_teks: "" }).success).toBe(false);
  });

  it("menerima frekuensi string bebas di luar 4 opsi dropdown (data lama)", () => {
    // frekuensi_teks tetap z.string(), bukan z.enum — record lama ("Bulanan", dst.)
    // harus tetap tervalidasi meski UI kini menampilkannya lewat <select>.
    expect(detailItemSchema.safeParse({ ...VALID_DETAIL, frekuensi_teks: "Bulanan" }).success).toBe(
      true,
    );
  });

  it("menerapkan default peak4w_hours", () => {
    const { peak4w_hours, ...rest } = VALID_DETAIL;
    void peak4w_hours;
    const result = detailItemSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.peak4w_hours).toBe(0);
    }
  });

  it("menerapkan default setuju_standar = true bila tidak dikirim", () => {
    const result = detailItemSchema.safeParse(VALID_DETAIL);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.setuju_standar).toBe(true);
    }
  });

  it("menerima setuju_standar eksplisit false", () => {
    const result = detailItemSchema.safeParse({ ...VALID_DETAIL, setuju_standar: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.setuju_standar).toBe(false);
    }
  });
});
