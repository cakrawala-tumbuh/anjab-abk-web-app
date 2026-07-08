import { test, expect, type Page } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";
import {
  buatJenjang,
  buatSekolah,
  buatJabatan,
  buatPartisipan,
  JABATAN_NAMA,
  PARTISIPAN_NAMA,
} from "./builders";

// Konstanta data uji — dipakai bersama seluruh describe block
const PERIODE = "2026-06";

/** Buat sesi DCS, buka ke status OPEN, kembalikan sesi_id dari URL. */
async function buatDcsSesiOpen(page: Page): Promise<string> {
  await page.goto("/dcs");
  await page.waitForLoadState("networkidle");

  // Jika sudah ada sesi untuk periode ini, cukup pastikan statusnya OPEN
  // Link teks = catatan ?? periode; tanpa catatan, teks = PERIODE
  const existingLink = page.getByRole("link", { name: PERIODE }).first();
  if (await existingLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await existingLink.click();
    await page.waitForURL(/\/dcs\/dses_/);
    await page.waitForLoadState("networkidle");
    const openBtn = page.getByRole("button", { name: "Buka Sesi" });
    if (await openBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const resp = page.waitForResponse((r) => r.url().includes("/buka") && r.status() === 200, {
        timeout: 10_000,
      });
      await openBtn.click();
      await resp;
      await page.reload();
      await page.waitForLoadState("networkidle");
    }
    return page.url().split("/dcs/")[1];
  }

  // Buat sesi baru
  await page.goto("/dcs/buat");
  await page.getByLabel("Periode").fill(PERIODE);
  await page.getByRole("button", { name: "Buat Sesi" }).click();
  await page.waitForURL(/\/dcs\/dses_/, { timeout: 15_000 });

  // Buka sesi: DRAFT → OPEN
  const resp = page.waitForResponse((r) => r.url().includes("/buka") && r.status() === 200, {
    timeout: 10_000,
  });
  await page.getByRole("button", { name: "Buka Sesi" }).click();
  await resp;
  await page.reload();
  await page.waitForLoadState("networkidle");

  return page.url().split("/dcs/")[1];
}

/** Tambah responden ke sesi DCS, linked ke PARTISIPAN_NAMA (idempoten). */
async function tambahRespondenPartisipan(page: Page, sesiId: string): Promise<void> {
  await page.goto(`/dcs/${sesiId}`);
  await page.waitForLoadState("networkidle");
  const inList = await page
    .locator("tbody")
    .getByText(PARTISIPAN_NAMA)
    .isVisible()
    .catch(() => false);
  if (inList) return;

  await page
    .locator("#partisipan_select")
    .selectOption({ label: `${PARTISIPAN_NAMA} — ${JABATAN_NAMA}` });
  // Tunggu auto-fill nama & jabatan_label
  await expect(page.locator("#resp-jabatan")).not.toHaveValue("", { timeout: 3_000 });

  await page.getByRole("button", { name: "+ Daftarkan" }).click();
  await expect(page.locator("tbody").getByText(PARTISIPAN_NAMA)).toBeVisible({ timeout: 10_000 });
}

// ─── Kuesioner DCS — alur partisipan ─────────────────────────────────────────

test.describe.serial("Kuesioner DCS — Alur Partisipan", () => {
  test("admin menyiapkan sesi DCS terbuka dan mendaftarkan partisipan", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Prasyarat master data (semua idempoten)
    await buatJenjang(page);
    await buatSekolah(page);
    await buatJabatan(page);
    await buatPartisipan(page);

    // Buat sesi DCS OPEN dan tambahkan responden
    const sesiId = await buatDcsSesiOpen(page);
    await tambahRespondenPartisipan(page, sesiId);
  });

  test("partisipan melihat kuesioner DCS di halaman /kuesioner", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/kuesioner");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Kuesioner Saya" })).toBeVisible();
    await expect(page.getByText("DCS — Demand-Control-Support")).toBeVisible();
    await expect(page.getByText(JABATAN_NAMA)).toBeVisible();
    // Status bisa "Belum diisi" (run pertama) atau "Sudah diisi" (run berikutnya — idempoten)
    await expect(
      page.getByText("Belum diisi", { exact: true }).or(page.getByText("Sudah diisi")),
    ).toBeVisible();
    await expect(
      page
        .getByRole("link", { name: "Isi Sekarang" })
        .or(page.getByRole("link", { name: "Lihat Jawaban" })),
    ).toBeVisible();
  });

  test("partisipan menyimpan draft sebagian jawaban lalu melanjutkan", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/kuesioner");
    await page.waitForLoadState("networkidle");

    // Idempoten — jika sudah submit final sebelumnya, skenario draft tidak relevan lagi.
    if ((await page.content()).includes("Sudah diisi")) return;

    await page.getByRole("link", { name: "Isi Sekarang" }).click();
    await page.waitForURL(/\/dcs\/isi\//, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    // Isi 10 item pertama saja, lalu Simpan (draft — belum submit final).
    const radios = page.locator('input[type="radio"][value="3"]');
    for (let i = 0; i < 10; i++) {
      await radios.nth(i).evaluate((el) => (el as HTMLInputElement).click());
    }
    const saveResp = page.waitForResponse(
      (r) => r.request().method() === "PUT" && r.url().includes("/jawaban") && r.status() === 200,
      { timeout: 10_000 },
    );
    await page.getByRole("button", { name: "Simpan" }).first().click();
    await saveResp;
    await expect(page.getByText("Draft tersimpan.")).toBeVisible();

    // Reload — jawaban sebagian harus tetap terisi (prefill dari draft tersimpan di server).
    await page.reload();
    await page.waitForLoadState("networkidle");
    const checkedAfterReload = page.locator('input[type="radio"]:checked');
    await expect(checkedAfterReload).toHaveCount(10);
  });

  test("partisipan mengisi dan mengirim seluruh item DCS", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/kuesioner");
    await page.waitForLoadState("networkidle");

    // Idempoten — jika sudah diisi sebelumnya (run ulang), lewati
    if ((await page.content()).includes("Sudah diisi")) return;

    // Masuk ke halaman isi kuesioner
    await page.getByRole("link", { name: "Isi Sekarang" }).click();
    await page.waitForURL(/\/dcs\/isi\//, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    // Verifikasi semua subskala dimuat (3 subskala: DEMAND, CONTROL, SUPPORT)
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(3);

    // Isi semua 42 item — klik nilai "3 — Ragu-ragu" untuk setiap item
    // Radio hidden (sr-only), klik via evaluate agar force-triggered di React
    const radios = page.locator('input[type="radio"][value="3"]');
    const total = await radios.count();
    expect(total).toBe(42);
    for (let i = 0; i < total; i++) {
      await radios.nth(i).evaluate((el) => (el as HTMLInputElement).click());
    }

    // Progress bar harus menunjukkan 42/42 sebelum submit
    await expect(page.getByText("42 / 42 pernyataan dijawab")).toBeVisible();

    // Kirim jawaban — tombol muncul di atas & bawah form (duplikat), pakai yang pertama.
    await page.getByRole("button", { name: "Kirim Jawaban" }).first().click();
    await expect(page.getByText("Jawaban berhasil dikirim!")).toBeVisible({ timeout: 15_000 });
  });

  test("partisipan melihat status 'Sudah diisi' setelah submit", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/kuesioner");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Sudah diisi")).toBeVisible();
    await expect(page.getByRole("link", { name: "Lihat Jawaban" })).toBeVisible();
    // Tombol "Isi Sekarang" tidak lagi muncul
    await expect(page.getByRole("link", { name: "Isi Sekarang" })).not.toBeVisible();
  });

  test("partisipan melihat jawaban read-only setelah submit", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/kuesioner");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: "Lihat Jawaban" }).click();
    await page.waitForURL(/\/dcs\/isi\//, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    // Banner "sudah diisi"
    await expect(page.getByText(/Kuesioner sudah diisi pada/)).toBeVisible();
    // Tombol kirim tidak ada di mode read-only
    await expect(page.getByRole("button", { name: "Kirim Jawaban" })).not.toBeVisible();
    // Radio jawaban tetap terisi (42 radio dengan value="3" harus checked)
    const checkedRadios = page.locator('input[type="radio"]:checked');
    await expect(checkedRadios).toHaveCount(42);
  });
});
