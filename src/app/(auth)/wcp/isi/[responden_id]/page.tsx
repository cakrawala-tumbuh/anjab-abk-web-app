import { notFound } from "next/navigation";
import Link from "next/link";
import { auth, isPartisipan } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { WcpRespondenRead, WcpDimensiWithItemsRead, WcpJawabanRead } from "@/lib/api/schema";
import { WcpForm } from "./wcp-form";

export const metadata = { title: "Isi Kuesioner WCP — ANJAB-ABK" };

const WCP_DIMENSI = [
  "SC",
  "TM",
  "AS",
  "RC",
  "DA",
  "WP",
  "PC",
  "SS",
  "CH",
  "SD",
  "PI",
  "RA",
] as const;

interface Props {
  params: Promise<{ responden_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, respondenId: string) {
  const client = withServerAuth(accessToken);
  const [respondenRes, ...dimensiRes] = await Promise.all([
    client.GET("/api/v1/wcp/sesi/responden/{responden_id}", {
      params: { path: { responden_id: respondenId } },
    }),
    ...WCP_DIMENSI.map((kode) =>
      client.GET("/api/v1/wcp/dimensi/{kode}", { params: { path: { kode } } }),
    ),
  ]);
  const reqId = respondenRes.response.headers.get("x-request-id");
  if (respondenRes.error) throw toApiError(respondenRes.error, reqId);

  const responden = respondenRes.data as WcpRespondenRead;
  const dimensi = dimensiRes.map((r) => r.data).filter(Boolean) as WcpDimensiWithItemsRead[];

  let jawaban: WcpJawabanRead[] = [];
  if (responden.sudah_submit) {
    const jRes = await client.GET("/api/v1/wcp/sesi/responden/{responden_id}/jawaban", {
      params: { path: { responden_id: respondenId } },
    });
    jawaban = (jRes.data ?? []) as WcpJawabanRead[];
  }

  return { responden, dimensi, jawaban };
}

export default async function WcpIsiPage({ params }: Props) {
  const session = await auth();
  if (!isPartisipan(session)) notFound();

  const { responden_id } = await params;
  const { responden, dimensi, jawaban } = await fetchPageData(session?.accessToken, responden_id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/kuesioner" className="hover:text-gray-700">
          Kuesioner Saya
        </Link>
        <span>/</span>
        <span className="text-gray-900">WCP</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Kuesioner WCP</h1>
        <p className="mt-1 text-sm text-gray-500">
          {responden.jabatan_label} · {responden.nama ?? "Anonim"}
        </p>
      </div>

      {responden.sudah_submit ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            Kuesioner sudah diisi pada{" "}
            {responden.submitted_at
              ? new Date(responden.submitted_at).toLocaleString("id-ID")
              : "-"}
            .
          </p>
        </div>
      ) : null}

      <WcpForm
        respondenId={responden_id}
        dimensi={dimensi}
        jawabanAwal={jawaban}
        sudahSubmit={responden.sudah_submit}
        accessToken={session?.accessToken}
      />
    </div>
  );
}
