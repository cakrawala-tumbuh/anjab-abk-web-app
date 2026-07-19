import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { ApiError, apiErrorDari } from "@/lib/api/errors";
import { TidakBerhak } from "@/components/gagal-muat";
import type {
  TiSesiRead,
  TiTahap2ReviewRead,
  TiCatalogRead,
  TiRespondenRead,
} from "@/lib/api/schema";
import { ReviewForm } from "./review-form";
import { PetunjukTahap2 } from "./petunjuk-tahap2";

export const metadata = { title: "Tahap 2 — Review Koordinator" };

const JUDUL = "Tahap 2 — Review Koordinator";

interface Props {
  params: Promise<{ sesi_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, sesiId: string) {
  const client = withServerAuth(accessToken);
  const sesiRes = await client.GET("/api/v1/task-inventory/sesi/{sesi_id}", {
    params: { path: { sesi_id: sesiId } },
  });
  if (!sesiRes.data) throw apiErrorDari(sesiRes);
  const sesi = sesiRes.data as TiSesiRead;

  const [sayaRes, catalogRes, respondenRes] = await Promise.all([
    client.GET("/api/v1/partisipan/saya"),
    client.GET("/api/v1/task-inventory/catalog", {
      params: { query: { jabatan_id: sesi.jabatan_id } },
    }),
    client.GET("/api/v1/task-inventory/sesi/{sesi_id}/responden", {
      params: { path: { sesi_id: sesiId } },
    }),
  ]);

  // OPSIONAL (sengaja ditelan): admin yang bukan partisipan tidak punya baris
  // `/partisipan/saya` → 404 adalah jawaban yang SAH di sini, bukan kegagalan.
  const partisipanId = sayaRes.data?.id ?? null;

  // Data kritis — kegagalan tidak boleh menyamar jadi daftar kosong.
  // `respondenList` menentukan `isAnggota`; ditelan jadi `[]` membuat anggota
  // panel yang sah justru dilempar ke notFound().
  if (!catalogRes.data) throw apiErrorDari(catalogRes);
  if (!respondenRes.data) throw apiErrorDari(respondenRes);

  const catalog = catalogRes.data as TiCatalogRead[];
  const kodeToUraian: Record<string, string> = {};
  for (const c of catalog) kodeToUraian[c.kode] = c.uraian_tugas;

  const respondenList = respondenRes.data as TiRespondenRead[];

  // Review Tahap 2 hanya tersedia setelah TAHAP2 (backend menolak 422 sebelum
  // itu). Di dalam status yang sah, kegagalan = kegagalan sungguhan → lempar;
  // sebelumnya `?? null` membuat 403/422/500 tampil sebagai "tidak ada task
  // partial" — persis notifikasi bohong yang dilarang.
  let review: TiTahap2ReviewRead | null = null;
  if (["TAHAP2", "TAHAP3", "CLOSED", "ANALYZED"].includes(sesi.status)) {
    const reviewRes = await client.GET("/api/v1/task-inventory/sesi/{sesi_id}/tahap2", {
      params: { path: { sesi_id: sesiId } },
    });
    if (!reviewRes.data) throw apiErrorDari(reviewRes);
    review = reviewRes.data as TiTahap2ReviewRead;
  }

  return { sesi, review, partisipanId, kodeToUraian, respondenList };
}

export default async function Tahap2KoordinatorPage({ params }: Props) {
  const session = await auth();
  const { sesi_id } = await params;

  // Partisipan bukan admin/koordinator/anggota panel ditolak backend (403) —
  // ditampilkan sebagai panel "tidak berwenang", bukan crash Server Components.
  // Status lain (401/404/5xx) tetap dilempar apa adanya (tidak tertelan di sini).
  let data: Awaited<ReturnType<typeof fetchPageData>>;
  try {
    data = await fetchPageData(session?.accessToken, sesi_id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) {
      return <TidakBerhak judul={JUDUL} err={err} />;
    }
    throw err;
  }
  const { sesi, review, partisipanId, kodeToUraian, respondenList } = data;

  const admin = isAdmin(session);
  const isKoordinator = !!partisipanId && partisipanId === sesi.koordinator_id;
  const isAnggota = !!partisipanId && respondenList.some((r) => r.partisipan_id === partisipanId);

  if (!admin && !isKoordinator && !isAnggota) notFound();

  const canEdit = admin || isKoordinator;
  const readOnly = !canEdit || sesi.status !== "TAHAP2";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {admin ? (
          <>
            <Link href="/task-inventory" className="hover:text-gray-700">
              Task Inventory
            </Link>
            <span>/</span>
            <Link href={`/task-inventory/${sesi.id}`} className="hover:text-gray-700">
              {sesi.jabatan_nama ?? sesi.jabatan_id}
            </Link>
          </>
        ) : (
          <span>{sesi.jabatan_nama ?? sesi.jabatan_id}</span>
        )}
        <span>/</span>
        <span className="text-gray-900">Review Koordinator Tahap 2</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">Tahap 2 — Review Koordinator</h1>
          <p className="page-subtext">
            Tentukan relevansi task yang tidak dipilih unanimously oleh semua anggota panel. Task
            yang disetujui akan digabung dengan task unanimous saat masuk Tahap 3.
          </p>
        </div>
        <PetunjukTahap2 defaultOpen={canEdit && sesi.status === "TAHAP2"} />
      </div>

      {!canEdit && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Anda melihat hasil Tahap 2 sebagai anggota panel (hanya-baca). Keputusan ditetapkan oleh
          koordinator.
        </div>
      )}

      {canEdit && sesi.status !== "TAHAP2" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Analisis jabatan ini sudah melewati Tahap 2 (status: <strong>{sesi.status}</strong>).
          Keputusan tidak dapat diubah.
        </div>
      )}

      {!review || review.tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tidak ada task partial — semua task dipilih secara unanimous atau belum ada yang submit
            Tahap 1.
          </p>
        </div>
      ) : (
        <>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>
              Total partial: <strong>{review.tasks.length}</strong>
            </span>
          </div>
          <ReviewForm
            sesiId={sesi_id}
            review={review}
            accessToken={session?.accessToken}
            readOnly={readOnly}
            kodeToUraian={kodeToUraian}
          />
        </>
      )}
    </div>
  );
}
