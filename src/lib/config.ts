/**
 * Konfigurasi aplikasi dari environment — dibaca sekali, dipakai lewat `config`.
 *
 * Disiplin:
 *  - `NEXT_PUBLIC_*` bersifat PUBLIK (ter-inline ke bundle browser) — jangan rahasia.
 *  - Variabel server (tanpa prefiks) hanya tersedia saat runtime server.
 */

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn("[config] NEXT_PUBLIC_API_BASE_URL belum di-set — fallback ke localhost:8000");
}

export const config = {
  /** Base URL backend dari browser (publik). */
  apiBaseUrl,
  /** Base URL backend dari sisi server (mis. nama service Docker). Fallback ke publik. */
  apiBaseUrlInternal: process.env.API_BASE_URL_INTERNAL ?? apiBaseUrl,
  auth: {
    /** Issuer OIDC Authentik (server-only). */
    issuer: process.env.AUTHENTIK_ISSUER,
    /** Public client id (PKCE, tanpa client_secret). */
    clientId: process.env.AUTHENTIK_CLIENT_ID,
  },
  /** URL publik aplikasi ini — dipakai sebagai post_logout_redirect_uri saat logout OIDC. */
  appUrl: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
} as const;
