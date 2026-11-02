"use client";

import { useEffect } from "react";

/**
 * Mendaftarkan `/sw.js` setelah halaman selesai dimuat (event `window` `load`).
 *
 * Registrasi ditunda supaya unduhan & instalasi service worker tidak bersaing dengan
 * pemuatan dokumen dan hidrasi React pertama (issue #73). Bila dokumen sudah
 * `complete` saat dipanggil (mis. komponen di-mount setelah `load` lewat), SW langsung
 * didaftarkan.
 *
 * @param win - Objek `window` (diinjeksi agar bisa diuji).
 * @param nav - Objek `navigator` (diinjeksi agar bisa diuji).
 * @returns Fungsi pembersih yang melepas pendengar `load` bila registrasi belum terjadi;
 *   no-op bila registrasi sudah dijalankan atau browser tak mendukung service worker.
 *
 * @remarks Kegagalan registrasi ditelan dengan sengaja: app tetap berfungsi penuh tanpa
 * SW (SW hanya meng-cache aset statis dan syarat install PWA).
 */
export function daftarkanSwSetelahLoad(win: Window, nav: Navigator): () => void {
  if (!("serviceWorker" in nav)) return () => {};

  const daftar = () => {
    nav.serviceWorker.register("/sw.js").catch(() => {
      // Registration failure is non-fatal; app works without SW
    });
  };

  if (win.document.readyState === "complete") {
    daftar();
    return () => {};
  }

  win.addEventListener("load", daftar, { once: true });
  return () => win.removeEventListener("load", daftar);
}

/**
 * Komponen tanpa tampilan (`return null`) di root layout yang mendaftarkan service
 * worker PWA sekali per mount, setelah event `load` — lihat {@link daftarkanSwSetelahLoad}.
 */
export function PwaRegister() {
  useEffect(() => daftarkanSwSetelahLoad(window, navigator), []);

  return null;
}
