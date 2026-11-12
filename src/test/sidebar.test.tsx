import { describe, expect, it } from "vitest";
import {
  isActiveHref,
  MASTER_DATA_ITEMS,
  NARASI_TIM_ITEMS,
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
  it("berisi grup Master Data dengan 12 sub-item", () => {
    const masterData = NAV_ADMIN.find((entry) => entry.href === "/master-data");
    expect(masterData?.kind).toBe("group");
    expect(masterData && "items" in masterData ? masterData.items : []).toHaveLength(12);
  });

  it("MASTER_DATA_ITEMS mencakup seluruh 12 sub-item yang diharapkan", () => {
    expect(MASTER_DATA_ITEMS.map((item) => item.href)).toEqual([
      "/master-data/jenjang-pendidikan",
      "/master-data/sekolah",
      "/master-data/jabatan",
      "/master-data/sme-panel",
      "/master-data/mata-pelajaran",
      "/master-data/dcs",
      "/master-data/wcp",
      "/master-data/task-inventory",
      "/master-data/task-inventory/utilitas",
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
      "/backup",
      "/sistem/ai",
      "/sistem/ai/penyedia",
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

describe("menu Saklar & Run AI", () => {
  const hrefs = (g: string[]) => navForGroups(g).map((e) => e.href);

  it("hanya tampil untuk admin", () => {
    expect(hrefs(["admin"])).toContain("/sistem/ai");
    expect(hrefs([])).not.toContain("/sistem/ai");
    expect(hrefs(["partisipan"])).not.toContain("/sistem/ai");
    expect(hrefs(["tim-kajian"])).not.toContain("/sistem/ai");
    expect(hrefs(["sekolah-pengisi"])).not.toContain("/sistem/ai");
  });
});

describe("menu Penyedia AI", () => {
  const hrefs = (g: string[]) => navForGroups(g).map((e) => e.href);

  it("hanya tampil untuk admin", () => {
    expect(hrefs(["admin"])).toContain("/sistem/ai/penyedia");
    expect(hrefs([])).not.toContain("/sistem/ai/penyedia");
    expect(hrefs(["partisipan"])).not.toContain("/sistem/ai/penyedia");
    expect(hrefs(["tim-kajian"])).not.toContain("/sistem/ai/penyedia");
    expect(hrefs(["sekolah-pengisi"])).not.toContain("/sistem/ai/penyedia");
  });

  it("berlabel Penyedia AI", () => {
    const item = NAV_ADMIN.find((e) => e.href === "/sistem/ai/penyedia");
    expect(item?.label).toBe("Penyedia AI");
  });
});

describe("menu Narasi", () => {
  const hrefs = (g: string[]) => navForGroups(g).map((e) => e.href);

  it("hanya tampil untuk tim-kajian, dengan item Sumber Narasi dan Kasus", () => {
    expect(hrefs(["tim-kajian"])).toContain("/narasi");
    const grup = navForGroups(["tim-kajian"]).find((e) => e.href === "/narasi");
    expect(grup?.kind).toBe("group");
    expect(grup && "items" in grup ? grup.items : []).toEqual(NARASI_TIM_ITEMS);
    expect(NARASI_TIM_ITEMS.map((i) => i.href)).toEqual([
      "/narasi/sumber",
      "/narasi/kasus",
      "/narasi/antrean",
      "/narasi/klarifikasi",
    ]);
  });

  it("tidak tampil untuk admin saja, partisipan, atau sekolah-pengisi", () => {
    expect(hrefs(["admin"])).not.toContain("/narasi");
    expect(hrefs(["partisipan"])).not.toContain("/narasi");
    expect(hrefs([])).not.toContain("/narasi");
    expect(hrefs(["sekolah-pengisi"])).not.toContain("/narasi");
  });
});

describe("menu Usulan AI", () => {
  const href = (g: string[]) => navForGroups(g).map((e) => e.href);

  it("tampil untuk tim-kajian sebagai tautan /ai-usulan", () => {
    const e = navForGroups(["tim-kajian"]).find((x) => x.href === "/ai-usulan");
    expect(e?.kind).toBe("link");
    expect(e?.label).toBe("Usulan AI");
  });

  it("tidak tampil untuk sekolah-pengisi, admin, maupun partisipan", () => {
    expect(href(["sekolah-pengisi"])).not.toContain("/ai-usulan");
    expect(href(["admin"])).not.toContain("/ai-usulan");
    expect(href(["partisipan"])).not.toContain("/ai-usulan");
  });
});

describe("menu Katalog TI untuk tim-kajian", () => {
  it("tim-kajian non-admin memuat Katalog TI", () => {
    const hrefs = navForGroups(["tim-kajian"]).map((e) => e.href);
    expect(hrefs).toContain("/master-data/task-inventory");
  });

  it("admin + tim-kajian tidak menggandakan Katalog TI", () => {
    const entries = navForGroups(["admin", "tim-kajian"]);
    expect(entries.filter((e) => e.label === "Katalog TI")).toHaveLength(0);
  });
});

describe("menu Riset", () => {
  const hrefs = (g: string[]) => navForGroups(g).map((e) => e.href);

  it("hanya tampil untuk tim-kajian, dengan sub-item Protokol", () => {
    const grup = navForGroups(["tim-kajian"]).find((e) => e.href === "/riset");
    expect(grup?.kind).toBe("group");
    expect(grup && "items" in grup ? grup.items : []).toEqual([
      { href: "/riset/protokol", label: "Protokol" },
    ]);
  });

  it("tidak tampil untuk admin saja, partisipan, atau sekolah-pengisi", () => {
    expect(hrefs(["admin"])).not.toContain("/riset");
    expect(hrefs(["partisipan"])).not.toContain("/riset");
    expect(hrefs(["sekolah-pengisi"])).not.toContain("/riset");
    expect(hrefs([])).not.toContain("/riset");
  });
});
