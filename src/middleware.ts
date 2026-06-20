/**
 * Auth.js middleware — proteksi route.
 *
 * Pengguna yang belum login diarahkan ke /login (yang kemudian auto-redirect
 * ke Authentik via next-auth/react signIn). Route yang dikecualikan: API auth
 * callbacks, aset statis, halaman login, dan root / (yang redirect sendiri).
 */

export { auth as default } from "@/lib/auth/auth";

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login|$).*)"],
};
