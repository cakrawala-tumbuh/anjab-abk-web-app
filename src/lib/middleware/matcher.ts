/**
 * Salinan pola matcher middleware Auth.js — HANYA untuk unit test
 * (`middleware-matcher.test.ts`).
 *
 * `src/middleware.ts` adalah SUMBER KEBENARAN (`export const config.matcher`).
 * String di sini SENGAJA diduplikasi, bukan diimpor oleh `middleware.ts` —
 * Next.js menganalisis `config` middleware secara statis, sehingga
 * `matcher` di sana wajib berupa literal; mereferensikan konstanta dari modul
 * lain membuat build gagal ("Next.js can't recognize the exported `config`
 * field"). Bila pola di `middleware.ts` berubah, sinkronkan string ini juga.
 *
 * Route yang dikecualikan (negative lookahead): API auth callbacks, aset build
 * Next.js, halaman login, root `/`, dan aset publik PWA (manifest, service
 * worker, ikon) — aset-aset ini di-fetch browser di luar konteks sesi (mis.
 * saat cek installability) sehingga tidak boleh ikut di-redirect ke /login.
 */
export const PUBLIC_ASSET_MATCHER =
  "/((?!api/auth|_next/static|_next/image|favicon.ico|favicon.svg|icon.svg|manifest.webmanifest|sw.js|login|$).*)";
