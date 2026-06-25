import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TiKombinasiRead } from "@/lib/api/schema";

export const metadata = { title: "Instrumen Task Inventory — Master Data" };

async function fetchKombinasi(accessToken: string | undefined): Promise<TiKombinasiRead[]> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/task-inventory/catalog/kombinasi");
  const requestId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, requestId);
  return data;
}

export default async function TiMasterDataPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const kombinasi = await fetchKombinasi(session?.accessToken);

  const grouped = kombinasi.reduce<Record<string, TiKombinasiRead[]>>((acc, k) => {
    if (!acc[k.unit]) acc[k.unit] = [];
    acc[k.unit].push(k);
    return acc;
  }, {});
  const units = Object.keys(grouped).sort();
  const totalTask = kombinasi.reduce((n, k) => n + k.jumlah_task, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Instrumen Task Inventory
        </h2>
        <p className="page-subtext">
          {kombinasi.length} kombinasi unit × jabatan, total {totalTask} task. Pilih kombinasi untuk
          melihat daftar task yang tersedia.
        </p>
      </div>

      {units.map((unit) => (
        <div key={unit} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {unit}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grouped[unit].map((k) => (
              <Link
                key={`${k.unit}-${k.jabatan_id}`}
                href={`/master-data/task-inventory/${encodeURIComponent(k.unit)}/${encodeURIComponent(k.jabatan_id)}`}
                className="group rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
              >
                <p className="font-medium text-gray-900 group-hover:text-blue-700 dark:text-gray-100 dark:group-hover:text-blue-400">
                  {k.jabatan_nama}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    {k.jumlah_task} task
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Lihat task →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
