import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { fetchSumber } from "../data";
import { SumberForm } from "../sumber-form";

export const metadata = { title: "Tambah Sumber Narasi" };

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Halaman tambah Sumber Narasi (Server Component). Dengan `?menggantikan=<id>` formulir
 * dimuat dengan isi sumber lama sebagai nilai awal (mode revisi); sumber lama yang tidak
 * ditemukan → 404, kegagalan lain dilempar.
 */
export default async function TambahSumberPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await auth();
  const raw = sp.menggantikan;
  const idLama = (Array.isArray(raw) ? raw[0] : raw)?.trim() || null;
  const lama = idLama ? await fetchSumber(session?.accessToken, idLama) : null;
  if (idLama && !lama) notFound();

  return (
    <div className="space-y-4">
      <h1 className="page-heading">{lama ? "Revisi Sumber Narasi" : "Tambah Sumber Narasi"}</h1>
      <SumberForm awal={lama ?? undefined} accessToken={session?.accessToken} />
    </div>
  );
}
