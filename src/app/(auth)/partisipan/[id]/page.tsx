import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JabatanRead, MataPelajaranRead, PartisipanRead, SekolahRead } from "@/lib/api/schema";
import { EditPartisipanForm } from "./edit-partisipan-form";

export const metadata = { title: "Detail Partisipan — ANJAB-ABK" };

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchPageData(accessToken: string | undefined, id: string) {
  const client = withServerAuth(accessToken);
  const [pRes, sRes, jRes, mpRes] = await Promise.all([
    client.GET("/api/v1/partisipan/{partisipan_id}", { params: { path: { partisipan_id: id } } }),
    client.GET("/api/v1/sekolah", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/mata-pelajaran", { params: { query: { limit: 100 } } }),
  ]);
  const reqId = pRes.response.headers.get("x-request-id");
  if (!pRes.data) throw toApiError(null, reqId);
  return {
    partisipan: pRes.data as PartisipanRead,
    sekolah: (sRes.data?.items ?? []) as SekolahRead[],
    jabatan: (jRes.data?.items ?? []) as JabatanRead[],
    mataPelajaran: (mpRes.data?.items ?? []) as MataPelajaranRead[],
  };
}

export default async function PartisipanDetailPage({ params }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { id } = await params;
  const { partisipan, sekolah, jabatan, mataPelajaran } = await fetchPageData(
    session?.accessToken,
    id,
  );

  const sekolahMap = Object.fromEntries(sekolah.map((s) => [s.id, s.nama]));
  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j.nama]));
  const mpMap = Object.fromEntries(mataPelajaran.map((mp) => [mp.id, mp.nama]));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/partisipan" className="hover:text-gray-700">
          Partisipan
        </Link>
        <span>/</span>
        <span className="text-gray-900">{partisipan.nama}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{partisipan.nama}</h1>
          <p className="mt-1 text-sm text-gray-500">{partisipan.email}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            partisipan.aktif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {partisipan.aktif ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {/* Info card */}
      <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Satuan Pendidikan
          </p>
          <p className="mt-1 text-sm text-gray-900">
            {sekolahMap[partisipan.sekolah_id] ?? partisipan.sekolah_id}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Jabatan Utama</p>
          <p className="mt-1 text-sm text-gray-900">
            {jabatanMap[partisipan.jabatan_utama_id] ?? partisipan.jabatan_utama_id}
          </p>
        </div>
        {partisipan.jabatan_tambahan_ids.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Jabatan Tambahan
            </p>
            <ul className="mt-1 space-y-0.5">
              {partisipan.jabatan_tambahan_ids.map((id) => (
                <li key={id} className="text-sm text-gray-900">
                  {jabatanMap[id] ?? id}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Masa Kerja</p>
          <p className="mt-1 text-sm text-gray-900">
            {partisipan.masa_kerja_tahun} tahun{" "}
            {partisipan.masa_kerja_bulan > 0 ? `${partisipan.masa_kerja_bulan} bulan` : ""}
          </p>
        </div>
        {partisipan.mata_pelajaran_utama_id && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Mata Pelajaran
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {mpMap[partisipan.mata_pelajaran_utama_id] ?? partisipan.mata_pelajaran_utama_id}
            </p>
          </div>
        )}
        {partisipan.authentik_user_id && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Akun Login</p>
            <p className="mt-1 font-mono text-xs text-gray-600">{partisipan.authentik_user_id}</p>
          </div>
        )}
      </div>

      {/* Edit form */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-900">Edit Data</h2>
        <EditPartisipanForm
          partisipan={partisipan}
          sekolah={sekolah}
          jabatan={jabatan}
          mataPelajaran={mataPelajaran}
          accessToken={session?.accessToken}
        />
      </div>
    </div>
  );
}
