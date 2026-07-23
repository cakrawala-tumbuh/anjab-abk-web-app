/**
 * Pengambilan data halaman Tahap 1 — Seleksi Relevansi.
 *
 * Dipisah dari `page.tsx` agar bisa diuji langsung (berkas route Next.js tidak
 * boleh mengekspor fungsi sembarang).
 *
 * INVARIANT: setiap panggilan yang gagal WAJIB melempar `ApiError`. Dilarang
 * `res.data ?? []` untuk data kritis — kegagalan yang menyamar jadi daftar
 * kosong membuat halaman merender formulir kosong yang tampak sah.
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { TiCatalogRead, TiRespondenRead, TiSeleksiRead, TiSesiRead } from "@/lib/api/schema";

export interface Tahap1PageData {
  responden: TiRespondenRead;
  sesi: TiSesiRead;
  catalog: TiCatalogRead[];
  terpilih: string[];
}

export async function fetchTahap1Data(
  accessToken: string | undefined,
  respondenId: string,
): Promise<Tahap1PageData> {
  const client = withServerAuth(accessToken);

  const respRes = await client.GET("/api/v1/task-inventory/sesi/responden/{responden_id}", {
    params: { path: { responden_id: respondenId } },
  });
  if (!respRes.data) throw apiErrorDari(respRes);
  const responden = respRes.data as TiRespondenRead;

  const sesiRes = await client.GET("/api/v1/task-inventory/sesi/{sesi_id}", {
    params: { path: { sesi_id: responden.sesi_id } },
  });
  if (!sesiRes.data) throw apiErrorDari(sesiRes);
  const sesi = sesiRes.data as TiSesiRead;

  // Kuesioner Tahap 1 butuh SELURUH task katalog jabatan; endpoint kini `Page[T]`
  // dengan default limit 20, jadi limit tinggi eksplisit wajib agar tak terpotong.
  const catalogRes = await client.GET("/api/v1/task-inventory/catalog", {
    params: { query: { jabatan_id: sesi.jabatan_id, limit: 500 } },
  });
  if (!catalogRes.data) throw apiErrorDari(catalogRes);
  const catalog = (catalogRes.data.items ?? []) as TiCatalogRead[];

  // PENGECUALIAN yang disengaja: backend melempar 404 ("Responden belum submit
  // seleksi Tahap 1") bila responden belum pernah menyimpan pilihan apa pun —
  // itu kondisi SAH pada kunjungan pertama, bukan kegagalan. HANYA 404 yang
  // diterjemahkan jadi "belum ada pilihan"; 401/403/5xx tetap dilempar.
  const selRes = await client.GET("/api/v1/task-inventory/sesi/responden/{responden_id}/seleksi", {
    params: { path: { responden_id: respondenId } },
  });
  let terpilih: string[] = [];
  if (selRes.data) {
    terpilih = (selRes.data as TiSeleksiRead).task_kode;
  } else {
    const err = apiErrorDari(selRes);
    if (err.status !== 404) throw err;
  }

  return { responden, sesi, catalog, terpilih };
}
