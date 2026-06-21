import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TiKombinasiRead } from "@/lib/api/schema";
import { TiSesiForm } from "./ti-sesi-form";

export const metadata = { title: "Buat Sesi Task Inventory — ANJAB-ABK" };

async function fetchKombinasi(accessToken: string | undefined): Promise<TiKombinasiRead[]> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/task-inventory/catalog/kombinasi", {});
  const reqId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, reqId);
  return data as TiKombinasiRead[];
}

export default async function BuatTiSesiPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const kombinasi = await fetchKombinasi(session?.accessToken);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/task-inventory" className="hover:text-gray-700">
          Task Inventory
        </Link>
        <span>/</span>
        <span className="text-gray-900">Buat Sesi</span>
      </div>

      <div>
        <h1 className="page-heading">Buat Sesi Task Inventory</h1>
        <p className="page-subtext">
          Pilih kombinasi unit & kategori jabatan beserta periode. Setelah dibuat, mulai Tahap 1
          untuk membuka seleksi relevansi task.
        </p>
      </div>

      <TiSesiForm kombinasi={kombinasi} accessToken={session?.accessToken} />
    </div>
  );
}
