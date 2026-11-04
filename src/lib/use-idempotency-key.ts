"use client";

import { useCallback, useRef, useState } from "react";

/** Hasil `useIdempotencyKey`. */
export interface IdempotencyKeyHandle {
  /** Key aktif untuk upaya aksi saat ini; stabil antar render sampai `perbarui()` dipanggil. */
  key: string;
  /** Ganti key dengan yang baru. Panggil HANYA setelah respons sukses. */
  perbarui: () => void;
  /**
   * Key untuk mengirim `isi` ini. Isi yang sama (setelah serialisasi JSON) dengan pemanggilan
   * sebelumnya mengembalikan key yang sama; isi berbeda membangkitkan key baru dan menjadikannya
   * aktif. Panggil di event handler, tepat saat membangun request.
   */
  keyUntuk: (isi: unknown) => string;
}

/**
 * Bangkitkan `Idempotency-Key` per **upaya aksi** pengguna (bukan per request).
 *
 * Key dibuat sekali saat komponen dimuat (`crypto.randomUUID()`) dan tetap sama selama
 * render ulang, sehingga klik ganda atau kirim ulang setelah gagal memakai key yang sama
 * dan backend dapat mengenali pengulangan (replay 200 / 409 saat masih diproses).
 * Setelah aksi sukses, panggil `perbarui()` agar aksi berikutnya memakai key baru.
 *
 * Backend mencakup key hanya dengan `{method}:{path}:{key}` dan tidak membandingkan isi
 * kiriman, sehingga aksi yang isinya berasal dari isian pengguna wajib memakai `keyUntuk(isi)`:
 * isi yang berubah selalu memakai key baru, isi yang sama tetap memakai key yang sama. Kembali
 * ke isi semula setelah berubah juga memakai key baru, sebab key lama bukan lagi key aktif.
 *
 * @returns Pegangan berisi `key` aktif, `keyUntuk`, dan fungsi `perbarui`.
 *
 * @example
 * ```tsx
 * const idem = useIdempotencyKey();
 * await client.POST(path, { body, headers: headerIdempotencyKey(idem.keyUntuk(body)) });
 * idem.perbarui();
 * ```
 */
export function useIdempotencyKey(): IdempotencyKeyHandle {
  const [key, setKey] = useState<string>(() => crypto.randomUUID());
  const aktif = useRef(key);
  const tandaIsi = useRef<string | null>(null);

  const perbarui = useCallback(() => {
    const baru = crypto.randomUUID();
    aktif.current = baru;
    tandaIsi.current = null;
    setKey(baru);
  }, []);

  const keyUntuk = useCallback((isi: unknown) => {
    const tanda = JSON.stringify(isi) ?? "";
    if (tandaIsi.current === null) {
      tandaIsi.current = tanda;
    } else if (tandaIsi.current !== tanda) {
      const baru = crypto.randomUUID();
      aktif.current = baru;
      tandaIsi.current = tanda;
      setKey(baru);
    }
    return aktif.current;
  }, []);

  return { key, perbarui, keyUntuk };
}
