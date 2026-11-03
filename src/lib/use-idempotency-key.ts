"use client";

import { useCallback, useState } from "react";

/** Hasil `useIdempotencyKey`. */
export interface IdempotencyKeyHandle {
  /** Key aktif untuk upaya aksi saat ini; stabil antar render sampai `perbarui()` dipanggil. */
  key: string;
  /** Ganti key dengan yang baru. Panggil HANYA setelah respons sukses. */
  perbarui: () => void;
}

/**
 * Bangkitkan `Idempotency-Key` per **upaya aksi** pengguna (bukan per request).
 *
 * Key dibuat sekali saat komponen dimuat (`crypto.randomUUID()`) dan tetap sama selama
 * render ulang, sehingga klik ganda atau kirim ulang setelah gagal memakai key yang sama
 * dan backend dapat mengenali pengulangan (replay 200 / 409 saat masih diproses).
 * Setelah aksi sukses, panggil `perbarui()` agar aksi berikutnya memakai key baru.
 *
 * @returns Pegangan berisi `key` aktif dan fungsi `perbarui`.
 *
 * @example
 * ```tsx
 * const idem = useIdempotencyKey();
 * await client.POST(path, { headers: { "Idempotency-Key": idem.key } });
 * idem.perbarui();
 * ```
 */
export function useIdempotencyKey(): IdempotencyKeyHandle {
  const [key, setKey] = useState<string>(() => crypto.randomUUID());
  const perbarui = useCallback(() => setKey(crypto.randomUUID()), []);
  return { key, perbarui };
}
