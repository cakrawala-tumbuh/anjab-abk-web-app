import { describe, it, expect, vi } from "vitest";

vi.mock("next-auth", () => ({
  default: () => ({ handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: vi.fn() }),
}));
vi.mock("next-auth/providers/authentik", () => ({ default: () => ({}) }));

import { isTimKajian, isSekolahPengisi } from "@/lib/auth/auth";
import { navForGroups, REDESAIN_TIM_ITEMS, type NavEntry } from "@/components/shell/sidebar";

const sesi = (groups: string[]) => ({ user: { groups } });

function href(entries: ReadonlyArray<NavEntry>): string[] {
  return entries.flatMap((e) => [
    e.href,
    ...(e.kind === "group" ? e.items.map((i) => i.href) : []),
  ]);
}

describe("helper peran redesain", () => {
  it("isTimKajian true untuk grup tim-kajian", () => {
    expect(isTimKajian(sesi(["tim-kajian"]))).toBe(true);
  });
  it("isSekolahPengisi true untuk grup sekolah-pengisi", () => {
    expect(isSekolahPengisi(sesi(["sekolah-pengisi"]))).toBe(true);
  });
  it("isTimKajian false untuk admin, kosong, dan sesi null", () => {
    expect(isTimKajian(sesi(["admin"]))).toBe(false);
    expect(isTimKajian(sesi([]))).toBe(false);
    expect(isTimKajian(null)).toBe(false);
  });
});

describe("navForGroups — menu Redesain Pekerjaan", () => {
  it("memuat /redesain untuk tim-kajian (dengan atau tanpa admin)", () => {
    expect(href(navForGroups(["tim-kajian"]))).toContain("/redesain");
    expect(href(navForGroups(["admin", "tim-kajian"]))).toContain("/redesain");
  });
  it("sub-item berisi Beranda, Kode Orang, Cakupan 19 Jabatan, dan Riwayat Perubahan", () => {
    expect(REDESAIN_TIM_ITEMS.map((i) => i.href)).toEqual([
      "/redesain",
      "/redesain/kode-orang",
      "/redesain/cakupan-jabatan",
      "/redesain/riwayat",
    ]);
  });
  it("admin saja dan partisipan tidak punya href berawalan /redesain", () => {
    for (const g of [["admin"], ["partisipan"]]) {
      expect(href(navForGroups(g)).some((h) => h.startsWith("/redesain"))).toBe(false);
    }
  });
});
