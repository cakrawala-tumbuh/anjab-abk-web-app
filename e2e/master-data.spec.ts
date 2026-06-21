import { test, expect } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";

// ─── Helper: buat jenjang pendidikan (idempoten) ─────────────────────────────

async function buatJenjang(
  page: Parameters<typeof loginViaAuthentik>[0],
  kode: string,
  nama: string,
): Promise<void> {
  await page.goto("/master-data/jenjang-pendidikan");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(kode)) return;

  await page.goto("/master-data/jenjang-pendidikan/tambah");
  await page.getByLabel("Kode").fill(kode);
  await page.getByLabel("Nama Lengkap").fill(nama);
  await page.getByRole("button", { name: "Tambah Jenjang" }).click();
  await page.waitForURL(/\/master-data\/jenjang-pendidikan$/, { timeout: 15_000 });
  await expect(page.getByText(nama)).toBeVisible();
}

// ─── Jenjang Pendidikan ───────────────────────────────────────────────────────

test.describe.serial("Master Data — Jenjang Pendidikan", () => {
  test("admin dapat mengakses halaman jenjang pendidikan", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/master-data/jenjang-pendidikan");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: "+ Tambah Jenjang" })).toBeVisible();
  });

  test("admin dapat tambah jenjang pendidikan baru", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await buatJenjang(page, "E2E-JENJANG", "Jenjang E2E Test");
    await expect(page.getByText("Jenjang E2E Test")).toBeVisible();
  });

  test("validasi form: kode dan nama wajib diisi", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/master-data/jenjang-pendidikan/tambah");
    await page.getByRole("button", { name: "Tambah Jenjang" }).click();
    await expect(page.getByText("Kode wajib diisi")).toBeVisible();
    await expect(page.getByText("Nama wajib diisi")).toBeVisible();
  });
});

// ─── Sekolah ─────────────────────────────────────────────────────────────────

test.describe.serial("Master Data — Sekolah", () => {
  test("admin dapat mengakses halaman sekolah", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/master-data/sekolah");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: "+ Tambah Sekolah" })).toBeVisible();
  });

  test("admin dapat tambah sekolah baru", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await buatJenjang(page, "E2E-JENJANG", "Jenjang E2E Test");

    // Idempoten — lewati jika sekolah sudah ada
    await page.goto("/master-data/sekolah");
    await page.waitForLoadState("networkidle");
    if ((await page.content()).includes("Sekolah E2E Test")) return;

    await page.goto("/master-data/sekolah/tambah");
    await page.getByLabel("Nama Sekolah").fill("Sekolah E2E Test");
    await page
      .getByLabel("Jenjang Pendidikan")
      .selectOption({ label: "E2E-JENJANG — Jenjang E2E Test" });
    await page.getByRole("button", { name: "Tambah Sekolah" }).click();
    await page.waitForURL(/\/master-data\/sekolah$/, { timeout: 15_000 });
    await expect(page.getByText("Sekolah E2E Test")).toBeVisible();
  });

  test("validasi form: nama dan jenjang wajib", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/master-data/sekolah/tambah");
    await page.getByRole("button", { name: "Tambah Sekolah" }).click();
    await expect(page.getByText("Nama wajib diisi")).toBeVisible();
    await expect(page.getByText("Jenjang pendidikan wajib dipilih")).toBeVisible();
  });

  test("validasi form: NPSN harus 8 digit angka", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/master-data/sekolah/tambah");
    await page.getByLabel("Nama Sekolah").fill("Test Sekolah");
    await page.getByLabel("NPSN").fill("123");
    await page.getByRole("button", { name: "Tambah Sekolah" }).click();
    await expect(page.getByText("NPSN harus 8 digit angka")).toBeVisible();
  });
});

// ─── Mata Pelajaran ──────────────────────────────────────────────────────────

test.describe.serial("Master Data — Mata Pelajaran", () => {
  test("admin dapat mengakses halaman mata pelajaran", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/master-data/mata-pelajaran");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: "+ Tambah Mata Pelajaran" })).toBeVisible();
  });

  test("admin dapat tambah mata pelajaran baru", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Idempoten — lewati jika sudah ada
    await page.goto("/master-data/mata-pelajaran");
    await page.waitForLoadState("networkidle");
    if ((await page.content()).includes("E2E-MAPEL")) return;

    await page.goto("/master-data/mata-pelajaran/tambah");
    await page.getByLabel("Kode").fill("E2E-MAPEL");
    await page.getByLabel("Nama Mata Pelajaran").fill("Mata Pelajaran E2E Test");
    await page.getByLabel("Kelompok").selectOption("umum");
    await page.getByRole("button", { name: "Tambah Mata Pelajaran" }).click();
    await page.waitForURL(/\/master-data\/mata-pelajaran$/, { timeout: 15_000 });
    await expect(page.getByText("Mata Pelajaran E2E Test")).toBeVisible();
  });

  test("validasi form: kode, nama, dan kelompok wajib", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/master-data/mata-pelajaran/tambah");
    await page.getByRole("button", { name: "Tambah Mata Pelajaran" }).click();
    await expect(page.getByText("Kode wajib diisi")).toBeVisible();
    await expect(page.getByText("Nama wajib diisi")).toBeVisible();
    await expect(page.getByText("Kelompok wajib dipilih")).toBeVisible();
  });
});

// ─── Instrumen DCS & WCP ─────────────────────────────────────────────────────

test.describe("Master Data — Instrumen DCS dan WCP", () => {
  test("admin dapat melihat daftar sub-skala DCS", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/master-data/dcs");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Instrumen DCS — Demand·Control·Support")).toBeVisible();
    // Sub-skala DCS di-seed oleh backend — harus ada minimal satu
    await expect(page.getByText("Kelola item →").first()).toBeVisible();
  });

  test("admin dapat melihat daftar dimensi WCP", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/master-data/wcp");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Instrumen WCP — Workplace Climate Profile")).toBeVisible();
    // Dimensi WCP di-seed oleh backend — harus ada minimal satu
    await expect(page.getByText("Kelola item →").first()).toBeVisible();
  });
});
