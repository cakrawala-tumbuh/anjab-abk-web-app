import { test, expect } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";

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
  // Tunggu sampai 3 detik agar Client Component selesai hydrate.
  // Jika button tidak muncul, sesi sudah dalam status target — lewati.
  let visible = false;
  try {
    await btn.waitFor({ state: "visible", timeout: 3_000 });
    visible = true;
  } catch {
    // Button tidak ada — sudah dalam status target
  }
  if (!visible) return;

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
  const PERIODE = "2025-06";

  test("buat sesi DCS baru dan verifikasi status DRAFT", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Cek apakah sesi sudah ada (idempoten — backend in-memory persists antar run)
    // Link teks = catatan ?? periode; tanpa catatan, teks = PERIODE
    await page.goto("/dcs");
    await page.waitForLoadState("networkidle");
    const sesiLink = page.getByRole("link", { name: PERIODE }).first();
    if (await sesiLink.isVisible()) {
      await sesiLink.click();
      await page.waitForURL(/\/dcs\/dses_/);
      // Sesi sudah ada dalam status apapun — cukup verifikasi ada
      await expect(page.getByText(/Draft|Terbuka|Tertutup|Teranalisis/)).toBeVisible();
      return;
    }

    await page.goto("/dcs/buat");

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
    await page.getByRole("link", { name: PERIODE }).first().click();
    await page.waitForURL(/\/dcs\/dses_/);
    await page.waitForLoadState("networkidle");

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

  test("sesi DCS muncul di daftar dengan periode", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/dcs");

    // Periode tampil sebagai teks link di kolom Keterangan (catatan null → fallback ke periode)
    await expect(page.getByRole("link", { name: PERIODE })).toBeVisible();
  });

  test("validasi form: format periode harus YYYY-MM", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/dcs/buat");
    await page.getByLabel("Periode").fill("06-2025"); // format salah
    await page.getByRole("button", { name: "Buat Sesi" }).click();

    await expect(page.getByText(/format periode/i)).toBeVisible();
  });
});

// ─── Sesi WCP ────────────────────────────────────────────────────────────────

test.describe.serial("Sesi WCP — Alur Admin", () => {
  const PERIODE = "2025-06";

  test("buat sesi WCP baru dan verifikasi status DRAFT", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Cek apakah sesi sudah ada (idempoten)
    await page.goto("/wcp");
    await page.waitForLoadState("networkidle");
    const sesiLink = page.getByRole("link", { name: PERIODE }).first();
    if (await sesiLink.isVisible()) {
      await sesiLink.click();
      await page.waitForURL(/\/wcp\/wses_/);
      await expect(page.getByText(/Draft|Terbuka|Tertutup|Teranalisis/)).toBeVisible();
      return;
    }

    await page.goto("/wcp/buat");

    await page.getByLabel("Periode").fill(PERIODE);

    await page.getByRole("button", { name: "Buat Sesi" }).click();

    await page.waitForURL(/\/wcp\/wses_/, { timeout: 15_000 });

    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buka Sesi" })).toBeVisible();
  });

  test("transisi sesi WCP: DRAFT → OPEN → CLOSED", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/wcp");
    await page.getByRole("link", { name: PERIODE }).first().click();
    await page.waitForURL(/\/wcp\/wses_/);
    await page.waitForLoadState("networkidle");

    // Buka sesi: DRAFT → OPEN (idempoten)
    await doTransisi(page, "Buka Sesi", "/buka");

    // Tutup sesi: OPEN → CLOSED (idempoten)
    await doTransisi(page, "Tutup Sesi", "/tutup");

    await expect(page.getByText("Tertutup", { exact: true })).toBeVisible({ timeout: 5_000 });

    await expect(page.getByRole("button", { name: "Buka Sesi" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Tutup Sesi" })).not.toBeVisible();
  });

  test("sesi WCP muncul di daftar dengan periode", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/wcp");

    // Periode tampil sebagai teks link di kolom Keterangan (catatan null → fallback ke periode)
    await expect(page.getByRole("link", { name: PERIODE })).toBeVisible();
  });

  test("validasi form: format periode harus YYYY-MM", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await page.goto("/wcp/buat");
    await page.getByLabel("Periode").fill("06-2025"); // format salah
    await page.getByRole("button", { name: "Buat Sesi" }).click();

    await expect(page.getByText(/format periode/i)).toBeVisible();
  });
});
