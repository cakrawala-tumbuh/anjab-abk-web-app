import type { Page } from "@playwright/test";

/**
 * Login via Authentik OIDC. Urutan redirect:
 *   / → /api/auth/signin/authentik → Authentik login form
 *   → /api/auth/callback/authentik → /dashboard
 */
export async function loginViaAuthentik(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.goto("/");
  await page.waitForURL(/:9300/, { timeout: 15_000 });

  const usernameInput = page.getByPlaceholder("Email or Username");
  await usernameInput.waitFor({ state: "visible", timeout: 15_000 });
  await usernameInput.click();
  await usernameInput.fill(username);
  await page.getByRole("button", { name: /log in/i }).click();

  const passwordInput = page.locator('[name="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 15_000 });
  await passwordInput.click();
  await passwordInput.fill(password);
  await page.getByRole("button", { name: /log in|continue/i }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}
