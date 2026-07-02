import { expect, type Page } from "@playwright/test";

// ─── Builders master data (semua idempoten) ──────────────────────────────────
// Dipindahkan dari kuesioner.spec.ts agar dapat dipakai ulang oleh spec lain
// (mis. opm.spec.ts) tanpa duplikasi.

export const JABATAN_KODE = "E2E-KUIS-01";
export const JABATAN_NAMA = "Jabatan E2E Kuesioner";
export const JENJANG_KODE = "E2E-KUIS-JNJ";
export const JENJANG_NAMA = "Jenjang E2E Kuesioner";
export const SEKOLAH_NAMA = "Sekolah E2E Kuesioner";
// Email ini harus sama persis dengan email user part-e2e di Authentik.
// Dengan sub_mode: user_email, JWT sub = email → cocok dengan fallback get_by_subject(email).
export const PARTISIPAN_EMAIL = "partisipan@e2e.local";
export const PARTISIPAN_NAMA = "Partisipan E2E";

export async function buatJenjang(page: Page): Promise<void> {
  await page.goto("/master-data/jenjang-pendidikan");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(JENJANG_KODE)) return;
  await page.goto("/master-data/jenjang-pendidikan/tambah");
  await page.getByLabel("Kode").fill(JENJANG_KODE);
  await page.getByLabel("Nama Lengkap").fill(JENJANG_NAMA);
  await page.getByRole("button", { name: "Tambah Jenjang" }).click();
  await page.waitForURL(/\/master-data\/jenjang-pendidikan$/, { timeout: 15_000 });
}

export async function buatSekolah(page: Page): Promise<void> {
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

export async function buatJabatan(page: Page): Promise<void> {
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

export async function buatPartisipan(page: Page): Promise<void> {
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
