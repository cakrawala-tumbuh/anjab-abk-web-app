import { test, expect } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";

/**
 * Cakupan delete sesi (DCS sebagai representasi — WCP/OPM/Task Inventory memakai
 * komponen `transisi-sesi.tsx` dengan pola identik): sesi DRAFT dapat dihapus
 * langsung (tombol "Hapus Sesi", `paksa=false`); sesi non-DRAFT hanya dapat
 * dihapus via tombol "Hapus paksa..." (selalu mengirim `paksa=true` — UI sengaja
 * tidak menawarkan tombol yang akan gagal 422, penolakan tanpa `paksa` sudah
 * dicakup test backend `test_delete_non_draft_rejected`).
 */
test.describe.serial("Hapus Sesi DCS — Alur Admin", () => {
  const PERIODE = "2025-09";

  async function buatSesiBaru(page: Parameters<typeof loginViaAuthentik>[0]): Promise<string> {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/dcs/buat");
    await page.getByLabel("Periode").fill(PERIODE);
    await page.getByRole("button", { name: "Buat Sesi" }).click();
    await page.waitForURL(/\/dcs\/dses_/, { timeout: 15_000 });
    return page.url();
  }

  test("sesi DRAFT dapat dihapus langsung", async ({ page }) => {
    await buatSesiBaru(page);

    page.once("dialog", (dialog) => dialog.accept());
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/v1/dcs/sesi/") && resp.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: "Hapus Sesi" }).click();
    const resp = await responsePromise;
    expect(resp.status()).toBe(204);

    await page.waitForURL(/\/dcs$/, { timeout: 15_000 });
  });

  test("sesi OPEN tidak punya tombol hapus biasa, hanya hapus paksa (berhasil)", async ({
    page,
  }) => {
    await buatSesiBaru(page);

    // DRAFT → OPEN dulu (via tombol "Buka Sesi").
    const bukaPromise = page.waitForResponse(
      (resp) => resp.url().includes("/buka") && resp.status() === 200,
    );
    await page.getByRole("button", { name: "Buka Sesi" }).click();
    await bukaPromise;
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Tombol "Hapus Sesi" biasa (tanpa paksa) tidak ditawarkan untuk sesi non-DRAFT.
    await expect(page.getByRole("button", { name: "Hapus Sesi", exact: true })).not.toBeVisible();

    // Hapus PAKSA → 204, sesi (beserta responden/jawabannya) hilang.
    page.once("dialog", (dialog) => dialog.accept());
    const forcedPromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/v1/dcs/sesi/") && resp.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: /Hapus paksa sesi ini/i }).click();
    const forced = await forcedPromise;
    expect(forced.status()).toBe(204);

    await page.waitForURL(/\/dcs$/, { timeout: 15_000 });
  });
});
