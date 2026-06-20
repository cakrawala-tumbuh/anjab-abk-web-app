import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { DcsRespondenRead, DcsSesiRead, JabatanRead, PartisipanRead } from "@/lib/api/schema";
import { TransisiSesi } from "./transisi-sesi";
import { TambahResponden } from "./tambah-responden";
import { HapusResponden } from "./hapus-responden";

export const metadata = { title: "Detail Sesi DCS — ANJAB-ABK" };

const STATUS_LABEL: Record<string, { label: string; cls: string; desc: string }> = {
  DRAFT: {
    label: "Draft",
    cls: "bg-gray-100 text-gray-600",
    desc: "Sesi belum dibuka. Buka sesi agar responden dapat didaftarkan.",
  },
  OPEN: {
    label: "Terbuka",
    cls: "bg-blue-100 text-blue-700",
    desc: "Sesi aktif. Daftarkan responden, lalu tutup sesi bila sudah selesai.",
  },
  CLOSED: {
    label: "Tertutup",
    cls: "bg-yellow-100 text-yellow-700",
    desc: "Pendaftaran ditutup. Jalankan analisis untuk memproses hasil.",
  },
  ANALYZED: {
    label: "Teranalisis",
    cls: "bg-green-100 text-green-700",
    desc: "Analisis selesai. Lihat hasil di halaman laporan.",
  },
};

interface Props {
  params: Promise<{ sesi_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, sesiId: string) {
  const client = withServerAuth(accessToken);
  const [sesiRes, respondenRes, jabatanRes, partisipanRes] = await Promise.all([
    client.GET("/api/v1/dcs/sesi/{sesi_id}", { params: { path: { sesi_id: sesiId } } }),
    client.GET("/api/v1/dcs/sesi/{sesi_id}/responden", { params: { path: { sesi_id: sesiId } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/partisipan", { params: { query: { limit: 100 } } }),
  ]);
  const reqId = sesiRes.response.headers.get("x-request-id");
  if (!sesiRes.data) throw toApiError(null, reqId);
  return {
    sesi: sesiRes.data as DcsSesiRead,
    responden: (respondenRes.data ?? []) as DcsRespondenRead[],
    jabatan: (jabatanRes.data?.items ?? []) as JabatanRead[],
    partisipan: (partisipanRes.data?.items ?? []) as PartisipanRead[],
  };
}

export default async function DcsSesiDetailPage({ params }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { sesi_id } = await params;
  const { sesi, responden, jabatan, partisipan } = await fetchPageData(
    session?.accessToken,
    sesi_id,
  );

  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j.nama]));
  const jabatanNama = jabatanMap[sesi.jabatan_id] ?? sesi.jabatan_id;
  const st = STATUS_LABEL[sesi.status] ?? {
    label: sesi.status,
    cls: "bg-gray-100 text-gray-500",
    desc: "",
  };

  const sudahSubmit = responden.filter((r) => r.sudah_submit).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dcs" className="hover:text-gray-700">
          Sesi DCS
        </Link>
        <span>/</span>
        <span className="text-gray-900">{jabatanNama}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{jabatanNama}</h1>
          <p className="mt-1 font-mono text-sm text-gray-500">{sesi.periode}</p>
          {sesi.catatan && <p className="mt-2 text-sm text-gray-600 italic">{sesi.catatan}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${st.cls}`}>
            {st.label}
          </span>
          <p className="text-right text-xs text-gray-400 max-w-xs">{st.desc}</p>
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{responden.length}</p>
          <p className="mt-1 text-xs text-gray-500">Terdaftar</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{sudahSubmit}</p>
          <p className="mt-1 text-xs text-gray-500">Sudah Mengisi</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">
            {sesi.min_responden}–{sesi.max_responden}
          </p>
          <p className="mt-1 text-xs text-gray-500">Target Responden</p>
        </div>
      </div>

      {/* Aksi transisi status */}
      <TransisiSesi sesi={sesi} accessToken={session?.accessToken} />

      {/* Tambah responden (hanya saat OPEN) */}
      {sesi.status === "OPEN" && (
        <div>
          <h2 className="mb-4 text-lg font-medium text-gray-900">Tambah Responden</h2>
          <TambahResponden
            sesiId={sesi.id}
            partisipan={partisipan}
            jabatan={jabatan}
            accessToken={session?.accessToken}
          />
        </div>
      )}

      {/* Daftar responden */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-900">
          Daftar Responden ({responden.length})
        </h2>
        {responden.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">
              {sesi.status === "OPEN"
                ? "Belum ada responden. Gunakan form di atas untuk mendaftarkan partisipan."
                : "Belum ada responden yang terdaftar di sesi ini."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nama</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Jabatan</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status Isian</th>
                  {sesi.status === "OPEN" && (
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {responden.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {r.nama ?? <span className="italic text-gray-400">Anonim</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.jabatan_label}</td>
                    <td className="px-4 py-3">
                      {r.sudah_submit ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          <span aria-hidden>✓</span> Sudah diisi
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          Belum diisi
                        </span>
                      )}
                    </td>
                    {sesi.status === "OPEN" && (
                      <td className="px-4 py-3">
                        {!r.sudah_submit && (
                          <HapusResponden
                            respondenId={r.id}
                            nama={r.nama ?? "Anonim"}
                            accessToken={session?.accessToken}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
