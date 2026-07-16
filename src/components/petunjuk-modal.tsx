"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** Judul modal — dirender sebagai `<h2>` dan dipakai untuk `aria-labelledby`. */
  title: string;
  /** Bila true, modal terbuka otomatis sekali saat komponen di-mount. */
  defaultOpen: boolean;
  /** Isi petunjuk per alat ukur. */
  children: ReactNode;
  /** Label tombol CTA di bawah konten (menutup modal). */
  ctaLabel?: string;
  /** Label tombol pemicu yang selalu terlihat. */
  triggerLabel?: string;
}

/**
 * Modal petunjuk pengisian bersama untuk semua alat ukur (DCS, WCP, OPM, Time
 * Study, Task Inventory). Mekanik di-ekstrak dari komponen petunjuk DCS asli
 * (backlog 046): hand-rolled overlay tanpa portal / tanpa dependency dialog,
 * meniru pola `app-shell.tsx`. Konten spesifik alat ukur diisi lewat `children`.
 *
 * - Tombol pemicu (`triggerLabel`) selalu terlihat dan membuka modal.
 * - `defaultOpen` membuka modal sekali per mount (auto-muncul tiap kunjungan
 *   selama alat ukur masih bisa diisi — konsisten keputusan DCS, tanpa
 *   `localStorage`, tanpa "jangan tampilkan lagi").
 * - Klik backdrop, tombol X, tombol CTA, atau Escape menutup modal.
 */
export function PetunjukModal({
  title,
  defaultOpen,
  children,
  ctaLabel = "Saya Mengerti, Mulai Mengisi",
  triggerLabel = "Petunjuk Pengisian",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const judulId = useId();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700",
          "hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800",
        )}
      >
        <HelpCircle className="h-4 w-4" />
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={judulId}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:border dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={judulId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-5 text-sm text-gray-700 dark:text-gray-300">
              {children}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {ctaLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
