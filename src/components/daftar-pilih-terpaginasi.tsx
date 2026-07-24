"use client";

import { useState } from "react";
import { UKURAN_HALAMAN } from "@/components/pagination";

/** Satu baris kandidat yang bisa dicentang. */
export interface ItemPilih {
  /** Identitas baris — nilai inilah yang dikirim saat submit. */
  id: string;
  /** Teks utama yang dibaca pengguna (mis. nama partisipan). */
  label: string;
  /** Teks sekunder opsional (mis. nama jabatan) — tampil lebih redup. */
  keterangan?: string;
}

interface Props {
  /** SELURUH kandidat (bukan satu halaman) — komponen yang memotongnya per halaman. */
  items: ItemPilih[];
  /** Himpunan id yang sedang tercentang; dimiliki form pemanggil. */
  terpilih: Set<string>;
  /** Dipanggil saat satu baris dicentang/dilepas. */
  onToggle: (id: string) => void;
  /** Dipanggil dengan daftar id yang harus ditambahkan ke pilihan. */
  onPilihSemua: (ids: string[]) => void;
  /** Dipanggil saat pengguna mengosongkan seluruh pilihan. */
  onBatalkan: () => void;
  /** Baris per halaman. Default {@link UKURAN_HALAMAN} (20). */
  ukuranHalaman?: number;
}

const KELAS_AKTIF =
  "rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800";
const KELAS_NONAKTIF =
  "rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-300 dark:border-gray-700 dark:text-gray-600 cursor-not-allowed";

/**
 * Daftar kandidat multi-select yang **dipaginasi di sisi klien**, terpisah dari
 * paginasi tabel mana pun di halaman yang sama.
 *
 * Dua keputusan yang membentuk komponen ini:
 *
 * 1. **Komponen hanya memegang state halaman; state pilihan tetap milik form
 *    pemanggil** (`terpilih` + `onToggle`). Itulah yang membuat centangan
 *    bertahan saat pengguna berpindah halaman — tidak ada yang di-unmount.
 * 2. **Navigasi halaman memakai `<button>`, bukan URL/`<Link>`.** Mengubah URL
 *    akan me-render ulang Server Component induk (centangan hilang) sekaligus
 *    menggeser query halaman tabel lain di layar yang sama. Satu mekanisme
 *    paging per daftar.
 *
 * Kontrol halaman tidak dirender bila seluruh kandidat muat dalam satu halaman
 * (aturan yang sama dengan `Pagination`). Halaman aktif di-clamp ke halaman
 * terakhir yang masih ada bila `items` menyusut (mis. setelah submit +
 * `router.refresh()`), sehingga daftar tidak pernah berhenti di halaman kosong.
 *
 * @example
 * ```tsx
 * <DaftarPilihTerpaginasi
 *   items={partisipan.map((p) => ({ id: p.id, label: p.nama, keterangan: jabatanMap[p.jabatan_utama_id] }))}
 *   terpilih={selected}
 *   onToggle={toggle}
 *   onPilihSemua={(ids) => setSelected((prev) => new Set([...prev, ...ids]))}
 *   onBatalkan={() => setSelected(new Set())}
 * />
 * ```
 */
export function DaftarPilihTerpaginasi({
  items,
  terpilih,
  onToggle,
  onPilihSemua,
  onBatalkan,
  ukuranHalaman = UKURAN_HALAMAN,
}: Props) {
  const [halaman, setHalaman] = useState(1);

  const total = items.length;
  const totalHalaman = Math.max(1, Math.ceil(total / ukuranHalaman));
  // Clamp saat render: `items` bisa menyusut di luar kendali komponen ini.
  const halamanAktif = Math.min(Math.max(1, halaman), totalHalaman);
  const offset = (halamanAktif - 1) * ukuranHalaman;
  const barisHalaman = items.slice(offset, offset + ukuranHalaman);
  const mulai = total === 0 ? 0 : offset + 1;
  const selesai = Math.min(offset + ukuranHalaman, total);
  const adaSebelumnya = halamanAktif > 1;
  const adaBerikutnya = halamanAktif < totalHalaman;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-end gap-3 text-xs">
        <button
          type="button"
          onClick={() => onPilihSemua(barisHalaman.map((i) => i.id))}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          Pilih semua (halaman ini)
        </button>
        <button
          type="button"
          onClick={() => onPilihSemua(items.map((i) => i.id))}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {`Pilih semua (${total})`}
        </button>
        <button
          type="button"
          onClick={onBatalkan}
          className="text-gray-500 hover:text-gray-700 hover:underline"
        >
          Batalkan pilihan
        </button>
      </div>

      <div className="rounded-md border border-gray-100 dark:border-gray-700">
        {barisHalaman.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
          >
            <input
              type="checkbox"
              checked={terpilih.has(item.id)}
              onChange={() => onToggle(item.id)}
              className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-900 dark:text-gray-100">{item.label}</span>
            {item.keterangan !== undefined && (
              <span className="text-xs text-gray-400">{item.keterangan}</span>
            )}
          </label>
        ))}
      </div>

      {total > ukuranHalaman && (
        <nav
          aria-label="Navigasi halaman kandidat"
          className="flex flex-wrap items-center justify-between gap-3 pt-3"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
            {`Menampilkan ${mulai}–${selesai} dari ${total}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHalaman(halamanAktif - 1)}
              disabled={!adaSebelumnya}
              className={adaSebelumnya ? KELAS_AKTIF : KELAS_NONAKTIF}
            >
              ‹ Sebelumnya
            </button>
            <span className="px-1 text-sm text-gray-500 dark:text-gray-400">
              Hal. {halamanAktif}/{totalHalaman}
            </span>
            <button
              type="button"
              onClick={() => setHalaman(halamanAktif + 1)}
              disabled={!adaBerikutnya}
              className={adaBerikutnya ? KELAS_AKTIF : KELAS_NONAKTIF}
            >
              Berikutnya ›
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
