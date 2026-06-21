import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JabatanRead, MataPelajaranRead, SekolahRead } from "@/lib/api/schema";
import { TambahPartisipanForm } from "./partisipan-form";

export const metadata = { title: "Tambah Partisipan — ANJAB-ABK" };

async function fetchReferenceData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);

  const [sekolahRes, jabatanRes, mataPelajaranRes] = await Promise.all([
    client.GET("/api/v1/sekolah", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/mata-pelajaran", { params: { query: { limit: 100 } } }),
  ]);

  if (!sekolahRes.data) throw toApiError(null, sekolahRes.response.headers.get("x-request-id"));
  if (!jabatanRes.data) throw toApiError(null, jabatanRes.response.headers.get("x-request-id"));
  if (!mataPelajaranRes.data)
    throw toApiError(null, mataPelajaranRes.response.headers.get("x-request-id"));

  return {
    sekolah: sekolahRes.data?.items ?? ([] as SekolahRead[]),
    jabatan: jabatanRes.data?.items ?? ([] as JabatanRead[]),
    mataPelajaran: mataPelajaranRes.data?.items ?? ([] as MataPelajaranRead[]),
  };
}

export default async function TambahPartisipanPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { sekolah, jabatan, mataPelajaran } = await fetchReferenceData(session?.accessToken);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Tambah Partisipan</h1>
        <p className="page-subtext">
          Akun Authentik akan dibuat otomatis. Partisipan dapat langsung login dengan email yang
          didaftarkan.
        </p>
      </div>

      <div className="max-w-2xl">
        <TambahPartisipanForm
          sekolah={sekolah}
          jabatan={jabatan}
          mataPelajaran={mataPelajaran}
          accessToken={session?.accessToken}
        />
      </div>
    </div>
  );
}
