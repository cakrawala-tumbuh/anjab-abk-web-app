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

// ─── Helpers: sekolah, jabatan, partisipan (idempoten) ───────────────────────

async function buatSekolah(
  page: Parameters<typeof loginViaAuthentik>[0],
  nama: string,
  jenjangKode: string,
  jenjangNama: string,
): Promise<void> {
  await buatJenjang(page, jenjangKode, jenjangNama);
  await page.goto("/master-data/sekolah");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(nama)) return;

  await page.goto("/master-data/sekolah/tambah");
  await page.getByLabel("Nama Sekolah").fill(nama);
  await page
    .getByLabel("Jenjang Pendidikan")
    .selectOption({ label: `${jenjangKode} — ${jenjangNama}` });
  await page.getByRole("button", { name: "Tambah Sekolah" }).click();
  await page.waitForURL(/\/master-data\/sekolah$/, { timeout: 15_000 });
}

async function buatJabatan(
  page: Parameters<typeof loginViaAuthentik>[0],
  kode: string,
  nama: string,
  jenis: "struktural" | "fungsional" | "teknisi" = "fungsional",
): Promise<void> {
  await page.goto("/master-data/jabatan");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(kode)) return;

  await page.goto("/master-data/jabatan/tambah");
  await page.getByLabel("Kode").fill(kode);
  await page.getByLabel("Nama Jabatan").fill(nama);
  await page.getByLabel("Jenis Jabatan").selectOption(jenis);
  await page.getByRole("button", { name: "Tambah Jabatan" }).click();
  await page.waitForURL(/\/master-data\/jabatan$/, { timeout: 15_000 });
}

async function buatPartisipan(
  page: Parameters<typeof loginViaAuthentik>[0],
  opts: { nama: string; email: string; sekolahNama: string; jabatanNama: string },
): Promise<void> {
  await page.goto("/partisipan");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(opts.email)) return;

  await page.goto("/partisipan/tambah");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Nama Lengkap").fill(opts.nama);
  await page.getByLabel("Email").fill(opts.email);
  await page.getByLabel("Satuan Pendidikan").selectOption({ label: opts.sekolahNama });
  await page.getByLabel("Jabatan Utama").selectOption({ label: opts.jabatanNama });
  await page.getByLabel("Masa Kerja (Tahun)").fill("2");
  await page.getByRole("button", { name: "Tambah Partisipan" }).click();
  await page.waitForURL(/\/partisipan$/, { timeout: 15_000 });
}

// ─── SME Panel ────────────────────────────────────────────────────────────────

test.describe.serial("Master Data — SME Panel", () => {
  test("admin dapat mengakses halaman sme panel", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/master-data/sme-panel");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: "+ Tambah SME Panel" })).toBeVisible();
  });

  test("admin dapat tambah sme panel baru", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await buatJabatan(page, "E2E-SME-JBT", "Jabatan SME E2E Test");

    // Idempoten — lewati jika panel untuk jabatan ini sudah ada
    await page.goto("/master-data/sme-panel");
    await page.waitForLoadState("networkidle");
    if ((await page.content()).includes("Jabatan SME E2E Test")) return;

    await page.goto("/master-data/sme-panel/tambah");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Jabatan").selectOption({ label: "Jabatan SME E2E Test (fungsional)" });
    await page.getByRole("button", { name: "Tambah SME Panel" }).click();
    await page.waitForURL(/\/master-data\/sme-panel$/, { timeout: 15_000 });
    await expect(page.getByText("Jabatan SME E2E Test")).toBeVisible();
  });

  test("validasi form: jabatan wajib dipilih", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/master-data/sme-panel/tambah");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Tambah SME Panel" }).click();
    await expect(page.getByText("Jabatan wajib dipilih")).toBeVisible();
  });

  test("admin dapat melihat detail panel", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Panel harus sudah ada dari test sebelumnya ("admin dapat tambah sme panel baru")
    await page.goto("/master-data/sme-panel");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Jabatan SME E2E Test")).toBeVisible();

    // Klik "Kelola anggota" untuk panel dengan jabatan "Jabatan SME E2E Test"
    const panelRow = page.getByRole("row").filter({ hasText: "Jabatan SME E2E Test" });
    await panelRow.getByRole("link", { name: /Kelola anggota/ }).click();
    await page.waitForLoadState("networkidle");

    // Halaman detail harus menampilkan informasi panel
    await expect(page.getByText(/Anggota Panel/)).toBeVisible();
    await expect(page.getByRole("link", { name: "← Kembali" })).toBeVisible();
  });

  test("admin dapat tambah anggota ke panel SME", async ({ page }) => {
    test.setTimeout(120_000);
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Pastikan semua prasyarat tersedia (idempoten)
    await buatJabatan(page, "E2E-SME-JBT", "Jabatan SME E2E Test");
    await buatSekolah(page, "Sekolah SME E2E", "E2E-JENJANG", "Jenjang E2E Test");
    await buatPartisipan(page, {
      nama: "Partisipan SME E2E",
      email: "sme.e2e@test.local",
      sekolahNama: "Sekolah SME E2E",
      jabatanNama: "Jabatan SME E2E Test",
    });

    // Konfirmasi partisipan berhasil dibuat dan tercatat di daftar
    await page.goto("/partisipan");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("sme.e2e@test.local")).toBeVisible();

    // Buka detail panel untuk jabatan yang sesuai
    await page.goto("/master-data/sme-panel");
    await page.waitForLoadState("networkidle");
    const panelRow = page.getByRole("row").filter({ hasText: "Jabatan SME E2E Test" });
    await panelRow.getByRole("link", { name: /Kelola anggota/ }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Anggota Panel/)).toBeVisible();

    // Tunggu client-side fetch partisipan selesai (loading text hilang)
    await expect(page.getByText("Memuat data partisipan")).not.toBeVisible({ timeout: 10_000 });

    // Tambah atau verifikasi anggota — cek via baris tabel, bukan option select
    const anggotaRow = page.getByRole("row").filter({ hasText: "Partisipan SME E2E" });
    const sudahAnggota = (await anggotaRow.count()) > 0;
    if (!sudahAnggota) {
      const select = page.getByLabel("Tambah Anggota");
      await expect(select).toBeVisible({ timeout: 10_000 });
      await select.selectOption({ label: "Partisipan SME E2E — sme.e2e@test.local" });
      await page.getByRole("button", { name: "Tambah" }).click();
      // Tunggu loading state selesai setelah refresh
      await expect(page.getByText("Memuat data partisipan")).not.toBeVisible({ timeout: 10_000 });
    }
    await expect(page.getByRole("row").filter({ hasText: "Partisipan SME E2E" })).toBeVisible();
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
