import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isPartisipan } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import type { DcsKuesionerItemRead, WcpKuesionerItemRead } from "@/lib/api/schema";

export const metadata = { title: "Kuesioner Saya — ANJAB-ABK" };

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka",
  CLOSED: "Tertutup",
  DRAFT: "Draft",
  ANALYZED: "Teranalisis",
};

async function fetchKuesioner(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [dcsRes, wcpRes] = await Promise.all([
    client.GET("/api/v1/dcs/kuesioner/saya"),
    client.GET("/api/v1/wcp/kuesioner/saya"),
  ]);
  return {
    dcs: (dcsRes.data ?? []) as DcsKuesionerItemRead[],
    wcp: (wcpRes.data ?? []) as WcpKuesionerItemRead[],
  };
}

export default async function KuesionerSayaPage() {
  const session = await auth();
  if (!isPartisipan(session)) notFound();

  const { dcs, wcp } = await fetchKuesioner(session?.accessToken);
  const total = dcs.length + wcp.length;
  const belumDiisi =
    dcs.filter((k) => !k.sudah_submit && k.sesi_status === "OPEN").length +
    wcp.filter((k) => !k.sudah_submit && k.sesi_status === "OPEN").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Kuesioner Saya</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total === 0
            ? "Belum ada kuesioner yang ditugaskan."
            : `${total} kuesioner ditugaskan, ${belumDiisi} belum diisi.`}
        </p>
      </div>

      {total === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">
            Anda belum terdaftar sebagai responden di kuesioner manapun.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Hubungi administrator untuk informasi lebih lanjut.
          </p>
        </div>
      )}

      {/* DCS */}
      {dcs.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-gray-900">DCS — Demand-Control-Support</h2>
          <div className="space-y-3">
            {dcs.map((k) => (
              <KuesionerCard
                key={k.id}
                jabatan_label={k.jabatan_label}
                periode={k.sesi_periode}
                sesi_status={k.sesi_status}
                sudah_submit={k.sudah_submit}
                href={`/dcs/isi/${k.id}`}
                tipe="DCS"
              />
            ))}
          </div>
        </section>
      )}

      {/* WCP */}
      {wcp.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-gray-900">WCP — Work Condition Profile</h2>
          <div className="space-y-3">
            {wcp.map((k) => (
              <KuesionerCard
                key={k.id}
                jabatan_label={k.jabatan_label}
                periode={k.sesi_periode}
                sesi_status={k.sesi_status}
                sudah_submit={k.sudah_submit}
                href={`/wcp/isi/${k.id}`}
                tipe="WCP"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function KuesionerCard({
  jabatan_label,
  periode,
  sesi_status,
  sudah_submit,
  href,
  tipe,
}: {
  jabatan_label: string;
  periode: string;
  sesi_status: string;
  sudah_submit: boolean;
  href: string;
  tipe: string;
}) {
  const canFill = sesi_status === "OPEN" && !sudah_submit;

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <p className="font-medium text-gray-900">{jabatan_label}</p>
        <p className="mt-0.5 text-sm text-gray-500">
          {tipe} · Periode {periode}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              sesi_status === "OPEN" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {STATUS_LABEL[sesi_status] ?? sesi_status}
          </span>
          {sudah_submit ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <span aria-hidden>✓</span> Sudah diisi
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
              Belum diisi
            </span>
          )}
        </div>
      </div>
      <div className="ml-4 shrink-0">
        {canFill ? (
          <Link
            href={href}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Isi Sekarang
          </Link>
        ) : sudah_submit ? (
          <Link
            href={href}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Lihat Jawaban
          </Link>
        ) : (
          <span className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-400">
            {STATUS_LABEL[sesi_status] ?? sesi_status}
          </span>
        )}
      </div>
    </div>
  );
}
