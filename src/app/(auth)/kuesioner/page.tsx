import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isPartisipan } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import type {
  DcsKuesionerItemRead,
  TiKuesionerItemRead,
  WcpKuesionerItemRead,
  components,
} from "@/lib/api/schema";

type TsKuesionerItemRead = components["schemas"]["TsKuesionerItemRead"];

export const metadata = { title: "Kuesioner Saya — ANJAB-ABK" };

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Terbuka",
  CLOSED: "Tertutup",
  DRAFT: "Draft",
  ANALYZED: "Teranalisis",
  TAHAP1: "Tahap 1",
  TAHAP2: "Tahap 2 — Review Koordinator",
  TAHAP3: "Tahap 3",
};

async function fetchKuesioner(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [dcsRes, wcpRes, tiRes, tsRes] = await Promise.all([
    client.GET("/api/v1/dcs/kuesioner/saya"),
    client.GET("/api/v1/wcp/kuesioner/saya"),
    client.GET("/api/v1/task-inventory/kuesioner/saya"),
    client.GET("/api/v1/time-study/kuesioner/saya"),
  ]);
  return {
    dcs: (dcsRes.data ?? []) as DcsKuesionerItemRead[],
    wcp: (wcpRes.data ?? []) as WcpKuesionerItemRead[],
    ti: (tiRes.data ?? []) as TiKuesionerItemRead[],
    ts: (tsRes.data ?? []) as TsKuesionerItemRead[],
  };
}

/** True bila ada fase Task Inventory yang masih harus dikerjakan partisipan. */
function tiPerluDiisi(k: TiKuesionerItemRead): boolean {
  return (
    (k.sesi_status === "TAHAP1" && !k.tahap1_submit) ||
    (k.sesi_status === "TAHAP3" && !k.tahap3_submit)
  );
}

export default async function KuesionerSayaPage() {
  const session = await auth();
  if (!isPartisipan(session)) notFound();

  const { dcs, wcp, ti, ts } = await fetchKuesioner(session?.accessToken);
  const total = dcs.length + wcp.length + ti.length + ts.length;
  const belumDiisi =
    dcs.filter((k) => !k.sudah_submit && k.sesi_status === "OPEN").length +
    wcp.filter((k) => !k.sudah_submit && k.sesi_status === "OPEN").length +
    ti.filter(tiPerluDiisi).length +
    ts.filter((k) => k.sesi_status === "OPEN").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-heading">Kuesioner Saya</h1>
        <p className="page-subtext">
          {total === 0
            ? "Belum ada alat ukur yang aktif."
            : `${total} alat ukur, ${belumDiisi} belum diisi.`}
        </p>
      </div>

      {total === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada alat ukur yang aktif untuk Anda.
          </p>
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
                label={k.sesi_catatan ?? k.sesi_periode}
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
                label={k.sesi_catatan ?? k.sesi_periode}
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

      {/* Time Study */}
      {ts.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-gray-900">Time Study — Studi Waktu</h2>
          <div className="space-y-3">
            {ts.map((k) => (
              <TsKuesionerCard key={k.id} item={k} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function KuesionerCard({
  label,
  periode,
  sesi_status,
  sudah_submit,
  href,
  tipe,
}: {
  label: string;
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
        <p className="font-medium text-gray-900 dark:text-gray-50">{label}</p>
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

function TsKuesionerCard({ item }: { item: TsKuesionerItemRead }) {
  const isOpen = item.sesi_status === "OPEN";

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-50">{item.jabatan_label}</p>
        <p className="mt-0.5 text-sm text-gray-500">Time Study · Periode {item.sesi_periode}</p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              isOpen ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {STATUS_LABEL[item.sesi_status] ?? item.sesi_status}
          </span>
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {item.jumlah_log} log hari
          </span>
        </div>
      </div>
      <div className="ml-4 shrink-0">
        {isOpen ? (
          <Link
            href={`/time-study/isi/${item.id}`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Tambah Log
          </Link>
        ) : (
          <Link
            href={`/time-study/isi/${item.id}`}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Lihat Log
          </Link>
        )}
      </div>
    </div>
  );
}

function TiKuesionerCard({ item }: { item: TiKuesionerItemRead }) {
  const { sesi_status, tahap1_submit, tahap3_submit } = item;

  // Tentukan fase aktif yang harus dikerjakan partisipan.
  const fase: 1 | 3 | null =
    sesi_status === "TAHAP1" && !tahap1_submit
      ? 1
      : sesi_status === "TAHAP3" && !tahap3_submit
        ? 3
        : null;
  const href =
    fase === 1 ? `/task-inventory/tahap1/${item.id}` : `/task-inventory/tahap3/${item.id}`;
  const aktif = sesi_status === "TAHAP1" || sesi_status === "TAHAP2" || sesi_status === "TAHAP3";
  const canFill = fase !== null;

  // "Sudah diisi" untuk fase yang sedang berjalan.
  const faseSelesai =
    (sesi_status === "TAHAP1" && tahap1_submit) || (sesi_status === "TAHAP3" && tahap3_submit);

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-50">
          {item.sesi_jabatan_nama ?? item.sesi_jabatan_id}
        </p>
        <p className="mt-0.5 text-sm text-gray-500">Task Inventory · Periode {item.sesi_periode}</p>
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
            Isi {fase === 1 ? "Tahap 1" : "Tahap 3"}
          </Link>
        ) : item.is_koordinator && sesi_status === "TAHAP2" ? (
          <Link
            href={`/task-inventory/tahap2/${item.sesi_id}`}
            className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Review Koordinator
          </Link>
        ) : !item.is_koordinator && sesi_status === "TAHAP2" ? (
          <Link
            href={`/task-inventory/tahap2/${item.sesi_id}`}
            className="rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100"
          >
            Lihat Tahap 2
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
