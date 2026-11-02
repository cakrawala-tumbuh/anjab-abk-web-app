/*
 * Service worker PWA anjab-abk.
 *
 * Kebijakan cache (issue #73 ronde 4):
 * - Request NAVIGASI (`request.mode === "navigate"`, yaitu dokumen HTML) TIDAK disentuh
 *   sama sekali: tanpa `respondWith`, tanpa `cache.put`. HTML di app ini selalu milik
 *   sesi user yang login; menyimpannya di cache SW membocorkan halaman antar-user di
 *   perangkat bersama, dan menyajikan dokumen lewat SW dicurigai bersaing dengan
 *   hidrasi (React #418). Browser memuatnya langsung dari jaringan seperti tanpa SW.
 * - API (`/api/*`) dan payload RSC selalu ke jaringan.
 * - Hanya aset statis (ber-hash `/_next/static/*`, ikon, manifest) yang cache-first.
 *
 * Versi nama cache dinaikkan setiap kebijakan berubah; event `activate` menghapus semua
 * cache dengan nama lain, termasuk entri HTML yang tersimpan oleh versi lama (`v2`).
 */
const CACHE_NAME = "anjab-abk-v3";

// Precache hanya aset statis. "/" (dokumen HTML) sengaja tidak lagi di-precache.
const STATIC_ASSETS = ["/favicon.svg", "/icon.svg"];

/**
 * Memilah sebuah request menjadi strategi yang dipakai handler `fetch`.
 *
 * Fungsi murni (tidak menyentuh cache/jaringan) supaya bisa diuji unit dengan memuat
 * berkas ini di Vitest.
 *
 * @param {{ method: string, url: string, mode: string, headers: { get(name: string): (string|null) } }} request
 *   Request yang dicegat SW (cukup bentuk minimal `Request`).
 * @param {string} origin Origin SW (`self.location.origin`).
 * @returns {"jaringan" | "statis"} `"statis"` = aset statis yang boleh cache-first;
 *   `"jaringan"` = jangan `respondWith`, biarkan browser mengambil dari jaringan. Semua
 *   request navigasi (HTML), API, RSC, non-GET, dan lintas-origin jatuh ke `"jaringan"`.
 */
function pilahPermintaan(request, origin) {
  if (request.method !== "GET" || !request.url.startsWith(origin)) {
    return "jaringan";
  }
  // Dokumen HTML terautentikasi: tidak pernah disajikan atau disimpan oleh SW.
  if (request.mode === "navigate") {
    return "jaringan";
  }
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    return "jaringan";
  }
  // RSC payload (router.refresh()/soft navigation): data harus selalu segar.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) {
    return "jaringan";
  }
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|woff2?|png|svg|ico|webmanifest)$/.test(url.pathname);
  return isStaticAsset ? "statis" : "jaringan";
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Hapus semua cache versi lain — termasuk dokumen HTML yang disimpan "anjab-abk-v2".
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (pilahPermintaan(request, self.location.origin) !== "statis") {
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }),
    ),
  );
});
