import { GagalMuat, TidakBerhak } from "@/components/gagal-muat";
import { withServerAuth } from "@/lib/api/client";
import { ApiError, apiErrorDari, isTidakBerhak } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import { auth } from "@/lib/auth/auth";
import type { AlurRead, DugaanRead, MasalahSekolahRead } from "@/lib/api/schema";
import { WizardKonfirmasi } from "./wizard";

export const metadata = { title: "Isi Konfirmasi — Redesain Sekolah" };

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Halaman wizard konfirmasi sekolah (Server Component).
 *
 * Memuat konfirmasi lalu masalahnya (bagian A, dari `sekolah/masalah` — tanpa rumusan).
 * `tampilkan-dugaan` HANYA dipanggil di sini bila `dugaan_ditampilkan_pada` sudah terisi
 * (kunjungan ulang mengambil rumusan); untuk konfirmasi yang ceritanya belum dikunci
 * endpoint itu tidak pernah disentuh. Kegagalan apa pun melempar/dirender sebagai galat,
 * tidak pernah menjadi formulir kosong.
 */
export default async function KonfirmasiPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const client = withServerAuth(session?.accessToken);

  try {
    const kRes = await client.GET("/api/v1/redesain/konfirmasi/{konfirmasi_id}", {
      params: { path: { konfirmasi_id: id } },
    });
    if (!kRes.data) throw apiErrorDari(kRes);
    const konfirmasi = kRes.data;

    const semuaMasalah = await ambilSemuaHalaman<MasalahSekolahRead>(async (limit, offset) => {
      const res = await client.GET("/api/v1/redesain/sekolah/masalah", {
        params: { query: { limit, offset } },
      });
      if (!res.data) throw apiErrorDari(res);
      return { items: res.data.items, total: res.data.total };
    });
    const masalah = semuaMasalah.find((m) => m.id === konfirmasi.masalah_id);
    if (!masalah) {
      throw new Error("Masalah untuk konfirmasi ini tidak ditemukan di daftar masalah sekolah.");
    }

    let dugaan: DugaanRead | null = null;
    if (konfirmasi.dugaan_ditampilkan_pada) {
      const dRes = await client.POST(
        "/api/v1/redesain/konfirmasi/{konfirmasi_id}/tampilkan-dugaan",
        {
          params: { path: { konfirmasi_id: id } },
        },
      );
      if (!dRes.data) throw apiErrorDari(dRes);
      dugaan = dRes.data;
    }

    // Panel alur hanya setelah dugaan tampil; sebelum itu /alur tidak pernah dipanggil.
    // Daftar proses kosong = jawaban sah; kegagalan apa pun melempar.
    let alur: AlurRead | null = null;
    if (konfirmasi.dugaan_ditampilkan_pada) {
      const aRes = await client.GET("/api/v1/redesain/konfirmasi/{konfirmasi_id}/alur", {
        params: { path: { konfirmasi_id: id } },
      });
      if (!aRes.data) throw apiErrorDari(aRes);
      alur = aRes.data;
    }

    return (
      <WizardKonfirmasi
        konfirmasi={konfirmasi}
        masalah={masalah}
        dugaanAwal={dugaan}
        alur={alur}
        accessToken={session?.accessToken}
      />
    );
  } catch (err) {
    if (isTidakBerhak(err)) return <TidakBerhak judul="Isi Konfirmasi" err={err} />;
    if (err instanceof ApiError) return <GagalMuat judul="Isi Konfirmasi" err={err} />;
    throw err;
  }
}
