import { cookies } from "next/headers";
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

  // Hapus SEMUA cookie sesi Auth.js v5 yang benar-benar ada di request.
  //
  // Auth.js MEMECAH cookie sesi yang besar (mis. session-token berisi JWT panjang)
  // menjadi beberapa "chunk": `authjs.session-token.0`, `authjs.session-token.1`, dst.
  // Implementasi lama menghapus nama statis tanpa suffix `.0`/`.1`, sehingga chunk
  // tersebut LOLOS dan sesi lokal tidak pernah benar-benar terhapus.
  //
  // Solusi: enumerasi cookie yang sungguh dikirim browser, lalu set-kadaluwarsa
  // setiap cookie milik Auth.js (cocok dengan/atau tanpa prefix __Secure-/__Host-).
  // Cookie __Secure-* / __Host- wajib di-set dengan Secure:true agar instruksi
  // penghapusan diterima browser (RFC 6265bis §4.1.3).
  const authCookieRe =
    /^(__Secure-|__Host-)?authjs\.(session-token|csrf-token|callback-url|pkce\.code_verifier|state|nonce)(\.\d+)?$/;
  const present = (await cookies()).getAll();
  for (const { name } of present) {
    if (!authCookieRe.test(name)) continue;
    const secure = name.startsWith("__Secure-") || name.startsWith("__Host-");
    response.cookies.set(name, "", {
      expires: new Date(0),
      maxAge: 0,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure,
    });
  }

  return response;
}
