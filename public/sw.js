const CACHE_NAME = "anjab-abk-v2";

const STATIC_ASSETS = ["/", "/favicon.svg", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
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

  // Only handle same-origin GET requests
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API and auth routes — always network-first
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation requests: network-first, fall back to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/"))),
    );
    return;
  }

  // RSC payload (router.refresh()/soft navigation): jangan cache-first — data
  // harus selalu segar dari server, kalau tidak tampilan basi setelah mutasi.
  if (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) {
    return;
  }

  // Hanya aset statis ber-hash yang aman di-cache-first (immutable).
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|woff2?|png|svg|ico|webmanifest)$/.test(url.pathname);
  if (!isStaticAsset) {
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
