import { test, expect } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";

/**
 * Buat jabatan via halaman master data (idempoten — lewati jika sudah ada).
 * Diperlukan sebagai prasyarat sebelum membuat sesi DCS / WCP.
 */
async function buatJabatan(
  page: Parameters<typeof loginViaAuthentik>[0],
  kode: string,
  nama: string,
): Promise<void> {
  // Cek apakah jabatan sudah ada di daftar (pakai content() agar tidak bergantung pada role matching)
  await page.goto("/master-data/jabatan");
  await page.waitForLoadState("networkidle");
  const sudahAda = (await page.content()).includes(kode);
  if (sudahAda) return;

  await page.goto("/master-data/jabatan/tambah");
  await page.getByLabel("Kode").fill(kode);
  await page.getByLabel("Nama Jabatan").fill(nama);
  await page.getByLabel("Jenis Jabatan").selectOption("fungsional");
  await page.getByRole("button", { name: "Tambah Jabatan" }).click();
  await page.waitForURL(/\/master-data\/jabatan$/, { timeout: 15_000 });
  await expect(page.getByText(nama)).toBeVisible();
}

/**
 * Klik tombol transisi sesi (Buka/Tutup), tunggu API 200, lalu reload halaman agar
 * mendapat server render terbaru (menghindari router.refresh() race di Next.js 15).
 */
async function doTransisi(
  page: Parameters<typeof loginViaAuthentik>[0],
  buttonName: string,
  apiUrlFragment: string,
): Promise<void> {
  const btn = page.getByRole("button", { name: buttonName });
  if (!(await btn.isVisible())) return; // sudah dalam status target

  const responsePromise = page.waitForResponse(
    (resp) => resp.url().includes(apiUrlFragment) && resp.status() === 200,
    { timeout: 10_000 },
  );
  await btn.click();
  await responsePromise;
  // Full reload agar server mengirim RSC baru — menghindari isu router.refresh()
  await page.reload();
  await page.waitForLoadState("networkidle");
}

// ─── Sesi DCS ────────────────────────────────────────────────────────────────

test.describe.serial("Sesi DCS — Alur Admin", () => {
  const JABATAN_KODE = "E2E-DCS-01";
  const JABATAN_NAMA = "Guru DCS E2E";
  const PERIODE = "2025-06";

  test("buat sesi DCS baru dan verifikasi status DRAFT", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await buatJabatan(page, JABATAN_KODE, JABATAN_NAMA);

    // Cek apakah sesi sudah ada (idempoten — backend in-memory persists antar run)
    await page.goto("/dcs");
    await page.waitForLoadState("networkidle");
    const sesiLink = page.getByRole("link", { name: JABATAN_NAMA }).first();
    if (await sesiLink.isVisible()) {
      await sesiLink.click();
      await page.waitForURL(/\/dcs\/dses_/);
      // Sesi sudah ada dalam status apapun — cukup verifikasi ada
      await expect(page.getByText(/Draft|Terbuka|Tertutup|Teranalisis/)).toBeVisible();
      return;
    }

    await page.goto("/dcs/buat");

    // Pilih jabatan dari dropdown
    await page.getByLabel("Jabatan").selectOption({ label: JABATAN_NAMA });
    await page.getByLabel("Periode").fill(PERIODE);

    await page.getByRole("button", { name: "Buat Sesi" }).click();

    // Setelah submit berhasil, redirect ke halaman detail sesi
    await page.waitForURL(/\/dcs\/dses_/, { timeout: 15_000 });

    // Status awal harus DRAFT
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    // Tombol "Buka Sesi" tersedia di status DRAFT
    await expect(page.getByRole("button", { name: "Buka Sesi" })).toBeVisible();
  });

  test("transisi sesi DCS: DRAFT → OPEN → CLOSED", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/dcs");
    await page.getByRole("link", { name: JABATAN_NAMA }).first().click();
    await page.waitForURL(/\/dcs\/dses_/);

    // Buka sesi: DRAFT → OPEN (idempoten — lewati jika sudah OPEN atau CLOSED)
    await doTransisi(page, "Buka Sesi", "/buka");

    // Tutup sesi: OPEN → CLOSED (idempoten — lewati jika sudah CLOSED)
    await doTransisi(page, "Tutup Sesi", "/tutup");

    // Sesi harus CLOSED — gunakan exact agar tidak cocok dengan "Sesi tertutup." di deskripsi
    await expect(page.getByText("Tertutup", { exact: true })).toBeVisible({ timeout: 5_000 });

    // Setelah CLOSED: tombol transisi tidak ada lagi
    await expect(page.getByRole("button", { name: "Buka Sesi" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Tutup Sesi" })).not.toBeVisible();
  });

  test("sesi DCS muncul di daftar dengan jabatan dan periode", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/dcs");

    // Jabatan dan periode harus terlihat di tabel
    await expect(page.getByRole("link", { name: JABATAN_NAMA })).toBeVisible();
    await expect(page.getByText(PERIODE)).toBeVisible();
  });

  test("validasi form: jabatan wajib dipilih", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/dcs/buat");

    // Coba submit tanpa mengisi jabatan
    await page.getByLabel("Periode").fill(PERIODE);
    await page.getByRole("button", { name: "Buat Sesi" }).click();

    // Pesan error harus muncul
    await expect(page.getByText("Jabatan wajib dipilih")).toBeVisible();
  });

  test("validasi form: format periode harus YYYY-MM", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/dcs/buat");
    await page.getByLabel("Jabatan").selectOption({ label: JABATAN_NAMA });
    await page.getByLabel("Periode").fill("06-2025"); // format salah
    await page.getByRole("button", { name: "Buat Sesi" }).click();

    await expect(page.getByText(/format periode/i)).toBeVisible();
  });
});

// ─── Sesi WCP ────────────────────────────────────────────────────────────────

test.describe.serial("Sesi WCP — Alur Admin", () => {
  const JABATAN_KODE = "E2E-WCP-01";
  const JABATAN_NAMA = "Staf WCP E2E";
  const PERIODE = "2025-06";

  test("buat sesi WCP baru dan verifikasi status DRAFT", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await buatJabatan(page, JABATAN_KODE, JABATAN_NAMA);

    // Cek apakah sesi sudah ada (idempoten)
    await page.goto("/wcp");
    await page.waitForLoadState("networkidle");
    const sesiLink = page.getByRole("link", { name: JABATAN_NAMA }).first();
    if (await sesiLink.isVisible()) {
      await sesiLink.click();
      await page.waitForURL(/\/wcp\/wses_/);
      await expect(page.getByText(/Draft|Terbuka|Tertutup|Teranalisis/)).toBeVisible();
      return;
    }

    await page.goto("/wcp/buat");

    await page.getByLabel("Jabatan").selectOption({ label: JABATAN_NAMA });
    await page.getByLabel("Periode").fill(PERIODE);

    await page.getByRole("button", { name: "Buat Sesi" }).click();

    await page.waitForURL(/\/wcp\/wses_/, { timeout: 15_000 });

    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buka Sesi" })).toBeVisible();
  });

  test("transisi sesi WCP: DRAFT → OPEN → CLOSED", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/wcp");
    await page.getByRole("link", { name: JABATAN_NAMA }).first().click();
    await page.waitForURL(/\/wcp\/wses_/);

    // Buka sesi: DRAFT → OPEN (idempoten)
    await doTransisi(page, "Buka Sesi", "/buka");

    // Tutup sesi: OPEN → CLOSED (idempoten)
    await doTransisi(page, "Tutup Sesi", "/tutup");

    await expect(page.getByText("Tertutup", { exact: true })).toBeVisible({ timeout: 5_000 });

    await expect(page.getByRole("button", { name: "Buka Sesi" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Tutup Sesi" })).not.toBeVisible();
  });

  test("sesi WCP muncul di daftar dengan jabatan dan periode", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/wcp");

    await expect(page.getByRole("link", { name: JABATAN_NAMA })).toBeVisible();
    await expect(page.getByText(PERIODE)).toBeVisible();
  });

  test("validasi form: jabatan wajib dipilih", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/wcp/buat");
    await page.getByLabel("Periode").fill(PERIODE);
    await page.getByRole("button", { name: "Buat Sesi" }).click();

    await expect(page.getByText("Jabatan wajib dipilih")).toBeVisible();
  });

  test("validasi form: format periode harus YYYY-MM", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/wcp/buat");
    await page.getByLabel("Jabatan").selectOption({ label: JABATAN_NAMA });
    await page.getByLabel("Periode").fill("06-2025"); // format salah
    await page.getByRole("button", { name: "Buat Sesi" }).click();

    await expect(page.getByText(/format periode/i)).toBeVisible();
  });
});
