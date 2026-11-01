import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { auth } from "@/lib/auth/auth";
import { fetchMasalah, fetchOpsiFormMasalah } from "../../data";
import { MasalahForm } from "../../masalah-form";

export const metadata = { title: "Ubah Masalah — Redesain Pekerjaan" };

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Halaman ubah masalah redesain (Server Component).
 *
 * 404 backend → `notFound()`; kegagalan lain dilempar ke `error.tsx`.
 */
export default async function UbahMasalahPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  let awal;
  try {
    awal = await fetchMasalah(session?.accessToken, id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const opsi = await fetchOpsiFormMasalah(session?.accessToken);
  return (
    <div className="space-y-4">
      <h1 className="page-heading">Ubah Masalah {awal.kode}</h1>
      <MasalahForm awal={awal} {...opsi} accessToken={session?.accessToken} />
    </div>
  );
}
