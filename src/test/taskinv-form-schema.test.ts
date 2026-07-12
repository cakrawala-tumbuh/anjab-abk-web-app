import { describe, expect, it } from "vitest";
import { schema as tiSesiSchema } from "@/app/(auth)/task-inventory/buat/ti-sesi-form";
import { detailItemSchema } from "@/app/(auth)/task-inventory/tahap3/[responden_id]/detail-form";

const VALID_SESI = {
  jabatan_id: "jbt_test",
  periode: "2026-06",
  min_responden: 3,
  max_responden: 10,
};

const VALID_DETAIL = {
  task_kode: "TIf0b59714",
  sumber_bukti: "Aktual",
  kondisi: "Baseline",
  frekuensi_teks: "Mingguan",
  durasi_per_kali: 60,
  jam_per_minggu: 2,
  peak4w_hours: 0,
  ai_mode: "Human-led",
  va_type: "VA-Core",
  dcs_flag: false,
};

describe("TiSesiSchema", () => {
  it("menerima payload valid", () => {
    expect(tiSesiSchema.safeParse(VALID_SESI).success).toBe(true);
  });

  it("menolak jabatan_id kosong", () => {
    const result = tiSesiSchema.safeParse({ ...VALID_SESI, jabatan_id: "" });
    expect(result.success).toBe(false);
  });

  it("menolak format periode yang salah", () => {
    for (const periode of ["2026-6", "26-06", "2026/06", "202606"]) {
      expect(tiSesiSchema.safeParse({ ...VALID_SESI, periode }).success).toBe(false);
    }
  });

  it("menolak max < min", () => {
    const result = tiSesiSchema.safeParse({
      ...VALID_SESI,
      min_responden: 8,
      max_responden: 3,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.path[0])).toContain("max_responden");
    }
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

  it("menolak enum ai_mode/va_type yang salah", () => {
    expect(detailItemSchema.safeParse({ ...VALID_DETAIL, ai_mode: "X" }).success).toBe(false);
    expect(detailItemSchema.safeParse({ ...VALID_DETAIL, va_type: "Y" }).success).toBe(false);
  });

  it("menolak jam_per_minggu negatif", () => {
    expect(detailItemSchema.safeParse({ ...VALID_DETAIL, jam_per_minggu: -1 }).success).toBe(false);
  });

  it("menolak frekuensi kosong", () => {
    expect(detailItemSchema.safeParse({ ...VALID_DETAIL, frekuensi_teks: "" }).success).toBe(false);
  });

  it("menerapkan default peak4w_hours & dcs_flag", () => {
    const { peak4w_hours, ...rest } = VALID_DETAIL;
    void peak4w_hours;
    const result = detailItemSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.peak4w_hours).toBe(0);
      expect(result.data.dcs_flag).toBe(false);
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
