import { describe, expect, it } from "vitest";
import { PUBLIC_ASSET_MATCHER } from "@/lib/middleware/matcher";

// Next.js meng-anchor matcher ke awal path saat mengevaluasi — replikasi di sini
// dengan menambahkan "^" agar perilaku tes konsisten dengan middleware sungguhan.
const matcherRe = new RegExp(`^${PUBLIC_ASSET_MATCHER}`);

describe("PUBLIC_ASSET_MATCHER — aset publik LOLOS dari middleware auth", () => {
  it.each([
    "/manifest.webmanifest",
    "/sw.js",
    "/icon.svg",
    "/favicon.svg",
    "/favicon.ico",
    "/login",
    "/",
    "/api/auth/session",
    "/_next/static/chunk.js",
    "/_next/image?url=x",
  ])("%s TIDAK cocok matcher (middleware tidak menjalankan proteksi login)", (path) => {
    expect(matcherRe.test(path)).toBe(false);
  });
});

describe("PUBLIC_ASSET_MATCHER — route aplikasi TETAP terlindungi", () => {
  it.each(["/dashboard", "/task-inventory", "/kuesioner", "/dcs", "/wcp", "/opm", "/partisipan"])(
    "%s COCOK matcher (middleware tetap memproteksi login)",
    (path) => {
      expect(matcherRe.test(path)).toBe(true);
    },
  );
});
