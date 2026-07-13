/**
 * Auth.js middleware — proteksi route.
 *
 * Pengguna yang belum login diarahkan ke /login (yang kemudian auto-redirect
 * ke Authentik via next-auth/react signIn). Route yang dikecualikan: API auth
 * callbacks, aset statis, halaman login, root / (yang redirect sendiri), dan
 * aset publik PWA (manifest, service worker, ikon) — aset-aset ini di-fetch
 * browser di luar konteks sesi (mis. saat cek installability), sehingga tidak
 * boleh ikut di-redirect ke /login.
 */

export { auth as default } from "@/lib/auth/auth";

// PENTING: `matcher` WAJIB berupa literal statis — Next.js menganalisis config
// middleware secara statis (bukan runtime import), sehingga string ini TIDAK
// BOLEH direferensikan dari modul lain (mis. `import { X } from "..."` lalu
// `matcher: [X]`) walau untuk keperluan testing; itu membuat build gagal dengan
// "Next.js can't recognize the exported `config` field". String yang sama
// diduplikasi (BUKAN diimpor) di `src/lib/middleware/matcher.ts` khusus untuk
// unit test (`middleware-matcher.test.ts`) — bila pola di sini berubah, sinkronkan
// juga string di sana.
export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|favicon.svg|icon.svg|manifest.webmanifest|sw.js|login|$).*)",
  ],
};
