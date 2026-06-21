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

test.describe("Alur Logout (Keluar)", () => {
  test("tautan Keluar ada di navigasi setelah login", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");
    await expect(page.getByRole("link", { name: "Keluar" })).toBeVisible();
  });

  test("klik Keluar mengarahkan ke Authentik end-session endpoint", async ({ page }) => {
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Intercept respons dari route handler logout sebelum browser mengikuti redirect
    const responsePromise = page.waitForResponse((r) => r.url().includes("/api/auth/logout"), {
      timeout: 10_000,
    });

    await page.getByRole("link", { name: "Keluar" }).click();
    const response = await responsePromise;

    // Route handler harus merespons dengan redirect (3xx)
    expect([301, 302, 303, 307, 308]).toContain(response.status());

    // Redirect harus ke Authentik end-session (:9300)
    const location = response.headers()["location"] ?? "";
    expect(location).toContain(":9300");
    expect(location).toContain("end-session");
  });
});
