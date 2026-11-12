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
import { fiturAktif } from "@/lib/fitur";
import { bacaEtag } from "@/lib/konkurensi";
import { perluCeritaBebas } from "@/lib/ti-prabank";
import type {
  PrabankRead,
  TiCatalogRead,
  TiRespondenRead,
  TiSeleksiRead,
  TiSesiRead,
  TiUsulanRead,
} from "@/lib/api/schema";

export interface Tahap1PageData {
  responden: TiRespondenRead;
  sesi: TiSesiRead;
  /** Kosong bila {@link Tahap1PageData.modeCerita} (bank tugas sengaja tidak diambil). */
  catalog: TiCatalogRead[];
  /** `true` bila saklar `PREBANK_FREEZE` hidup dan responden belum terpapar bank tugas. */
  modeCerita: boolean;
  /** Status cerita/paparan; `null` bila saklar `PREBANK_FREEZE` mati (panggilan tidak dilakukan). */
  prabank: PrabankRead | null;
  terpilih: string[];
  usulan: TiUsulanRead[];
  /** Header `ETag` dari `GET .../seleksi`; `null` bila belum pernah menyimpan seleksi (404). */
  seleksiEtag: string | null;
}

/**
 * Ambil seluruh data halaman Tahap 1.
 *
 * Bila saklar `PREBANK_FREEZE` hidup, `GET .../prabank` dipanggil LEBIH DULU dan katalog
 * hanya diambil jika responden sudah terpapar; selama `BELUM_TERPAPAR` tidak ada satu pun
 * request katalog (bank tugas tidak boleh sampai ke browser sebelum cerita dibekukan).
 * Saklar mati: perilaku identik dengan sebelumnya (tanpa panggilan `prabank`).
 *
 * @param accessToken - Token akses sesi untuk Bearer.
 * @param respondenId - ID responden Task Inventory.
 * @returns Data halaman, termasuk `modeCerita` dan `prabank`.
 * @throws ApiError bila request inti gagal (termasuk `system/fitur` dan `prabank`).
 */
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

  // Gerbang pra-bank (UX-01): saklar dibaca sebagai data inti (gagal -> lempar).
  let prabank: PrabankRead | null = null;
  let modeCerita = false;
  if (await fiturAktif(client, "PREBANK_FREEZE")) {
    const pbRes = await client.GET("/api/v1/task-inventory/sesi/responden/{responden_id}/prabank", {
      params: { path: { responden_id: respondenId } },
    });
    if (!pbRes.data) throw apiErrorDari(pbRes);
    prabank = pbRes.data;
    modeCerita = perluCeritaBebas(true, prabank.exposure_state);
  }

  // Kuesioner Tahap 1 butuh SELURUH task katalog jabatan; endpoint kini `Page[T]`
  // dengan default limit 20, jadi limit tinggi eksplisit wajib agar tak terpotong.
  let catalog: TiCatalogRead[] = [];
  if (!modeCerita) {
    const catalogRes = await client.GET("/api/v1/task-inventory/catalog", {
      params: { query: { jabatan_id: sesi.jabatan_id, limit: 500 } },
    });
    if (!catalogRes.data) throw apiErrorDari(catalogRes);
    catalog = (catalogRes.data.items ?? []) as TiCatalogRead[];
  }

  // PENGECUALIAN yang disengaja: backend melempar 404 ("Responden belum submit
  // seleksi Tahap 1") bila responden belum pernah menyimpan pilihan apa pun —
  // itu kondisi SAH pada kunjungan pertama, bukan kegagalan. HANYA 404 yang
  // diterjemahkan jadi "belum ada pilihan"; 401/403/5xx tetap dilempar.
  const selRes = await client.GET("/api/v1/task-inventory/sesi/responden/{responden_id}/seleksi", {
    params: { path: { responden_id: respondenId } },
  });
  let terpilih: string[] = [];
  let seleksiEtag: string | null = null;
  if (selRes.data) {
    terpilih = (selRes.data as TiSeleksiRead).task_kode;
    seleksiEtag = bacaEtag(selRes.response);
  } else {
    const err = apiErrorDari(selRes);
    if (err.status !== 404) throw err;
  }

  // Usulan uraian tugas tambahan milik responden ini (langkah 3 Tahap 1) — daftar,
  // bukan objek tunggal, jadi tidak ada kondisi "belum ada" yang perlu ditoleransi
  // seperti seleksi 404 di atas: koleksi kosong pada kunjungan pertama sudah sah
  // sebagai `[]` dari backend sendiri.
  let usulan: TiUsulanRead[] = [];
  if (!modeCerita) {
    const usulanRes = await client.GET(
      "/api/v1/task-inventory/sesi/responden/{responden_id}/usulan",
      {
        params: { path: { responden_id: respondenId } },
      },
    );
    if (!usulanRes.data) throw apiErrorDari(usulanRes);
    usulan = usulanRes.data as TiUsulanRead[];
  }

  return { responden, sesi, catalog, modeCerita, prabank, terpilih, usulan, seleksiEtag };
}
