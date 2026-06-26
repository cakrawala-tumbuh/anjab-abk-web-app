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

  // Hapus semua cookie sesi Auth.js v5.
  // HTTP: "authjs.*" — HTTPS: "__Secure-authjs.*" / "__Host-authjs.*"
  // Cookie bertanda __Secure-* dan __Host-* wajib di-set dengan Secure:true agar
  // browser menerima instruksi penghapusan (RFC 6265bis §4.1.3).
  const cookieSuffixes = ["session-token", "csrf-token", "callback-url", "pkce.code_verifier"];
  const deleteOptions = [
    // HTTP (development): tanpa prefix, tanpa Secure
    { prefix: "", secure: false },
    // HTTPS: __Secure- prefix — wajib Secure:true
    { prefix: "__Secure-", secure: true },
    // HTTPS: __Host- prefix — wajib Secure:true + tidak boleh ada Domain
    { prefix: "__Host-", secure: true },
  ];
  for (const { prefix, secure } of deleteOptions) {
    for (const suffix of cookieSuffixes) {
      response.cookies.set(`${prefix}authjs.${suffix}`, "", {
        expires: new Date(0),
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure,
      });
    }
  }

  return response;
}
