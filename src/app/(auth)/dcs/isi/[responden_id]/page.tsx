import { notFound } from "next/navigation";
import Link from "next/link";
import { auth, isPartisipan } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { DcsRespondenRead, DcsSubSkalaWithItemsRead, DcsJawabanRead } from "@/lib/api/schema";
import { DcsForm } from "./dcs-form";

export const metadata = { title: "Isi Kuesioner DCS — ANJAB-ABK" };

const DCS_SUBSKALA = ["DEMAND", "CONTROL", "SUPPORT"] as const;

interface Props {
  params: Promise<{ responden_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, respondenId: string) {
  const client = withServerAuth(accessToken);
  const [respondenRes, ...subskalaRes] = await Promise.all([
    client.GET("/api/v1/dcs/sesi/responden/{responden_id}", {
      params: { path: { responden_id: respondenId } },
    }),
    ...DCS_SUBSKALA.map((kode) =>
      client.GET("/api/v1/dcs/sub-skala/{kode}", { params: { path: { kode } } }),
    ),
  ]);
  const reqId = respondenRes.response.headers.get("x-request-id");
  if (respondenRes.error) throw toApiError(respondenRes.error, reqId);

  const responden = respondenRes.data as DcsRespondenRead;
  const subskala = subskalaRes.map((r) => r.data).filter(Boolean) as DcsSubSkalaWithItemsRead[];

  let jawaban: DcsJawabanRead[] = [];
  if (responden.sudah_submit) {
    const jRes = await client.GET("/api/v1/dcs/sesi/responden/{responden_id}/jawaban", {
      params: { path: { responden_id: respondenId } },
    });
    jawaban = (jRes.data ?? []) as DcsJawabanRead[];
  }

  return { responden, subskala, jawaban };
}

export default async function DcsIsiPage({ params }: Props) {
  const session = await auth();
  if (!isPartisipan(session)) notFound();

  const { responden_id } = await params;
  const { responden, subskala, jawaban } = await fetchPageData(session?.accessToken, responden_id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/kuesioner" className="hover:text-gray-700">
          Kuesioner Saya
        </Link>
        <span>/</span>
        <span className="text-gray-900">DCS</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="page-heading">Kuesioner DCS</h1>
        <p className="page-subtext">{responden.nama ?? "Anonim"}</p>
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

      <DcsForm
        respondenId={responden_id}
        subskala={subskala}
        jawabanAwal={jawaban}
        sudahSubmit={responden.sudah_submit}
        accessToken={session?.accessToken}
      />
    </div>
  );
}
