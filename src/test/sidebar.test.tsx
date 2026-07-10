import { describe, expect, it } from "vitest";
import {
  isActiveHref,
  MASTER_DATA_ITEMS,
  NAV_ADMIN,
  NAV_PARTISIPAN,
  navForGroups,
} from "@/components/shell/sidebar";

describe("navForGroups", () => {
  it("mengembalikan NAV_ADMIN untuk grup admin", () => {
    expect(navForGroups(["admin"])).toBe(NAV_ADMIN);
  });

  it("mengembalikan NAV_PARTISIPAN untuk grup selain admin", () => {
    expect(navForGroups(["partisipan"])).toBe(NAV_PARTISIPAN);
  });

  it("mengembalikan NAV_PARTISIPAN untuk grup kosong", () => {
    expect(navForGroups([])).toBe(NAV_PARTISIPAN);
  });
});

describe("struktur menu admin", () => {
  it("berisi grup Master Data dengan 11 sub-item", () => {
    const masterData = NAV_ADMIN.find((entry) => entry.href === "/master-data");
    expect(masterData?.kind).toBe("group");
    expect(masterData && "items" in masterData ? masterData.items : []).toHaveLength(11);
  });

  it("MASTER_DATA_ITEMS mencakup seluruh 11 sub-item yang diharapkan", () => {
    expect(MASTER_DATA_ITEMS.map((item) => item.href)).toEqual([
      "/master-data/jenjang-pendidikan",
      "/master-data/sekolah",
      "/master-data/jabatan",
      "/master-data/sme-panel",
      "/master-data/mata-pelajaran",
      "/master-data/dcs",
      "/master-data/wcp",
      "/master-data/task-inventory",
      "/master-data/tugas-pokok",
      "/master-data/detil-tugas",
      "/master-data/uraian-tugas",
    ]);
  });

  it("mencakup menu admin lain di luar Master Data", () => {
    expect(NAV_ADMIN.map((entry) => entry.href)).toEqual([
      "/dashboard",
      "/partisipan",
      "/task-inventory",
      "/time-study",
      "/opm",
      "/dcs",
      "/wcp",
      "/master-data",
    ]);
  });
});

describe("struktur menu partisipan", () => {
  it("hanya berisi Dashboard dan Kuesioner Saya", () => {
    expect(NAV_PARTISIPAN.map((entry) => entry.href)).toEqual(["/dashboard", "/kuesioner"]);
  });

  it("tidak berisi Master Data", () => {
    expect(NAV_PARTISIPAN.some((entry) => entry.href === "/master-data")).toBe(false);
  });
});

describe("isActiveHref", () => {
  it("aktif saat pathname persis sama dengan href", () => {
    expect(isActiveHref("/dcs", "/dcs")).toBe(true);
  });

  it("aktif saat pathname adalah sub-route dari href", () => {
    expect(isActiveHref("/dcs/123", "/dcs")).toBe(true);
    expect(isActiveHref("/master-data/jabatan", "/master-data")).toBe(true);
  });

  it("tidak aktif untuk href berbeda meski berawalan sama", () => {
    expect(isActiveHref("/dcsfoo", "/dcs")).toBe(false);
  });

  it("tidak aktif untuk route yang sama sekali berbeda", () => {
    expect(isActiveHref("/wcp", "/dcs")).toBe(false);
  });
});
