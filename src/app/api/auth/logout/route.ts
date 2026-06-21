import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/logout
 *
 * Melakukan RP-initiated logout ke Authentik:
 * 1. Membaca sesi untuk mendapatkan id_token_hint
 * 2. Menghapus cookie sesi Auth.js
 * 3. Redirect ke end-session endpoint Authentik dengan post_logout_redirect_uri
 *
 * Auth.js v5 beta tidak mendukung external redirectTo dari server action,
 * sehingga logout OIDC ditangani via route handler ini.
 */
export async function GET() {
  const session = await auth();
  const idToken = session?.idToken;
  const issuer = config.auth.issuer;
  const appUrl = config.appUrl;

  let targetUrl = "/";
  if (issuer) {
    const endSessionUrl = new URL("end-session/", issuer);
    if (idToken) {
      endSessionUrl.searchParams.set("id_token_hint", idToken);
    }
    if (appUrl) {
      endSessionUrl.searchParams.set("post_logout_redirect_uri", appUrl);
    }
    targetUrl = endSessionUrl.toString();
  }

  const response = NextResponse.redirect(targetUrl, { status: 303 });

  // Hapus semua cookie sesi Auth.js v5
  // HTTP: "authjs.*" — HTTPS: "__Secure-authjs.*" / "__Host-authjs.*"
  const cookiePrefixes = ["", "__Secure-", "__Host-"];
  const cookieSuffixes = ["session-token", "csrf-token", "callback-url", "pkce.code_verifier"];
  for (const prefix of cookiePrefixes) {
    for (const suffix of cookieSuffixes) {
      response.cookies.set(`${prefix}authjs.${suffix}`, "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }
  }

  return response;
}
