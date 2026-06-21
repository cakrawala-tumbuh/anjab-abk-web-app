import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { WcpDimensiRead } from "@/lib/api/schema";

export const metadata = { title: "Instrumen WCP — Master Data" };

async function fetchDimensi(accessToken: string | undefined): Promise<WcpDimensiRead[]> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/wcp/dimensi");
  const requestId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, requestId);
  return data;
}

export default async function WcpMasterDataPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const dimensi = await fetchDimensi(session?.accessToken);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Instrumen WCP — Workplace Climate Profile
        </h2>
        <p className="page-subtext">
          12 dimensi dengan total 72 item pernyataan. Pilih dimensi untuk meninjau dan mengubah
          teks, tipe scoring, serta urutan item.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dimensi.map((d) => (
          <Link
            key={d.id}
            href={`/master-data/wcp/${d.kode}`}
            className="group rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-400">#{d.urutan}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                {d.kode}
              </span>
            </div>
            <p className="mt-2 font-medium text-gray-900 group-hover:text-blue-700">{d.nama}</p>
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  d.is_risk ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}
              >
                {d.is_risk ? "Dimensi risiko" : "Dimensi protektif"}
              </span>
              <span className="text-xs text-gray-500">Kelola item →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
