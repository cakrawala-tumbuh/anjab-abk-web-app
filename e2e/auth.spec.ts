import { test, expect } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";

test.describe("Alur Login OIDC (Authentik)", () => {
  test("redirect ke Authentik saat belum login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/:9300/, { timeout: 15_000 });
  });

  test("admin dapat login dan melihat dashboard admin", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    // Kartu "Kelola Partisipan" hanya muncul untuk grup admin
    await expect(page.getByRole("link", { name: /kelola partisipan/i })).toBeVisible();
  });

  test("partisipan dapat login dan melihat dashboard partisipan", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    // Kartu "Kuesioner Saya" hanya muncul untuk grup partisipan
    await expect(page.getByText(/kuesioner saya/i)).toBeVisible();
  });
});
