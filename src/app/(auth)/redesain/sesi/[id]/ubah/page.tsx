import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { auth } from "@/lib/auth/auth";
import { fetchOpsiFormSesi, fetchSesi } from "../../data";
import { SesiForm } from "../../sesi-form";

export const metadata = { title: "Ubah Sesi — Redesain Pekerjaan" };

interface Props {
  params: Promise<{ id: string }>;
}

/** Halaman ubah sesi partisipasi (Server Component). 404 → `notFound()`; lainnya dilempar. */
export default async function UbahSesiPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  let awal;
  try {
    awal = await fetchSesi(session?.accessToken, id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const opsi = await fetchOpsiFormSesi(session?.accessToken);
  return (
    <div className="space-y-4">
      <h1 className="page-heading">
        Ubah Sesi {awal.kode_sesi} · {awal.kode_orang}
      </h1>
      <SesiForm awal={awal} {...opsi} accessToken={session?.accessToken} />
    </div>
  );
}
