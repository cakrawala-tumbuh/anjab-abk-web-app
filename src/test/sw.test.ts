import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

type Handler = (event: unknown) => void;
type Pilah = (
  request: {
    method: string;
    url: string;
    mode: string;
    headers: { get(n: string): string | null };
  },
  origin: string,
) => "jaringan" | "statis";

const ORIGIN = "https://app.test";
const KODE_SW = readFileSync(resolve(__dirname, "../../public/sw.js"), "utf8");

/**
 * Memuat `public/sw.js` apa adanya ke sandbox dengan `self`/`caches`/`fetch` palsu,
 * lalu mengembalikan pendengar event yang didaftarkannya + simbol internalnya.
 */
function muatSw() {
  const handlers: Record<string, Handler> = {};
  const cache = { addAll: vi.fn(() => Promise.resolve()), put: vi.fn() };
  const caches = {
    open: vi.fn(() => Promise.resolve(cache)),
    keys: vi.fn(() => Promise.resolve(["anjab-abk-v2", "anjab-abk-v3", "lain"])),
    delete: vi.fn(() => Promise.resolve(true)),
    match: vi.fn(() => Promise.resolve(undefined)),
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, fn: Handler) => {
      handlers[type] = fn;
    },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  };
  const fetchPalsu = vi.fn(() => Promise.resolve(new Response("x")));
  const internal = new Function(
    "self",
    "caches",
    "fetch",
    `${KODE_SW}\nreturn { pilahPermintaan, CACHE_NAME, STATIC_ASSETS };`,
  )(self, caches, fetchPalsu) as {
    pilahPermintaan: Pilah;
    CACHE_NAME: string;
    STATIC_ASSETS: string[];
  };
  return { handlers, caches, cache, fetchPalsu, ...internal };
}

function req(path: string, opts: { method?: string; mode?: string; rsc?: boolean } = {}) {
  return {
    method: opts.method ?? "GET",
    url: path.startsWith("http") ? path : `${ORIGIN}${path}`,
    mode: opts.mode ?? "no-cors",
    headers: { get: (n: string) => (n === "RSC" && opts.rsc ? "1" : null) },
  };
}

describe("public/sw.js — pemilahan request", () => {
  const { pilahPermintaan } = muatSw();

  it("navigasi (HTML terautentikasi) selalu ke jaringan, termasuk halaman redesain", () => {
    expect(pilahPermintaan(req("/redesain/yayasan", { mode: "navigate" }), ORIGIN)).toBe(
      "jaringan",
    );
    expect(pilahPermintaan(req("/redesain-sekolah", { mode: "navigate" }), ORIGIN)).toBe(
      "jaringan",
    );
    expect(pilahPermintaan(req("/", { mode: "navigate" }), ORIGIN)).toBe("jaringan");
  });

  it("aset statis ber-hash dan ikon boleh cache-first", () => {
    expect(pilahPermintaan(req("/_next/static/chunks/app-abc123.js"), ORIGIN)).toBe("statis");
    expect(pilahPermintaan(req("/icon.svg"), ORIGIN)).toBe("statis");
    expect(pilahPermintaan(req("/manifest.webmanifest"), ORIGIN)).toBe("statis");
  });

  it("API, RSC, non-GET, dan lintas-origin ke jaringan", () => {
    expect(pilahPermintaan(req("/api/auth/session"), ORIGIN)).toBe("jaringan");
    expect(pilahPermintaan(req("/redesain/yayasan", { rsc: true }), ORIGIN)).toBe("jaringan");
    expect(pilahPermintaan(req("/redesain/yayasan?_rsc=1x"), ORIGIN)).toBe("jaringan");
    expect(pilahPermintaan(req("/icon.svg", { method: "POST" }), ORIGIN)).toBe("jaringan");
    expect(pilahPermintaan(req("https://lain.test/app.js"), ORIGIN)).toBe("jaringan");
    expect(pilahPermintaan(req("/dashboard"), ORIGIN)).toBe("jaringan");
  });
});

describe("public/sw.js — handler event", () => {
  it("fetch navigasi: tidak respondWith dan tidak menyimpan ke cache", () => {
    const { handlers, caches, fetchPalsu } = muatSw();
    const respondWith = vi.fn();
    handlers.fetch({ request: req("/redesain/yayasan", { mode: "navigate" }), respondWith });
    expect(respondWith).not.toHaveBeenCalled();
    expect(caches.open).not.toHaveBeenCalled();
    expect(fetchPalsu).not.toHaveBeenCalled();
  });

  it("fetch aset statis: respondWith dipakai (cache-first)", () => {
    const { handlers } = muatSw();
    const respondWith = vi.fn();
    handlers.fetch({ request: req("/_next/static/css/a.css"), respondWith });
    expect(respondWith).toHaveBeenCalledTimes(1);
  });

  it("install: precache tanpa dokumen HTML '/'", async () => {
    const { handlers, cache, STATIC_ASSETS } = muatSw();
    let tunggu: Promise<unknown> = Promise.resolve();
    handlers.install({ waitUntil: (p: Promise<unknown>) => (tunggu = p) });
    await tunggu;
    expect(STATIC_ASSETS).not.toContain("/");
    expect(cache.addAll).toHaveBeenCalledWith(STATIC_ASSETS);
  });

  it("activate: menghapus cache versi lama (termasuk HTML di anjab-abk-v2)", async () => {
    const { handlers, caches, CACHE_NAME } = muatSw();
    expect(CACHE_NAME).toBe("anjab-abk-v3");
    let tunggu: Promise<unknown> = Promise.resolve();
    handlers.activate({ waitUntil: (p: Promise<unknown>) => (tunggu = p) });
    await tunggu;
    expect(caches.delete).toHaveBeenCalledWith("anjab-abk-v2");
    expect(caches.delete).toHaveBeenCalledWith("lain");
    expect(caches.delete).not.toHaveBeenCalledWith("anjab-abk-v3");
  });
});
