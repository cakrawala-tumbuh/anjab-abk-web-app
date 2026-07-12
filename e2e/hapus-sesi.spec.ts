import { test, expect } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";

/**
 * Cakupan delete analisis (Task Inventory sebagai representasi — OPM memakai
 * komponen `transisi-sesi.tsx` dengan pola identik): analisis DRAFT dapat dihapus
 * langsung (tombol "Hapus Analisis", `paksa=false`); analisis non-DRAFT hanya dapat
 * dihapus via tombol "Hapus paksa..." (selalu mengirim `paksa=true` — UI sengaja
 * tidak menawarkan tombol yang akan gagal 422, penolakan tanpa `paksa` sudah
 * dicakup test backend `test_delete_non_draft_rejected`).
 *
 * Sebelumnya file ini memakai DCS sebagai representasi, tetapi DCS/WCP tidak
 * lagi memakai sesi (diganti pola instrumen singleton — lihat CLAUDE.md revisi
 * [2026-07-12]) sehingga tombol "Hapus Analisis"/"Hapus paksa" sudah tidak ada di
 * DCS/WCP. Task Inventory dipilih sebagai representasi baru karena tidak
 * memerlukan prasyarat SME panel/Task Inventory frozen seperti OPM.
 */
test.describe.serial("Hapus Analisis Task Inventory — Alur Admin", () => {
  const PERIODE = "2025-09";

  async function jabatanKatalogPertama(
    page: Parameters<typeof loginViaAuthentik>[0],
  ): Promise<string> {
    await page.goto("/task-inventory/buat");
    await page.waitForLoadState("networkidle");
    const select = page.locator("#jabatan_id");
    await expect(select.locator("option").nth(1)).toBeAttached({ timeout: 10_000 });
    const value = await select.locator("option").nth(1).getAttribute("value");
    return value ?? "";
  }

  async function buatSesiBaru(page: Parameters<typeof loginViaAuthentik>[0]): Promise<string> {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    const jabatanId = await jabatanKatalogPertama(page);
    expect(jabatanId.length).toBeGreaterThan(0);

    await page.goto("/task-inventory/buat");
    await page.waitForLoadState("networkidle");
    await page.locator("#jabatan_id").selectOption(jabatanId);
    await page.getByLabel("Periode").fill(PERIODE);
    await page.getByRole("button", { name: "Mulai Analisis Jabatan" }).click();
    await page.waitForURL(/\/task-inventory\/tises_/, { timeout: 15_000 });
    return page.url();
  }

  test("analisis DRAFT dapat dihapus langsung", async ({ page }) => {
    await buatSesiBaru(page);

    page.once("dialog", (dialog) => dialog.accept());
    const responsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/v1/task-inventory/sesi/") && resp.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: "Hapus Analisis" }).click();
    const resp = await responsePromise;
    expect(resp.status()).toBe(204);

    await page.waitForURL(/\/task-inventory$/, { timeout: 15_000 });
  });

  test("analisis non-DRAFT tidak punya tombol hapus biasa, hanya hapus paksa (berhasil)", async ({
    page,
  }) => {
    await buatSesiBaru(page);

    // DRAFT → TAHAP1 dulu (via tombol "Mulai Tahap 1").
    const mulaiPromise = page.waitForResponse(
      (resp) => resp.url().includes("/mulai-tahap1") && resp.status() === 200,
    );
    await page.getByRole("button", { name: "Mulai Tahap 1" }).click();
    await mulaiPromise;
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Tombol "Hapus Analisis" biasa (tanpa paksa) tidak ditawarkan untuk analisis non-DRAFT.
    await expect(
      page.getByRole("button", { name: "Hapus Analisis", exact: true }),
    ).not.toBeVisible();

    // Hapus PAKSA → 204, analisis (beserta responden/seleksi/detail) hilang.
    page.once("dialog", (dialog) => dialog.accept());
    const forcedPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/api/v1/task-inventory/sesi/") && resp.request().method() === "DELETE",
    );
    await page.getByRole("button", { name: /Hapus paksa analisis ini/i }).click();
    const forced = await forcedPromise;
    expect(forced.status()).toBe(204);

    await page.waitForURL(/\/task-inventory$/, { timeout: 15_000 });
  });
});
