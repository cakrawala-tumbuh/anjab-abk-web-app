"use client";

import { useEffect } from "react";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";

/** Selang detak dan ambang idle: satu menit. */
export const SELANG_DETAK_MS = 60_000;

/** Peristiwa DOM yang dihitung sebagai interaksi (input, klik, gulir, tombol). */
export const PERISTIWA_INTERAKSI = ["pointerdown", "click", "keydown", "input", "scroll"] as const;

/**
 * Kirim detak menit aktif tinjauan narasi selama reviewer benar-benar aktif.
 *
 * "Aktif" = tab terlihat (`document.visibilityState === "visible"`) DAN ada interaksi
 * (lihat {@link PERISTIWA_INTERAKSI}) dalam {@link SELANG_DETAK_MS} terakhir. Pemeriksaan
 * berjalan tiap {@link SELANG_DETAK_MS}, sehingga detak dikirim paling banyak sekali per menit
 * dan tidak sama sekali saat idle atau tab tersembunyi. Membuka halaman sendiri tidak dihitung
 * sebagai interaksi.
 *
 * Bukan jalur baca: kegagalan (galat jaringan, 4xx/5xx termasuk 429) tidak dilempar dan tidak
 * ditampilkan; hanya dicatat lewat `console.warn` agar tinjauan tidak terganggu.
 *
 * @param narasiId - Id kasus narasi yang sedang ditinjau.
 * @param accessToken - Token akses dari Server Component induk.
 */
export function useMenitAktif(narasiId: string, accessToken: string | undefined): void {
  useEffect(() => {
    let terakhirInteraksi: number | null = null;

    const tandai = () => {
      terakhirInteraksi = Date.now();
    };
    for (const p of PERISTIWA_INTERAKSI) {
      document.addEventListener(p, tandai, { capture: true, passive: true });
    }

    const kirim = async () => {
      try {
        const res = await withServerAuth(accessToken).POST(
          "/api/v1/narasi/kasus/{narasi_id}/menit-aktif",
          { params: { path: { narasi_id: narasiId } } },
        );
        if (res.error !== undefined) throw apiErrorDari(res);
      } catch (err) {
        console.warn("Detak menit aktif gagal dicatat", err);
      }
    };

    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (terakhirInteraksi === null || Date.now() - terakhirInteraksi > SELANG_DETAK_MS) return;
      void kirim();
    }, SELANG_DETAK_MS);

    return () => {
      clearInterval(timer);
      for (const p of PERISTIWA_INTERAKSI) {
        document.removeEventListener(p, tandai, { capture: true });
      }
    };
  }, [narasiId, accessToken]);
}
