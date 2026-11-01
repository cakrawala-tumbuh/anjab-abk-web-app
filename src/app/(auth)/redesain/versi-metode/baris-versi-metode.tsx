"use client";

import { useState } from "react";
import type { VersiMetodeRead } from "@/lib/api/schema";
import { FormVersiMetode } from "./form-versi-metode";

/**
 * Satu baris tabel versi metode dengan tombol "Ubah" yang membuka {@link FormVersiMetode}
 * mode ubah tepat di bawah baris. Tanpa tombol hapus (backend tak menyediakan DELETE).
 *
 * @param props.item - Catatan versi yang ditampilkan.
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function BarisVersiMetode({
  item,
  accessToken,
}: {
  item: VersiMetodeRead;
  accessToken: string | undefined;
}) {
  const [ubah, setUbah] = useState(false);
  return (
    <>
      <tr className="align-top">
        <td className="px-4 py-3 font-mono text-xs">{item.versi}</td>
        <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
          {item.tanggal}
        </td>
        <td className="px-4 py-3">{item.bagian}</td>
        <td className="whitespace-normal break-words px-4 py-3">{item.apa_diperbarui}</td>
        <td className="whitespace-normal break-words px-4 py-3">{item.alasan_risiko}</td>
        <td className="whitespace-normal break-words px-4 py-3">{item.status_hasil_uji}</td>
        <td className="px-4 py-3">{item.pemeriksa_pemutus}</td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setUbah((v) => !v)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
          >
            {ubah ? "Tutup" : "Ubah"}
          </button>
        </td>
      </tr>
      {ubah && (
        <tr>
          <td colSpan={8} className="px-4 py-3">
            <FormVersiMetode
              accessToken={accessToken}
              awal={item}
              onSelesai={() => setUbah(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}
