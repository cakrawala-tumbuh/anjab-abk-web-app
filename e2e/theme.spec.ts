import { test, expect } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";

test.describe("Theme toggle (admin)", () => {
  test("ThemeToggle tersedia di navigasi setelah login", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    const toggleBtn = page.getByRole("button", {
      name: /ganti ke tema (gelap|terang)/i,
    });
    await expect(toggleBtn).toBeVisible();
  });

  test("ThemeToggle mengubah ke dark mode dan menyimpan ke localStorage", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Pastikan mulai dari light mode
    await page.evaluate(() => {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    });
    await page.reload();

    const toggleBtn = page.getByRole("button", { name: /ganti ke tema gelap/i });
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Kelas .dark harus ada di <html>
    await expect(page.locator("html")).toHaveClass(/dark/);

    // localStorage harus simpan "dark"
    const stored = await page.evaluate(() => localStorage.getItem("theme"));
    expect(stored).toBe("dark");
  });

  test("ThemeToggle mengubah kembali ke light mode", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Mulai dari dark mode
    await page.evaluate(() => {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    });
    await page.reload();

    const toggleBtn = page.getByRole("button", { name: /ganti ke tema terang/i });
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    await expect(page.locator("html")).not.toHaveClass(/dark/);
    const stored = await page.evaluate(() => localStorage.getItem("theme"));
    expect(stored).toBe("light");
  });

  test("tema tersimpan di localStorage dan bertahan setelah reload", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Set ke dark via toggle
    await page.evaluate(() => {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    });
    await page.reload();

    await page.getByRole("button", { name: /ganti ke tema gelap/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Reload ulang — harus tetap dark karena flash-prevention script
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("partisipan juga punya ThemeToggle di navigasi", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    const toggleBtn = page.getByRole("button", {
      name: /ganti ke tema (gelap|terang)/i,
    });
    await expect(toggleBtn).toBeVisible();
  });
});
