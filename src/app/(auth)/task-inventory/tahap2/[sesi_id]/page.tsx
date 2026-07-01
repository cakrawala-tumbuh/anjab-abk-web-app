import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type {
  TiSesiRead,
  TiTahap2ReviewRead,
  TiCatalogRead,
  TiRespondenRead,
} from "@/lib/api/schema";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Tahap 2 — Review Koordinator — ANJAB-ABK" };

interface Props {
  params: Promise<{ sesi_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, sesiId: string) {
  const client = withServerAuth(accessToken);
  const sesiRes = await client.GET("/api/v1/task-inventory/sesi/{sesi_id}", {
    params: { path: { sesi_id: sesiId } },
  });
  const reqId = sesiRes.response.headers.get("x-request-id");
  if (!sesiRes.data) throw toApiError(null, reqId);
  const sesi = sesiRes.data as TiSesiRead;

  const [reviewRes, sayaRes, catalogRes, respondenRes] = await Promise.all([
    client.GET("/api/v1/task-inventory/sesi/{sesi_id}/tahap2", {
      params: { path: { sesi_id: sesiId } },
    }),
    client.GET("/api/v1/partisipan/saya"),
    client.GET("/api/v1/task-inventory/catalog", {
      params: { query: { jabatan_id: sesi.jabatan_id } },
    }),
    client.GET("/api/v1/task-inventory/sesi/{sesi_id}/responden", {
      params: { path: { sesi_id: sesiId } },
    }),
  ]);
  const review = (reviewRes.data ?? null) as TiTahap2ReviewRead | null;
  const partisipanId = sayaRes.data?.id ?? null;

  const catalog = (catalogRes.data ?? []) as TiCatalogRead[];
  const kodeToUraian: Record<string, string> = {};
  for (const c of catalog) kodeToUraian[c.kode] = c.uraian_tugas;

  const respondenList = (respondenRes.data ?? []) as TiRespondenRead[];
  return { sesi, review, partisipanId, kodeToUraian, respondenList };
}

export default async function Tahap2KoordinatorPage({ params }: Props) {
  const session = await auth();
  const { sesi_id } = await params;
  const { sesi, review, partisipanId, kodeToUraian, respondenList } = await fetchPageData(
    session?.accessToken,
    sesi_id,
  );

  const admin = isAdmin(session);
  const isKoordinator = !!partisipanId && partisipanId === sesi.koordinator_id;
  const isAnggota = !!partisipanId && respondenList.some((r) => r.partisipan_id === partisipanId);

  if (!admin && !isKoordinator && !isAnggota) notFound();

  const canEdit = admin || isKoordinator;
  const readOnly = !canEdit || sesi.status !== "TAHAP2";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/task-inventory" className="hover:text-gray-700">
          Task Inventory
        </Link>
        <span>/</span>
        <Link href={`/task-inventory/${sesi.id}`} className="hover:text-gray-700">
          {sesi.jabatan_nama ?? sesi.jabatan_id}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Review Koordinator Tahap 2</span>
      </div>

      <div>
        <h1 className="page-heading">Tahap 2 — Review Koordinator</h1>
        <p className="page-subtext">
          Tentukan relevansi task yang tidak dipilih unanimously oleh semua anggota panel. Task yang
          disetujui akan digabung dengan task unanimous saat masuk Tahap 3.
        </p>
      </div>

      {!canEdit && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Anda melihat hasil Tahap 2 sebagai anggota panel (hanya-baca). Keputusan ditetapkan oleh
          koordinator.
        </div>
      )}

      {canEdit && sesi.status !== "TAHAP2" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Sesi sudah melewati Tahap 2 (status: <strong>{sesi.status}</strong>). Keputusan tidak
          dapat diubah.
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
            {!readOnly && review.jumlah_belum_diputuskan > 0 && (
              <span className="text-amber-600">
                Belum diputuskan: <strong>{review.jumlah_belum_diputuskan}</strong>
              </span>
            )}
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
