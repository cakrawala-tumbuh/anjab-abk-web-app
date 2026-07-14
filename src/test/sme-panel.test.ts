import { describe, expect, it } from "vitest";
import type { SMEPanelRead } from "@/lib/api/schema";
import { jumlahAnggotaPanel, petaJumlahAnggotaPanel } from "@/lib/sme-panel";

function panel(id: string, jabatanId: string, anggota: string[]): SMEPanelRead {
  return {
    id,
    jabatan_id: jabatanId,
    partisipan_ids: anggota,
  } as unknown as SMEPanelRead;
}

describe("petaJumlahAnggotaPanel", () => {
  it("memetakan jabatan_id → jumlah anggota", () => {
    const peta = petaJumlahAnggotaPanel([
      panel(
        "sme_1",
        "jbt_gr_sd",
        Array.from({ length: 11 }, (_, i) => `par_${i}`),
      ),
      panel("sme_2", "jbt_ks", ["par_a", "par_b"]),
    ]);
    expect(peta).toEqual({ jbt_gr_sd: 11, jbt_ks: 2 });
  });

  it("panel tanpa anggota bernilai 0", () => {
    expect(petaJumlahAnggotaPanel([panel("sme_3", "jbt_kosong", [])])).toEqual({ jbt_kosong: 0 });
  });
});

describe("jumlahAnggotaPanel", () => {
  const peta = { jbt_gr_sd: 11 };

  it("null bila jabatan belum dipilih", () => {
    expect(jumlahAnggotaPanel(peta, "")).toBeNull();
  });

  it("jumlah anggota bila jabatan punya panel", () => {
    expect(jumlahAnggotaPanel(peta, "jbt_gr_sd")).toBe(11);
  });

  it("0 (bukan null) bila jabatan dipilih tapi tanpa panel — kondisi sah", () => {
    expect(jumlahAnggotaPanel(peta, "jbt_tanpa_panel")).toBe(0);
  });
});
