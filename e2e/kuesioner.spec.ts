import { test, expect, type Page } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";
import { buatJenjang, buatSekolah, buatJabatan, buatPartisipan, PARTISIPAN_NAMA } from "./builders";

/**
 * DCS adalah instrumen singleton (bukan lagi berbasis sesi — lihat CLAUDE.md
 * revisi [2026-07-12]): satu baris instrumen tetap dengan status
 * OPEN|CLOSED|ANALYZED, tanpa periode/max_responden. Admin menugaskan
 * (assign) responden langsung dari `/dcs`, bukan lewat "buat sesi".
 */

/** Pastikan instrumen DCS berstatus OPEN (buka ulang bila sedang CLOSED). */
async function ensureDcsOpen(page: Page): Promise<void> {
  await page.goto("/dcs");
  await page.waitForLoadState("networkidle");

  const bukaUlangBtn = page.getByRole("button", { name: "Buka Ulang" });
  if (await bukaUlangBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    const resp = page.waitForResponse(
      (r) => r.url().includes("/buka-ulang") && r.status() === 200,
      { timeout: 10_000 },
    );
    await bukaUlangBtn.click();
    await resp;
    await page.reload();
    await page.waitForLoadState("networkidle");
  }
}

/** Tugaskan PARTISIPAN_NAMA sebagai responden DCS lewat form assign multi-select (idempoten). */
async function assignPartisipanDcs(page: Page): Promise<void> {
  await ensureDcsOpen(page);

  const inList = await page
    .locator("tbody")
    .getByText(PARTISIPAN_NAMA)
    .isVisible()
    .catch(() => false);
  if (inList) return;

  const optionLabel = page.locator("label").filter({ hasText: PARTISIPAN_NAMA });
  await optionLabel.locator('input[type="checkbox"]').check();

  const assignResp = page.waitForResponse(
    (r) => r.url().endsWith("/api/v1/dcs/responden") && r.request().method() === "POST",
    { timeout: 15_000 },
  );
  await page.getByRole("button", { name: /Tugaskan Terpilih/ }).click();
  const resp = await assignResp;
  expect(resp.status()).toBe(201);
  // router.refresh() bisa lebih lambat dari re-render; reload penuh memastikan
  // tabel responden konsisten dengan state server (hindari race seperti pola
  // transisi status di spec lain).
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("tbody").getByText(PARTISIPAN_NAMA)).toBeVisible({ timeout: 10_000 });
}

// ─── Kuesioner DCS — alur partisipan ─────────────────────────────────────────

test.describe.serial("Kuesioner DCS — Alur Partisipan", () => {
  test("admin menugaskan partisipan sebagai responden DCS", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Prasyarat master data (semua idempoten)
    await buatJenjang(page);
    await buatSekolah(page);
    await buatJabatan(page);
    await buatPartisipan(page);

    await assignPartisipanDcs(page);
  });

  test("partisipan melihat kuesioner DCS di halaman /kuesioner", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/kuesioner");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Kuesioner Saya" })).toBeVisible();
    // Scope ke section DCS — halaman /kuesioner juga bisa menampilkan OPM/TI/WCP
    // untuk partisipan yang sama, yang juga memakai teks "Belum diisi"/"Sudah diisi".
    const dcsSection = page.locator("section").filter({ hasText: "DCS — Demand-Control-Support" });
    await expect(dcsSection).toBeVisible();
    // Status bisa "Belum diisi" (run pertama) atau "Sudah diisi" (run berikutnya — idempoten)
    await expect(
      dcsSection.getByText("Belum diisi", { exact: true }).or(dcsSection.getByText("Sudah diisi")),
    ).toBeVisible();
    await expect(
      dcsSection
        .getByRole("link", { name: "Isi Sekarang" })
        .or(dcsSection.getByRole("link", { name: "Lihat Jawaban" })),
    ).toBeVisible();
  });

  test("partisipan menyimpan draft sebagian jawaban lalu melanjutkan", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/kuesioner");
    await page.waitForLoadState("networkidle");

    const dcsSection = page.locator("section").filter({ hasText: "DCS — Demand-Control-Support" });
    // Idempoten — jika sudah submit final sebelumnya, skenario draft tidak relevan lagi.
    if (
      await dcsSection
        .getByText("Sudah diisi")
        .isVisible()
        .catch(() => false)
    )
      return;

    await dcsSection.getByRole("link", { name: "Isi Sekarang" }).click();
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

    const dcsSection = page.locator("section").filter({ hasText: "DCS — Demand-Control-Support" });
    // Idempoten — jika sudah diisi sebelumnya (run ulang), lewati
    if (
      await dcsSection
        .getByText("Sudah diisi")
        .isVisible()
        .catch(() => false)
    )
      return;

    // Masuk ke halaman isi kuesioner
    await dcsSection.getByRole("link", { name: "Isi Sekarang" }).click();
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

    // Progress bar harus menunjukkan 42/42 sebelum submit (teks muncul dua kali —
    // sticky bar atas & bawah — pakai .first() seperti tombol Kirim Jawaban di bawah).
    await expect(page.getByText("42 / 42 pernyataan dijawab").first()).toBeVisible();

    // Kirim jawaban — tombol muncul di atas & bawah form (duplikat), pakai yang pertama.
    await page.getByRole("button", { name: "Kirim Jawaban" }).first().click();
    await expect(page.getByText("Jawaban berhasil dikirim!")).toBeVisible({ timeout: 15_000 });
  });

  test("partisipan melihat status 'Sudah diisi' setelah submit", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/kuesioner");
    await page.waitForLoadState("networkidle");

    const dcsSection = page.locator("section").filter({ hasText: "DCS — Demand-Control-Support" });
    await expect(dcsSection.getByText("Sudah diisi")).toBeVisible();
    await expect(dcsSection.getByRole("link", { name: "Lihat Jawaban" })).toBeVisible();
    // Tombol "Isi Sekarang" tidak lagi muncul
    await expect(dcsSection.getByRole("link", { name: "Isi Sekarang" })).not.toBeVisible();
  });

  test("partisipan melihat jawaban read-only setelah submit", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/kuesioner");
    await page.waitForLoadState("networkidle");

    const dcsSection = page.locator("section").filter({ hasText: "DCS — Demand-Control-Support" });
    await dcsSection.getByRole("link", { name: "Lihat Jawaban" }).click();
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
