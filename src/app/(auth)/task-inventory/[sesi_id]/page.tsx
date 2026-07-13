import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type {
  PartisipanRead,
  SMEPanelRead,
  TiHasilSesiRead,
  TiHasilTaskRead,
  TiRespondenRead,
  TiSesiRead,
  TiTahap2ReviewRead,
  TiTaskTerpilihRead,
} from "@/lib/api/schema";
import { TransisiSesi } from "./transisi-sesi";
import { AturKoordinator } from "./atur-koordinator";
import { TambahResponden } from "./tambah-responden";
import { AssignRespondenBanyak } from "./assign-responden-banyak";
import { HapusResponden } from "./hapus-responden";

export const metadata = { title: "Detail Analisis Jabatan — Task Inventory — ANJAB-ABK" };

const STATUS_LABEL: Record<string, { label: string; cls: string; desc: string }> = {
  DRAFT: {
    label: "Draft",
    cls: "bg-gray-100 text-gray-600",
    desc: "Daftarkan responden, lalu mulai Tahap 1 untuk membuka seleksi relevansi.",
  },
  TAHAP1: {
    label: "Tahap 1 — Seleksi",
    cls: "bg-blue-100 text-blue-700",
    desc: "Partisipan memilih task relevan. Setelah selesai, mulai Tahap 2 (review koordinator).",
  },
  TAHAP2: {
    label: "Tahap 2 — Review Koordinator",
    cls: "bg-violet-100 text-violet-700",
    desc: "Koordinator menentukan relevansi task partial. Setelah selesai, mulai Tahap 3.",
  },
  TAHAP3: {
    label: "Tahap 3 — Detailing",
    cls: "bg-indigo-100 text-indigo-700",
    desc: "Task relevan dibekukan. Partisipan mengisi field CalHR per task.",
  },
  CLOSED: {
    label: "Tertutup",
    cls: "bg-yellow-100 text-yellow-700",
    desc: "Pengisian ditutup. Jalankan analisis untuk memproses hasil.",
  },
  ANALYZED: {
    label: "Teranalisis",
    cls: "bg-green-100 text-green-700",
    desc: "Analisis selesai. Lihat hasil agregasi di bawah.",
  },
};

interface Props {
  params: Promise<{ sesi_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, sesiId: string) {
  const client = withServerAuth(accessToken);

  const sesiRes = await client.GET("/api/v1/task-inventory/sesi/{sesi_id}", {
    params: { path: { sesi_id: sesiId } },
  });
  const reqId = sesiRes.response.headers.get("x-request-id");
  if (!sesiRes.data) throw toApiError(null, reqId);
  const sesi = sesiRes.data as TiSesiRead;

  const [respondenRes, smeRes, partisipanRes] = await Promise.all([
    client.GET("/api/v1/task-inventory/sesi/{sesi_id}/responden", {
      params: { path: { sesi_id: sesiId } },
    }),
    client.POST("/api/v1/sme-panel/search", {
      body: {
        domain: [["jabatan_id", "=", sesi.jabatan_id]],
        limit: 1,
        offset: 0,
      },
    }),
    client.GET("/api/v1/partisipan", { params: { query: { limit: 200 } } }),
  ]);

  let taskTerpilih: TiTaskTerpilihRead[] = [];
  let hasil: TiHasilSesiRead | null = null;
  if (["TAHAP3", "CLOSED", "ANALYZED"].includes(sesi.status)) {
    const ttRes = await client.GET("/api/v1/task-inventory/sesi/{sesi_id}/task-terpilih", {
      params: { path: { sesi_id: sesiId } },
    });
    taskTerpilih = (ttRes.data ?? []) as TiTaskTerpilihRead[];
  }
  if (sesi.status === "ANALYZED") {
    const hRes = await client.GET("/api/v1/task-inventory/sesi/{sesi_id}/hasil", {
      params: { path: { sesi_id: sesiId } },
    });
    hasil = (hRes.data ?? null) as TiHasilSesiRead | null;
  }

  // Jumlah task partial yang belum diputuskan koordinator — dipakai tombol "Mulai Tahap 3".
  let belumDiputuskanTahap2 = 0;
  if (sesi.status === "TAHAP2") {
    const reviewRes = await client.GET("/api/v1/task-inventory/sesi/{sesi_id}/tahap2", {
      params: { path: { sesi_id: sesiId } },
    });
    const review = (reviewRes.data ?? null) as TiTahap2ReviewRead | null;
    belumDiputuskanTahap2 = review?.jumlah_belum_diputuskan ?? 0;
  }

  const smePanel = (smeRes.data?.items?.[0] ?? null) as SMEPanelRead | null;
  const allowedIds = new Set<string>(smePanel?.partisipan_ids ?? []);
  const allPartisipan = (partisipanRes.data?.items ?? []) as PartisipanRead[];
  const partisipan = allowedIds.size > 0 ? allPartisipan.filter((p) => allowedIds.has(p.id)) : [];

  return {
    sesi,
    responden: (respondenRes.data ?? []) as TiRespondenRead[],
    smePanel,
    partisipan,
    taskTerpilih,
    hasil,
    belumDiputuskanTahap2,
  };
}

export default async function TiSesiDetailPage({ params }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { sesi_id } = await params;
  const { sesi, responden, smePanel, partisipan, taskTerpilih, hasil, belumDiputuskanTahap2 } =
    await fetchPageData(session?.accessToken, sesi_id);

  const st = STATUS_LABEL[sesi.status] ?? {
    label: sesi.status,
    cls: "bg-gray-100 text-gray-500",
    desc: "",
  };
  const tahap1Submit = responden.filter((r) => r.tahap1_submit).length;
  const tahap3Submit = responden.filter((r) => r.tahap3_submit).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/task-inventory" className="hover:text-gray-700">
          Task Inventory
        </Link>
        <span>/</span>
        <span className="text-gray-900">{sesi.jabatan_nama ?? sesi.jabatan_id}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">{sesi.jabatan_nama ?? sesi.jabatan_id}</h1>
          <p className="page-subtext">
            <span className="font-mono">{sesi.periode}</span>
          </p>
          {sesi.catatan && <p className="mt-2 text-sm text-gray-600 italic">{sesi.catatan}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${st.cls}`}>
            {st.label}
          </span>
          <p className="max-w-xs text-right text-xs text-gray-400">{st.desc}</p>
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{responden.length}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Terdaftar</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{tahap1Submit}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Selesai Tahap 1</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{tahap3Submit}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Selesai Tahap 3</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{sesi.jumlah_task_terpilih ?? "—"}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Task Terpilih</p>
        </div>
      </div>

      {/* Aksi transisi status */}
      <TransisiSesi
        sesi={sesi}
        accessToken={session?.accessToken}
        belumSubmitTahap1={responden.length - tahap1Submit}
        belumDiputuskanTahap2={belumDiputuskanTahap2}
      />

      {/* Pengaturan koordinator SME panel */}
      <AturKoordinator
        sesiId={sesi.id}
        koordinatorId={sesi.koordinator_id ?? null}
        anggotaPanel={partisipan}
        hasPanel={!!smePanel}
        accessToken={session?.accessToken}
      />

      {/* Review koordinator (TAHAP2) */}
      {sesi.status === "TAHAP2" && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <p className="text-sm font-medium text-violet-800">Tahap 2 — Review Koordinator</p>
          <p className="mt-1 text-sm text-violet-700">
            Koordinator SME panel perlu menentukan relevansi task yang dipilih sebagian anggota.
          </p>
          <a
            href={`/task-inventory/tahap2/${sesi.id}`}
            className="mt-2 inline-block rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Buka Review Koordinator
          </a>
        </div>
      )}

      {/* Tambah responden (DRAFT/TAHAP1) */}
      {(sesi.status === "DRAFT" || sesi.status === "TAHAP1") && (
        <div>
          <h2 className="mb-4 text-lg font-medium text-gray-900">Tambah Responden</h2>
          {!smePanel ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              SME panel untuk jabatan ini belum dibuat. Buat SME panel terlebih dahulu di{" "}
              <Link href="/master-data/sme-panel/tambah" className="font-medium underline">
                Master Data → SME Panel
              </Link>{" "}
              agar daftar partisipan dapat dipilih.
            </div>
          ) : (
            <>
              <TambahResponden
                sesiId={sesi.id}
                partisipan={partisipan}
                accessToken={session?.accessToken}
              />
              <h3 className="mt-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                Atau tugaskan banyak sekaligus
              </h3>
              <div className="mt-2">
                <AssignRespondenBanyak
                  sesiId={sesi.id}
                  partisipan={partisipan}
                  accessToken={session?.accessToken}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Daftar responden */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-900">
          Daftar Responden ({responden.length})
        </h2>
        {responden.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Belum ada responden terdaftar.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Tahap 1
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Tahap 3
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {responden.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {r.nama ?? <span className="italic text-gray-400">Anonim</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.tahap1_submit ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          ✓ Selesai
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          Belum
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.tahap3_submit ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          ✓ Selesai
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          Belum
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {sesi.status === "TAHAP1" && !r.tahap1_submit && (
                          <Link
                            href={`/task-inventory/tahap1/${r.id}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            Isi Tahap 1
                          </Link>
                        )}
                        {sesi.status === "TAHAP3" && !r.tahap3_submit && (
                          <Link
                            href={`/task-inventory/tahap3/${r.id}`}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Isi Tahap 3
                          </Link>
                        )}
                        {(sesi.status === "DRAFT" || sesi.status === "TAHAP1") &&
                          !r.tahap1_submit && (
                            <HapusResponden
                              respondenId={r.id}
                              nama={r.nama ?? "Anonim"}
                              accessToken={session?.accessToken}
                            />
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task terpilih (setelah TAHAP3) */}
      {taskTerpilih.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-medium text-gray-900">
            Task Relevan Terpilih ({taskTerpilih.length})
          </h2>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Tugas Pokok
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Uraian Tugas
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Relevan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {taskTerpilih.map((t) => (
                  <tr key={t.kode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.tugas_pokok}</td>
                    <td className="px-4 py-3 text-gray-900">{t.uraian_tugas}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500">
                      {t.n_relevan} ({t.pct_relevan}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hasil agregasi (ANALYZED) */}
      {hasil && (
        <div>
          <h2 className="mb-4 text-lg font-medium text-gray-900">Hasil Agregasi (masukan ABK)</h2>
          <p className="mb-3 text-sm text-gray-500">
            Total beban: <strong>{hasil.total_jam_per_minggu}</strong> jam/minggu ·{" "}
            <strong>{hasil.total_jam_per_tahun}</strong> jam/tahun · {hasil.tasks.length} task.
          </p>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Uraian Tugas
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Relevan</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Jam/Minggu</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Jam/Tahun</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">DCS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {hasil.tasks.map((t: TiHasilTaskRead) => (
                  <tr key={t.kode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-900">{t.uraian_tugas}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {t.n_relevan} ({t.pct_relevan}%)
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                      {t.jam_per_minggu_mean}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{t.jam_per_tahun_mean}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {t.dcs_flag_count > 0 ? `⚠ ${t.dcs_flag_count}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
