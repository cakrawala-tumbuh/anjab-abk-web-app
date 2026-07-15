import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type { TiKombinasiRead } from "@/lib/api/schema";
import { TiSesiForm } from "./ti-sesi-form";

export const metadata = { title: "Mulai Analisis Jabatan — Task Inventory" };

async function fetchPageData(
  accessToken: string | undefined,
): Promise<{ kombinasi: TiKombinasiRead[] }> {
  const client = withServerAuth(accessToken);
  const kombinasiRes = await client.GET("/api/v1/task-inventory/catalog/kombinasi", {});
  if (!kombinasiRes.data) throw apiErrorDari(kombinasiRes);

  return {
    kombinasi: kombinasiRes.data as TiKombinasiRead[],
  };
}

export default async function BuatTiSesiPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { kombinasi } = await fetchPageData(session?.accessToken);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/task-inventory" className="hover:text-gray-700">
          Task Inventory
        </Link>
        <span>/</span>
        <span className="text-gray-900">Mulai Analisis Jabatan</span>
      </div>

      <div>
        <h1 className="page-heading">Mulai Analisis Jabatan — Task Inventory</h1>
        <p className="page-subtext">
          Pilih kombinasi unit & kategori jabatan beserta cabang. Setelah dibuat, mulai Tahap 1
          untuk membuka seleksi relevansi task.
        </p>
      </div>

      <TiSesiForm kombinasi={kombinasi} accessToken={session?.accessToken} />
    </div>
  );
}
