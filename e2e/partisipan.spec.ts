import { test, expect } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";

test.describe("Partisipan — Navigasi", () => {
  test("admin dapat mengakses halaman daftar partisipan", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/partisipan");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Partisipan" })).toBeVisible();
    await expect(page.getByRole("link", { name: "+ Tambah Partisipan" })).toBeVisible();
  });

  test("admin dapat mengakses form tambah partisipan", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/partisipan/tambah");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: "Tambah Partisipan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tambah Partisipan" })).toBeVisible();
  });

  test("partisipan tidak dapat mengakses halaman manajemen partisipan", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/partisipan");
    await page.waitForLoadState("networkidle");
    // Admin-only page mengembalikan 404 untuk non-admin
    await expect(page.getByText("404 — Halaman tidak ditemukan")).toBeVisible();
  });
});

test.describe("Partisipan — Validasi Form", () => {
  test("validasi: nama, email, sekolah, jabatan, dan masa kerja wajib", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/partisipan/tambah");
    await page.waitForLoadState("networkidle");

    // Submit form kosong
    await page.getByRole("button", { name: "Tambah Partisipan" }).click();

    await expect(page.getByText("Nama wajib diisi")).toBeVisible();
    await expect(page.getByText("Sekolah wajib dipilih")).toBeVisible();
    await expect(page.getByText("Jabatan utama wajib dipilih")).toBeVisible();
    await expect(page.getByText("Isi angka tahun")).toBeVisible();
  });

  test("validasi: format email tidak valid", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await page.goto("/partisipan/tambah");
    await page.waitForLoadState("networkidle");

    await page.getByLabel("Nama Lengkap").fill("Test Partisipan");
    await page.getByLabel("Email").fill("bukan-email-valid");
    await page.getByRole("button", { name: "Tambah Partisipan" }).click();

    await expect(page.getByText("Format email tidak valid")).toBeVisible();
  });
});
