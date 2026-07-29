/**
 * Pengambilan data halaman Master Data → Uraian Tugas.
 *
 * Dipisah dari `page.tsx` agar bisa diuji langsung (berkas route Next.js tidak boleh
 * mengekspor fungsi sembarang).
 *
 * INVARIANT: setiap panggilan yang gagal WAJIB melempar `ApiError`. Dilarang
 * `res.data ?? []` untuk data apa pun di sini — termasuk ketiga daftar dropdown
 * (jabatan/tugas pokok/detil tugas): ia satu-satunya sumber pilihan filter, bukan
 * sekadar label pendukung, jadi kegagalannya wajib terlihat, bukan tampil sebagai
 * dropdown kosong yang menyesatkan.
 */
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { ambilSemuaHalaman } from "@/lib/api/paginasi";
import { UKURAN_HALAMAN } from "@/components/pagination";
import { domainFilter, type FilterUraianTugas } from "@/lib/uraian-tugas-filter";
import type {
  DetilTugasRead,
  JabatanRead,
  TugasPokokRead,
  UraianTugasRead,
} from "@/lib/api/schema";

export interface UraianTugasPageData {
  uraianTugas: UraianTugasRead[];
  total: number;
  jabatan: JabatanRead[];
  tugasPokok: TugasPokokRead[];
  detilTugas: DetilTugasRead[];
}

/**
 * Ambil daftar Uraian Tugas terfilter+terpaginasi beserta ketiga daftar dropdown
 * (jabatan, tugas pokok, detil tugas) yang dipakai kontrol filter & pelabelan.
 *
 * @param accessToken - Token akses sesi admin.
 * @param filter - Filter aktif (dari {@link import("@/lib/uraian-tugas-filter").bacaFilter}).
 * @param offset - Offset halaman daftar Uraian Tugas (`UKURAN_HALAMAN` per halaman).
 * @throws ApiError - Bila daftar Uraian Tugas atau salah satu dropdown gagal diambil.
 */
export async function fetchUraianTugasData(
  accessToken: string | undefined,
  filter: FilterUraianTugas,
  offset: number,
): Promise<UraianTugasPageData> {
  const client = withServerAuth(accessToken);

  const [uraianRes, jabatan, tugasPokok, detilTugas] = await Promise.all([
    client.POST("/api/v1/task-inventory/uraian-tugas/search", {
      body: { domain: domainFilter(filter), order: [], limit: UKURAN_HALAMAN, offset },
    }),
    ambilSemuaHalaman<JabatanRead>(async (limit, off) => {
      const res = await client.GET("/api/v1/jabatan", {
        params: { query: { limit, offset: off } },
      });
      if (!res.data) throw apiErrorDari(res);
      return { items: (res.data.items ?? []) as JabatanRead[], total: res.data.total };
    }),
    ambilSemuaHalaman<TugasPokokRead>(async (limit, off) => {
      const res = await client.GET("/api/v1/task-inventory/tugas-pokok", {
        params: { query: { limit, offset: off } },
      });
      if (!res.data) throw apiErrorDari(res);
      return { items: (res.data.items ?? []) as TugasPokokRead[], total: res.data.total };
    }),
    ambilSemuaHalaman<DetilTugasRead>(async (limit, off) => {
      const res = await client.GET("/api/v1/task-inventory/detil-tugas", {
        params: { query: { limit, offset: off } },
      });
      if (!res.data) throw apiErrorDari(res);
      return { items: (res.data.items ?? []) as DetilTugasRead[], total: res.data.total };
    }),
  ]);

  if (!uraianRes.data) throw apiErrorDari(uraianRes);

  return {
    uraianTugas: (uraianRes.data.items ?? []) as UraianTugasRead[],
    total: uraianRes.data.total,
    jabatan,
    tugasPokok,
    detilTugas,
  };
}
