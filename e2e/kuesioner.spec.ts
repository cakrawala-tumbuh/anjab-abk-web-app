import { test, expect, type Page } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";

// Konstanta data uji — dipakai bersama seluruh describe block
const JABATAN_KODE = "E2E-KUIS-01";
const JABATAN_NAMA = "Jabatan E2E Kuesioner";
const JENJANG_KODE = "E2E-KUIS-JNJ";
const JENJANG_NAMA = "Jenjang E2E Kuesioner";
const SEKOLAH_NAMA = "Sekolah E2E Kuesioner";
const PERIODE = "2026-06";
// Email ini harus sama persis dengan email user part-e2e di Authentik.
// Dengan sub_mode: user_email, JWT sub = email → cocok dengan fallback get_by_subject(email).
const PARTISIPAN_EMAIL = "partisipan@e2e.local";
const PARTISIPAN_NAMA = "Partisipan E2E";

// ─── Setup helpers (semua idempoten) ─────────────────────────────────────────

async function buatJenjang(page: Page): Promise<void> {
  await page.goto("/master-data/jenjang-pendidikan");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(JENJANG_KODE)) return;
  await page.goto("/master-data/jenjang-pendidikan/tambah");
  await page.getByLabel("Kode").fill(JENJANG_KODE);
  await page.getByLabel("Nama Lengkap").fill(JENJANG_NAMA);
  await page.getByRole("button", { name: "Tambah Jenjang" }).click();
  await page.waitForURL(/\/master-data\/jenjang-pendidikan$/, { timeout: 15_000 });
}

async function buatSekolah(page: Page): Promise<void> {
  await page.goto("/master-data/sekolah");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(SEKOLAH_NAMA)) return;
  await page.goto("/master-data/sekolah/tambah");
  await page.getByLabel("Nama Sekolah").fill(SEKOLAH_NAMA);
  const jenjangSelect = page.getByLabel("Jenjang Pendidikan");
  // Tunggu hingga minimal 1 opsi jenjang ter-load (async fetch) sebelum selectOption
  await expect(jenjangSelect.locator("option").nth(1)).toBeAttached({ timeout: 10_000 });
  await jenjangSelect.selectOption({ label: `${JENJANG_KODE} — ${JENJANG_NAMA}` });
  await page.getByRole("button", { name: "Tambah Sekolah" }).click();
  await page.waitForURL(/\/master-data\/sekolah$/, { timeout: 15_000 });
}

async function buatJabatan(page: Page): Promise<void> {
  await page.goto("/master-data/jabatan");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(JABATAN_KODE)) return;
  await page.goto("/master-data/jabatan/tambah");
  await page.getByLabel("Kode").fill(JABATAN_KODE);
  await page.getByLabel("Nama Jabatan").fill(JABATAN_NAMA);
  await page.getByLabel("Jenis Jabatan").selectOption("fungsional");
  await page.getByRole("button", { name: "Tambah Jabatan" }).click();
  await page.waitForURL(/\/master-data\/jabatan$/, { timeout: 15_000 });
}

async function buatPartisipan(page: Page): Promise<void> {
  await page.goto("/partisipan");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(PARTISIPAN_NAMA)) return;
  await page.goto("/partisipan/tambah");
  await page.getByLabel("Nama Lengkap").fill(PARTISIPAN_NAMA);
  await page.getByLabel("Email").fill(PARTISIPAN_EMAIL);
  await page.getByLabel("Satuan Pendidikan").selectOption({ label: SEKOLAH_NAMA });
  await page.getByLabel("Jabatan Utama").selectOption({ label: JABATAN_NAMA });
  await page.getByLabel("Masa Kerja (Tahun)").fill("5");
  await page.getByRole("button", { name: "Tambah Partisipan" }).click();
  await page.waitForURL(/\/partisipan$/, { timeout: 15_000 });
}

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

    // Kirim jawaban
    await page.getByRole("button", { name: "Kirim Jawaban" }).click();
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
