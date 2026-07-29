/**
 * Pengambilan data halaman Tahap 3 — Detailing.
 *
 * Dipisah dari `page.tsx` agar bisa diuji langsung (berkas route Next.js tidak
 * boleh mengekspor fungsi sembarang).
 *
 * INVARIANT: setiap panggilan yang gagal WAJIB melempar `ApiError`. Dilarang
 * `res.data ?? []` — array kosong hasil kegagalan tidak terbedakan dari array
 * kosong yang sah, dan halaman akan merender "0 dari 0 task" seolah-olah benar.
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import type {
  TiDetailRead,
  TiRespondenRead,
  TiSesiRead,
  TiTaskTerpilihRead,
} from "@/lib/api/schema";

export interface Tahap3PageData {
  responden: TiRespondenRead;
  sesi: TiSesiRead;
  terpilih: TiTaskTerpilihRead[];
  detail: TiDetailRead[];
}

export async function fetchTahap3Data(
  accessToken: string | undefined,
  respondenId: string,
): Promise<Tahap3PageData> {
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

  // Task terpilih baru ada setelah dibekukan di transisi TAHAP2 → TAHAP3.
  // Backend menolak (422) bila status belum sampai situ, jadi jangan dipanggil.
  // Kuesioner Tahap 3 butuh SELURUH task terpilih & detail tersimpan; kedua
  // endpoint adalah `Page[T]` dengan `limit.maximum = 500` — literal `limit: 500`
  // "sekali jalan" akan memotong koleksi > 500 diam-diam, jadi paginasi eksplisit
  // via `ambilSemuaHalaman` wajib dipakai untuk keduanya (lihat `src/lib/api/paginasi.ts`).
  let terpilih: TiTaskTerpilihRead[] = [];
  if (["TAHAP3", "CLOSED", "ANALYZED"].includes(sesi.status)) {
    terpilih = await ambilSemuaHalaman<TiTaskTerpilihRead>(async (limit, offset) => {
      const ttRes = await client.GET("/api/v1/task-inventory/sesi/{sesi_id}/task-terpilih", {
        params: { path: { sesi_id: sesi.id }, query: { limit, offset } },
      });
      if (!ttRes.data) throw apiErrorDari(ttRes);
      return {
        items: (ttRes.data.items ?? []) as TiTaskTerpilihRead[],
        total: ttRes.data.total,
      };
    });
  }

  // Responden yang belum mengisi tetap dapat 200 + halaman kosong — kosong yang
  // SAH tetap terbedakan dari kegagalan, jadi gagal harus melempar.
  const detail = await ambilSemuaHalaman<TiDetailRead>(async (limit, offset) => {
    const detailRes = await client.GET(
      "/api/v1/task-inventory/sesi/responden/{responden_id}/detail",
      { params: { path: { responden_id: respondenId }, query: { limit, offset } } },
    );
    if (!detailRes.data) throw apiErrorDari(detailRes);
    return {
      items: (detailRes.data.items ?? []) as TiDetailRead[],
      total: detailRes.data.total,
    };
  });

  return { responden, sesi, terpilih, detail };
}
