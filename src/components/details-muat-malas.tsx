"use client";

import { useState, type ReactNode } from "react";

/**
 * `<details>` yang baru me-render isinya setelah pertama kali dibuka.
 *
 * Dipakai untuk formulir ubah yang memuat rekamannya sendiri (GET detail + ETag) saat
 * dimontase: tanpa penundaan ini, tiap baris daftar memicu satu GET begitu halaman dibuka
 * (N+1). Setelah dibuka, isi tetap terpasang walau panel ditutup lagi (isian tidak hilang).
 *
 * @param props.ringkasan - Isi `<summary>`.
 * @param props.className - Kelas `<details>`.
 * @param props.summaryClassName - Kelas `<summary>`.
 */
export function DetailsMuatMalas({
  ringkasan,
  className,
  summaryClassName,
  children,
}: {
  ringkasan: ReactNode;
  className?: string;
  summaryClassName?: string;
  children: ReactNode;
}) {
  const [pernahBuka, setPernahBuka] = useState(false);
  return (
    <details
      className={className}
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open) setPernahBuka(true);
      }}
    >
      <summary className={summaryClassName}>{ringkasan}</summary>
      {pernahBuka && children}
    </details>
  );
}
