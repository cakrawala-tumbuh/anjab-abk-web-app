import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { DcsSubSkalaRead } from "@/lib/api/schema";

export const metadata = { title: "Instrumen DCS — Master Data" };

async function fetchSubSkala(accessToken: string | undefined): Promise<DcsSubSkalaRead[]> {
  const client = withServerAuth(accessToken);
  const { data, response } = await client.GET("/api/v1/dcs/sub-skala");
  const requestId = response.headers.get("x-request-id");
  if (!data) throw toApiError(null, requestId);
  return data;
}

export default async function DcsMasterDataPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const subSkala = await fetchSubSkala(session?.accessToken);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Instrumen DCS — Demand·Control·Support
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Tiga sub-skala dengan total 42 item pernyataan. Pilih sub-skala untuk meninjau dan
          mengubah teks, arah penilaian, serta urutan item.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {subSkala.map((s) => (
          <Link
            key={s.id}
            href={`/master-data/dcs/${s.kode}`}
            className="group rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-400">#{s.urutan}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                {s.kode}
              </span>
            </div>
            <p className="mt-2 font-medium text-gray-900 group-hover:text-blue-700">{s.nama}</p>
            <p className="mt-1 text-xs text-gray-500">Kelola item →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
