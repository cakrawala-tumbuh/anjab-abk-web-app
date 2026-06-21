/**
 * Seed master data untuk tes manual.
 * Jalankan sekali: npx playwright test seed.spec.ts --reporter=list
 * Semua operasi idempoten — aman dijalankan berulang.
 */
import { test, expect, type Page } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";

const JENJANG = [
  { kode: "SD", nama: "Sekolah Dasar" },
  { kode: "SMP", nama: "Sekolah Menengah Pertama" },
  { kode: "SMA", nama: "Sekolah Menengah Atas" },
];

const SEKOLAH = [
  { nama: "SD Islam Terpadu Al-Amin", jenjangLabel: "SD — Sekolah Dasar" },
  { nama: "SMP Islam Terpadu Al-Amin", jenjangLabel: "SMP — Sekolah Menengah Pertama" },
  { nama: "SMA Islam Terpadu Al-Amin", jenjangLabel: "SMA — Sekolah Menengah Atas" },
];

const JABATAN = [
  { kode: "KS", nama: "Kepala Sekolah", jenis: "struktural" },
  { kode: "WAKUR", nama: "Wakil Kepala Sekolah Bid. Kurikulum", jenis: "struktural" },
  { kode: "GBK", nama: "Guru Bimbingan Konseling", jenis: "fungsional" },
  { kode: "GURU-MP", nama: "Guru Mata Pelajaran", jenis: "fungsional" },
  { kode: "TU", nama: "Staf Tata Usaha", jenis: "fungsional" },
  { kode: "PERPUS", nama: "Pustakawan", jenis: "fungsional" },
];

const PARTISIPAN = [
  {
    nama: "Budi Santoso",
    email: "budi.santoso@alamin.sch.id",
    sekolah: "SMA Islam Terpadu Al-Amin",
    jabatan: "Kepala Sekolah",
    masaKerja: "12",
  },
  {
    nama: "Siti Rahayu",
    email: "siti.rahayu@alamin.sch.id",
    sekolah: "SMA Islam Terpadu Al-Amin",
    jabatan: "Wakil Kepala Sekolah Bid. Kurikulum",
    masaKerja: "8",
  },
  {
    nama: "Ahmad Fauzi",
    email: "ahmad.fauzi@alamin.sch.id",
    sekolah: "SMA Islam Terpadu Al-Amin",
    jabatan: "Guru Mata Pelajaran",
    masaKerja: "6",
  },
  {
    nama: "Dewi Lestari",
    email: "dewi.lestari@alamin.sch.id",
    sekolah: "SMP Islam Terpadu Al-Amin",
    jabatan: "Guru Mata Pelajaran",
    masaKerja: "4",
  },
  {
    nama: "Hendra Wijaya",
    email: "hendra.wijaya@alamin.sch.id",
    sekolah: "SMP Islam Terpadu Al-Amin",
    jabatan: "Staf Tata Usaha",
    masaKerja: "3",
  },
  {
    nama: "Rina Kusuma",
    email: "rina.kusuma@alamin.sch.id",
    sekolah: "SD Islam Terpadu Al-Amin",
    jabatan: "Kepala Sekolah",
    masaKerja: "10",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function buatJenjang(page: Page, kode: string, nama: string): Promise<void> {
  await page.goto("/master-data/jenjang-pendidikan");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(kode)) {
    console.log(`  [skip] jenjang ${kode} sudah ada`);
    return;
  }
  await page.goto("/master-data/jenjang-pendidikan/tambah");
  await page.getByLabel("Kode").fill(kode);
  await page.getByLabel("Nama Lengkap").fill(nama);
  await page.getByRole("button", { name: "Tambah Jenjang" }).click();
  await page.waitForURL(/\/master-data\/jenjang-pendidikan$/, { timeout: 10_000 });
  console.log(`  [ok] jenjang ${kode} — ${nama}`);
}

async function buatSekolah(page: Page, nama: string, jenjangLabel: string): Promise<void> {
  await page.goto("/master-data/sekolah");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(nama)) {
    console.log(`  [skip] sekolah "${nama}" sudah ada`);
    return;
  }
  await page.goto("/master-data/sekolah/tambah");
  await page.getByLabel("Nama Sekolah").fill(nama);
  await page.getByLabel("Jenjang Pendidikan").selectOption({ label: jenjangLabel });
  await page.getByRole("button", { name: "Tambah Sekolah" }).click();
  await page.waitForURL(/\/master-data\/sekolah$/, { timeout: 10_000 });
  console.log(`  [ok] sekolah "${nama}"`);
}

async function buatJabatan(page: Page, kode: string, nama: string, jenis: string): Promise<void> {
  await page.goto("/master-data/jabatan");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(kode)) {
    console.log(`  [skip] jabatan ${kode} sudah ada`);
    return;
  }
  await page.goto("/master-data/jabatan/tambah");
  await page.getByLabel("Kode").fill(kode);
  await page.getByLabel("Nama Jabatan").fill(nama);
  await page.getByLabel("Jenis Jabatan").selectOption(jenis);
  await page.getByRole("button", { name: "Tambah Jabatan" }).click();
  await page.waitForURL(/\/master-data\/jabatan$/, { timeout: 10_000 });
  console.log(`  [ok] jabatan ${kode} — ${nama}`);
}

async function buatPartisipan(
  page: Page,
  nama: string,
  email: string,
  sekolah: string,
  jabatan: string,
  masaKerja: string,
): Promise<void> {
  await page.goto("/partisipan");
  await page.waitForLoadState("networkidle");
  if ((await page.content()).includes(nama)) {
    console.log(`  [skip] partisipan "${nama}" sudah ada`);
    return;
  }
  await page.goto("/partisipan/tambah");
  await page.getByLabel("Nama Lengkap").fill(nama);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Satuan Pendidikan").selectOption({ label: sekolah });
  await page.getByLabel("Jabatan Utama").selectOption({ label: jabatan });
  await page.getByLabel("Masa Kerja (Tahun)").fill(masaKerja);
  await page.getByRole("button", { name: "Tambah Partisipan" }).click();
  await page.waitForURL(/\/partisipan$/, { timeout: 10_000 });
  console.log(`  [ok] partisipan "${nama}" <${email}>`);
}

// ─── Test ────────────────────────────────────────────────────────────────────

test("seed master data untuk tes manual", async ({ page }) => {
  await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

  console.log("\n=== Jenjang Pendidikan ===");
  for (const j of JENJANG) {
    await buatJenjang(page, j.kode, j.nama);
  }

  console.log("\n=== Sekolah ===");
  for (const s of SEKOLAH) {
    await buatSekolah(page, s.nama, s.jenjangLabel);
  }

  console.log("\n=== Jabatan ===");
  for (const j of JABATAN) {
    await buatJabatan(page, j.kode, j.nama, j.jenis);
  }

  console.log("\n=== Partisipan ===");
  for (const p of PARTISIPAN) {
    await buatPartisipan(page, p.nama, p.email, p.sekolah, p.jabatan, p.masaKerja);
  }

  // Verifikasi akhir
  await page.goto("/partisipan");
  await page.waitForLoadState("networkidle");
  for (const p of PARTISIPAN) {
    const visible = await page
      .getByText(p.nama)
      .isVisible()
      .catch(() => false);
    if (!visible) console.warn(`  [WARN] "${p.nama}" tidak terlihat di daftar`);
  }

  console.log("\n✓ Seed selesai");
  await expect(page.getByRole("heading")).toBeVisible();
});
