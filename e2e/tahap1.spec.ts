import { test, expect, type Page } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";

// ─── Konstanta data uji ──────────────────────────────────────────────────────
// Periode khas agar sesi Task Inventory mudah diidentifikasi & idempoten.
const PERIODE = "2031-03";
const RESPONDEN_NAMA = "Responden Cascade E2E";

/**
 * Buat (atau gunakan ulang) sesi Task Inventory untuk PERIODE memakai jabatan
 * ber-catalog hasil seed, lalu kembalikan halaman pada detail sesi tsb.
 */
async function bukaAtauBuatSesi(page: Page): Promise<void> {
  await page.goto("/task-inventory");
  await page.waitForLoadState("networkidle");

  const row = page.getByRole("row").filter({ hasText: PERIODE });
  if (
    await row
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false)
  ) {
    await row.first().getByRole("link").first().click();
    await page.waitForURL(/\/task-inventory\/tises_/, { timeout: 15_000 });
  } else {
    await page.goto("/task-inventory/buat");
    await page.waitForLoadState("networkidle");
    // Unit konkret (opsi index 1; index 0 = "Semua unit") → jabatan ber-catalog.
    await page.locator("#unit").selectOption({ index: 1 });
    await expect(page.locator("#jabatan_id option").nth(1)).toBeAttached({ timeout: 10_000 });
    await page.locator("#jabatan_id").selectOption({ index: 1 });
    await page.getByLabel("Periode").fill(PERIODE);
    await page.getByRole("button", { name: "Mulai Analisis Jabatan" }).click();
    await page.waitForURL(/\/task-inventory\/tises_/, { timeout: 15_000 });
  }
  await page.waitForLoadState("networkidle");
}

// ─── Tahap 1 — Seleksi relevansi bertingkat (cascade) ────────────────────────
//
// Alur diuji sebagai admin end-to-end pada satu sesi: daftarkan responden →
// mulai Tahap 1 → isi seleksi relevansi tiga tingkat (Tugas Pokok → Detil Tugas →
// Uraian Tugas). Memakai jabatan ber-catalog hasil seed, sehingga tidak perlu
// menyiapkan master data tambahan.

test.describe.serial("Task Inventory — Tahap 1 Cascade", () => {
  test("admin: daftarkan responden, mulai Tahap 1, lalu isi seleksi cascade", async ({ page }) => {
    test.setTimeout(120_000);
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await bukaAtauBuatSesi(page);

    // 1. Daftarkan responden (anonim) bila belum ada. Form tampil di DRAFT/TAHAP1.
    const respRow = page.locator("tbody tr").filter({ hasText: RESPONDEN_NAMA }).first();
    if (!(await respRow.isVisible({ timeout: 2_000 }).catch(() => false))) {
      const tambahResp = page.waitForResponse(
        (r) => r.url().endsWith("/responden") && r.request().method() === "POST",
        { timeout: 15_000 },
      );
      await page.locator("#resp-nama").fill(RESPONDEN_NAMA);
      await page.getByRole("button", { name: "+ Daftarkan" }).click();
      await tambahResp;
      // Reload deterministik: pastikan tabel responden ter-render dari server.
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(respRow).toBeVisible({ timeout: 10_000 });
    }

    // 2. Mulai Tahap 1 bila masih DRAFT.
    const mulai1 = page.getByRole("button", { name: "Mulai Tahap 1" });
    if (await mulai1.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const transisi = page.waitForResponse(
        (r) => r.url().includes("/mulai-tahap1") && r.request().method() === "POST",
        { timeout: 15_000 },
      );
      await mulai1.click();
      await transisi;
      // Reload deterministik: link "Isi Tahap 1" per responden muncul saat TAHAP1.
      await page.reload();
      await page.waitForLoadState("networkidle");
    }

    // 3. Buka cascade untuk responden tsb. Idempoten: bila sudah submit pada run
    //    sebelumnya, link "Isi Tahap 1" tak ada → verifikasi & selesai.
    const isiLink = respRow.getByRole("link", { name: "Isi Tahap 1" });
    if (!(await isiLink.isVisible({ timeout: 3_000 }).catch(() => false))) {
      await expect(respRow).toBeVisible();
      return;
    }
    await isiLink.click();
    await page.waitForURL(/\/task-inventory\/tahap1\//, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    // ── Level 1: Tugas Pokok ──────────────────────────────────────────────
    await expect(page.getByText("Langkah 1 dari 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Lanjut ke Detil Tugas" })).toBeVisible();
    // Tombol level berikutnya belum muncul (progressive disclosure).
    await expect(page.getByRole("button", { name: "Lanjut ke Uraian Tugas" })).toHaveCount(0);
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Lanjut ke Detil Tugas" }).click();

    // ── Level 2: Detil Tugas ──────────────────────────────────────────────
    await expect(page.getByText("Langkah 2 dari 3")).toBeVisible();
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Lanjut ke Uraian Tugas" }).click();

    // ── Level 3: Uraian Tugas ─────────────────────────────────────────────
    await expect(page.getByText("Langkah 3 dari 3")).toBeVisible();
    await page.getByRole("checkbox").first().check();

    const seleksiResp = page.waitForResponse(
      (r) => r.url().includes("/seleksi") && r.request().method() === "POST",
      { timeout: 15_000 },
    );
    // Tombol Simpan/Kirim Seleksi muncul di atas & bawah daftar (duplikat) — pakai yang pertama.
    await page.getByRole("button", { name: "Kirim Seleksi" }).first().click();
    const resp = await seleksiResp;
    expect(resp.status()).toBe(201);

    // 4. Setelah submit, kembali ke detail sesi: responden tak lagi punya link
    //    "Isi Tahap 1" (sudah submit Tahap 1).
    await page.waitForURL(/\/task-inventory\/tises_/, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");
    const respRowAfter = page.locator("tbody tr").filter({ hasText: RESPONDEN_NAMA }).first();
    await expect(respRowAfter).toBeVisible({ timeout: 10_000 });
    await expect(respRowAfter.getByRole("link", { name: "Isi Tahap 1" })).toHaveCount(0);
  });
});
