import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isPartisipan } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";
import { TsLogEditForm } from "./ts-log-edit-form";

type TsLogRead = components["schemas"]["TsLogRead"];

export const metadata = { title: "Edit Log Harian — Time Study — ANJAB-ABK" };

interface Props {
  params: Promise<{ responden_id: string; log_id: string }>;
}

async function fetchLog(
  accessToken: string | undefined,
  respondenId: string,
  logId: string,
): Promise<TsLogRead> {
  const client = withServerAuth(accessToken);
  const { data, error, response } = await client.GET(
    "/api/v1/time-study/responden/{responden_id}/log/{log_id}",
    { params: { path: { responden_id: respondenId, log_id: logId } } },
  );
  const reqId = response.headers.get("x-request-id");
  if (error) throw toApiError(error, reqId);
  return data as TsLogRead;
}

export default async function EditLogPage({ params }: Props) {
  const session = await auth();
  if (!isPartisipan(session)) notFound();

  const { responden_id, log_id } = await params;
  const log = await fetchLog(session?.accessToken, responden_id, log_id);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/kuesioner" className="hover:text-gray-700">
          Kuesioner Saya
        </Link>
        <span>/</span>
        <Link href={`/time-study/isi/${responden_id}`} className="hover:text-gray-700">
          Time Study
        </Link>
        <span>/</span>
        <span className="text-gray-900">Edit Log</span>
      </div>

      <div>
        <h1 className="page-heading">Edit Log Harian</h1>
        <p className="page-subtext">
          Tanggal: <strong className="font-mono">{log.tanggal}</strong>
        </p>
      </div>

      <TsLogEditForm
        respondenId={responden_id}
        logId={log_id}
        initialData={log}
        accessToken={session?.accessToken}
      />
    </div>
  );
}
