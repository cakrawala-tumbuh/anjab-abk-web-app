import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isPartisipan } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import type {
  DcsKuesionerItemRead,
  TiKuesionerItemRead,
  WcpKuesionerItemRead,
} from "@/lib/api/schema";

export const metadata = { title: "Kuesioner Saya — ANJAB-ABK" };

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka",
  CLOSED: "Tertutup",
  DRAFT: "Draft",
  ANALYZED: "Teranalisis",
  TAHAP1: "Tahap 1",
  TAHAP2: "Tahap 2",
};

async function fetchKuesioner(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [dcsRes, wcpRes, tiRes] = await Promise.all([
    client.GET("/api/v1/dcs/kuesioner/saya"),
    client.GET("/api/v1/wcp/kuesioner/saya"),
    client.GET("/api/v1/task-inventory/kuesioner/saya"),
  ]);
  return {
    dcs: (dcsRes.data ?? []) as DcsKuesionerItemRead[],
    wcp: (wcpRes.data ?? []) as WcpKuesionerItemRead[],
    ti: (tiRes.data ?? []) as TiKuesionerItemRead[],
  };
}

/** True bila ada fase Task Inventory yang masih harus dikerjakan partisipan. */
function tiPerluDiisi(k: TiKuesionerItemRead): boolean {
  return (
    (k.sesi_status === "TAHAP1" && !k.tahap1_submit) ||
    (k.sesi_status === "TAHAP2" && !k.tahap2_submit)
  );
}

export default async function KuesionerSayaPage() {
  const session = await auth();
  if (!isPartisipan(session)) notFound();

  const { dcs, wcp, ti } = await fetchKuesioner(session?.accessToken);
  const total = dcs.length + wcp.length + ti.length;
  const belumDiisi =
    dcs.filter((k) => !k.sudah_submit && k.sesi_status === "OPEN").length +
    wcp.filter((k) => !k.sudah_submit && k.sesi_status === "OPEN").length +
    ti.filter(tiPerluDiisi).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Kuesioner Saya</h1>
        <p className="mt-1 text-sm text-gray-500">
          {total === 0
            ? "Belum ada alat ukur yang aktif."
            : `${total} alat ukur, ${belumDiisi} belum diisi.`}
        </p>
      </div>

      {total === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">Belum ada alat ukur yang aktif untuk Anda.</p>
          <p className="mt-1 text-xs text-gray-400">
            Alat ukur akan muncul otomatis saat sesi studi dibuka oleh administrator.
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

      {/* Task Inventory */}
      {ti.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-gray-900">
            Task Inventory — Inventarisasi Tugas
          </h2>
          <div className="space-y-3">
            {ti.map((k) => (
              <TiKuesionerCard key={k.id} item={k} />
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

function TiKuesionerCard({ item }: { item: TiKuesionerItemRead }) {
  const { sesi_status, tahap1_submit, tahap2_submit } = item;

  // Tentukan fase aktif yang harus dikerjakan partisipan.
  const fase: 1 | 2 | null =
    sesi_status === "TAHAP1" && !tahap1_submit
      ? 1
      : sesi_status === "TAHAP2" && !tahap2_submit
        ? 2
        : null;
  const href =
    fase === 1 ? `/task-inventory/tahap1/${item.id}` : `/task-inventory/tahap2/${item.id}`;
  const aktif = sesi_status === "TAHAP1" || sesi_status === "TAHAP2";
  const canFill = fase !== null;

  // "Sudah diisi" untuk fase yang sedang berjalan.
  const faseSelesai =
    (sesi_status === "TAHAP1" && tahap1_submit) || (sesi_status === "TAHAP2" && tahap2_submit);

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <p className="font-medium text-gray-900">{item.sesi_kategori_jabatan}</p>
        <p className="mt-0.5 text-sm text-gray-500">
          Task Inventory · {item.sesi_unit} · Periode {item.sesi_periode}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              aktif ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {STATUS_LABEL[sesi_status] ?? sesi_status}
          </span>
          {faseSelesai ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <span aria-hidden>✓</span> Sudah diisi
            </span>
          ) : aktif ? (
            <span className="inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
              Belum diisi
            </span>
          ) : null}
        </div>
      </div>
      <div className="ml-4 shrink-0">
        {canFill ? (
          <Link
            href={href}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Isi {fase === 1 ? "Tahap 1" : "Tahap 2"}
          </Link>
        ) : (
          <span className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-400">
            {faseSelesai ? "Menunggu tahap berikutnya" : (STATUS_LABEL[sesi_status] ?? sesi_status)}
          </span>
        )}
      </div>
    </div>
  );
}
