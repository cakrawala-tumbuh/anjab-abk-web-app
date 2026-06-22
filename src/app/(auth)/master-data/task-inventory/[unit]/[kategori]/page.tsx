import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TiCatalogRead } from "@/lib/api/schema";

interface PageProps {
  params: Promise<{ unit: string; kategori: string }>;
}

export const metadata = { title: "Catalog Task — Master Data" };

async function fetchCatalog(
  unit: string,
  kategori_jabatan: string,
  accessToken: string | undefined,
): Promise<TiCatalogRead[]> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/task-inventory/catalog", {
    params: { query: { unit, kategori_jabatan } },
  });
  const requestId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, requestId);
  return data;
}

export default async function TiKombinasiDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { unit, kategori } = await params;
  const kategori_jabatan = decodeURIComponent(kategori);
  const catalog = await fetchCatalog(unit, kategori_jabatan, session?.accessToken);

  if (catalog.length === 0) notFound();

  const grouped = catalog.reduce<Record<string, Record<string, TiCatalogRead[]>>>((acc, item) => {
    if (!acc[item.tugas_pokok]) acc[item.tugas_pokok] = {};
    if (!acc[item.tugas_pokok][item.detil_tugas]) acc[item.tugas_pokok][item.detil_tugas] = [];
    acc[item.tugas_pokok][item.detil_tugas].push(item);
    return acc;
  }, {});

  const tugasPokokList = Object.keys(grouped);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/master-data/task-inventory"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Kembali ke daftar kombinasi
        </Link>
        <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-base dark:bg-gray-700">
            {unit}
          </span>{" "}
          — {kategori_jabatan}
        </h2>
        <p className="page-subtext">
          {catalog.length} task dalam {tugasPokokList.length} tugas pokok. Data bersumber dari
          catalog bawaan sistem (read-only).
        </p>
      </div>

      <div className="space-y-2">
        {tugasPokokList.map((tugasPokok) => {
          const detilMap = grouped[tugasPokok];
          const totalTask = Object.values(detilMap).reduce((n, arr) => n + arr.length, 0);
          return (
            <details
              key={tugasPokok}
              className="group rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              <summary className="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <span className="font-medium text-gray-900 dark:text-gray-100">{tugasPokok}</span>
                <span className="ml-2 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  {totalTask} task
                </span>
              </summary>

              <div className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-700 dark:border-gray-700">
                {Object.entries(detilMap).map(([detilTugas, items]) => (
                  <div key={detilTugas} className="px-4 py-3">
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {detilTugas}
                    </p>
                    <ul className="space-y-1.5">
                      {items.map((item) => (
                        <li key={item.kode} className="flex items-start gap-3 text-sm">
                          <span className="mt-0.5 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                            {item.kode}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {item.uraian_tugas}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
