"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { hapusBerEtag, PESAN_DATA_SUDAH_HILANG } from "@/lib/hapus-ber-etag";
import { notifyGagal, notifySukses } from "@/lib/notify";

interface Props {
  respondenId: string;
  nama: string;
  accessToken: string | undefined;
}

/**
 * Tombol hapus responden Task Inventory dengan kunci optimistik.
 *
 * Saat diklik: `GET /api/v1/task-inventory/sesi/responden/{responden_id}` (ambil ETag) -> konfirmasi -> `DELETE` ber-`If-Match`.
 * 412 tampil sebagai pesan baku data-berubah; GET 404 menampilkan pesan lalu memuat ulang daftar.
 *
 * @param props.respondenId - ID responden.
 * @param props.nama - Nama responden (untuk dialog konfirmasi).
 * @param props.accessToken - Token akses dari Server Component induk.
 */
export function HapusResponden({ respondenId, nama, accessToken }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleHapus() {
    setLoading(true);
    try {
      const client = withServerAuth(accessToken);
      const params = { params: { path: { responden_id: respondenId } } };
      const hasil = await hapusBerEtag({
        ambil: () => client.GET("/api/v1/task-inventory/sesi/responden/{responden_id}", params),
        konfirmasi: () => confirm(`Hapus responden "${nama}" dari analisis ini?`),
        hapus: (headers) =>
          client.DELETE("/api/v1/task-inventory/sesi/responden/{responden_id}", {
            ...params,
            headers,
          }),
      });
      if (hasil === "batal") {
        setLoading(false);
        return;
      }
      if (hasil === "hilang") {
        notifyGagal(new Error(PESAN_DATA_SUDAH_HILANG));
        router.refresh();
        setLoading(false);
        return;
      }
      notifySukses("Responden berhasil dihapus.");
      router.refresh();
    } catch (err) {
      notifyGagal(err);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleHapus}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
      aria-label={`Hapus responden ${nama}`}
    >
      {loading ? "…" : "Hapus"}
    </button>
  );
}
