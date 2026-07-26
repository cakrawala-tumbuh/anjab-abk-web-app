"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshProps {
  /** Jeda antar penyegaran otomatis dalam milidetik. Default `20000` (20 detik). */
  intervalMs?: number;
}

/**
 * Penyegar otomatis untuk halaman Server Component — memanggil `router.refresh()`
 * secara berkala selama tab aktif terlihat, tanpa reload penuh (`window.location.reload()`)
 * yang akan membuang state klien dan berkedip.
 *
 * Timer **berhenti** saat `document.visibilityState !== "visible"` (tab disembunyikan/
 * minimized) supaya banyak tab yang dibuka bersamaan (mis. workshop SME panel) tidak
 * terus memukul backend saat tidak dilihat siapa pun. Begitu tab terlihat kembali,
 * komponen memanggil `router.refresh()` sekali secara langsung (tanpa menunggu satu
 * interval penuh) lalu menyalakan ulang timer.
 *
 * Merender `null` — meniru pola `PwaRegister`/`ChatwootWidget`: komponen ini murni efek
 * samping, tidak punya tampilan sendiri. Kegagalan `router.refresh()` tidak dilaporkan
 * ke user (tidak ada toast) — data lama tetap ditampilkan sampai penyegaran berikutnya
 * berhasil.
 *
 * @param intervalMs - Jeda antar penyegaran otomatis dalam milidetik. Default `20000`.
 */
export function AutoRefresh({ intervalMs = 20000 }: AutoRefreshProps) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer !== null) return;
      timer = setInterval(() => {
        routerRef.current.refresh();
      }, intervalMs);
    };

    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        routerRef.current.refresh();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") {
      start();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [intervalMs]);

  return null;
}
