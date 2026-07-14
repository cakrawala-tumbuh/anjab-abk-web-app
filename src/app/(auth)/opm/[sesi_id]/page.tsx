import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type {
  OpmRespondenRead,
  OpmSesiRead,
  OpmSesiTaskRead,
  PartisipanRead,
  SMEPanelRead,
} from "@/lib/api/schema";
import { TransisiSesi } from "./transisi-sesi";
import { TambahResponden } from "./tambah-responden";
import { AssignRespondenBanyak } from "./assign-responden-banyak";
import { HapusResponden } from "./hapus-responden";

export const metadata = { title: "Detail Analisis Jabatan — OPM" };

const STATUS_LABEL: Record<string, { label: string; cls: string; desc: string }> = {
  DRAFT: {
    label: "Draft",
    cls: "bg-gray-100 text-gray-600",
    desc: "Analisis belum dibuka. Buka analisis agar responden dapat mengisi rating.",
  },
  OPEN: {
    label: "Terbuka",
    cls: "bg-blue-100 text-blue-700",
    desc: "Analisis aktif. Responden dapat mengisi rating, lalu tutup analisis bila sudah selesai.",
  },
  CLOSED: {
    label: "Tertutup",
    cls: "bg-yellow-100 text-yellow-700",
    desc: "Pengisian ditutup. Jalankan analisis untuk memproses hasil.",
  },
  ANALYZED: {
    label: "Teranalisis",
    cls: "bg-green-100 text-green-700",
    desc: "Analisis selesai. Lihat hasil di halaman hasil.",
  },
};

interface Props {
  params: Promise<{ sesi_id: string }>;
}

async function fetchPageData(accessToken: string | undefined, sesiId: string) {
  const client = withServerAuth(accessToken);
  const [sesiRes, taskRes, respondenRes, panelRes, partisipanRes] = await Promise.all([
    client.GET("/api/v1/opm/sesi/{sesi_id}", { params: { path: { sesi_id: sesiId } } }),
    client.GET("/api/v1/opm/sesi/{sesi_id}/task", { params: { path: { sesi_id: sesiId } } }),
    client.GET("/api/v1/opm/sesi/{sesi_id}/responden", { params: { path: { sesi_id: sesiId } } }),
    client.GET("/api/v1/sme-panel", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/partisipan", { params: { query: { limit: 100 } } }),
  ]);
  if (!sesiRes.data) throw apiErrorDari(sesiRes);
  // Task & responden = data inti sesi. Kegagalan yang ditelan jadi `[]` membuat
  // admin melihat sesi kosong (dan bisa menugaskan ulang responden yang sudah ada).
  if (!taskRes.data) throw apiErrorDari(taskRes);
  if (!respondenRes.data) throw apiErrorDari(respondenRes);
  // `panel` & `partisipan` menentukan siapa yang boleh ditugaskan. Ditelan jadi
  // `[]`, form "Tugaskan Responden" tampil sebagai "panel SME jabatan ini belum
  // punya anggota" — padahal daftarnya gagal diambil.
  if (!panelRes.data) throw apiErrorDari(panelRes);
  if (!partisipanRes.data) throw apiErrorDari(partisipanRes);

  const sesi = sesiRes.data as OpmSesiRead;
  const panel = (panelRes.data.items ?? []) as SMEPanelRead[];
  const partisipan = (partisipanRes.data.items ?? []) as PartisipanRead[];

  const panelJabatan = panel.find((p) => p.jabatan_id === sesi.jabatan_id);
  const anggotaPanelIds = new Set(panelJabatan?.partisipan_ids ?? []);
  const partisipanMap = Object.fromEntries(partisipan.map((p) => [p.id, p]));

  return {
    sesi,
    task: taskRes.data as OpmSesiTaskRead[],
    responden: respondenRes.data as OpmRespondenRead[],
    partisipanAnggotaPanel: [...anggotaPanelIds]
      .map((id) => partisipanMap[id])
      .filter((p): p is PartisipanRead => Boolean(p)),
  };
}

export default async function OpmSesiDetailPage({ params }: Props) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { sesi_id } = await params;
  const { sesi, task, responden, partisipanAnggotaPanel } = await fetchPageData(
    session?.accessToken,
    sesi_id,
  );

  const sesiLabel = sesi.catatan ?? sesi.periode;
  const st = STATUS_LABEL[sesi.status] ?? {
    label: sesi.status,
    cls: "bg-gray-100 text-gray-500",
    desc: "",
  };

  const sudahSubmit = responden.filter((r) => r.sudah_submit).length;
  const respondenPartisipanIds = new Set(
    responden.map((r) => r.partisipan_id).filter(Boolean) as string[],
  );
  const partisipanTersedia = partisipanAnggotaPanel.filter(
    (p) => !respondenPartisipanIds.has(p.id),
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/opm" className="hover:text-gray-700">
          Analisis Jabatan — OPM
        </Link>
        <span>/</span>
        <span className="text-gray-900">{sesiLabel}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">{sesiLabel}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Jabatan: <span className="font-medium">{sesi.jabatan_nama ?? sesi.jabatan_id}</span>
          </p>
          <p className="mt-1 font-mono text-sm text-gray-500">{sesi.periode}</p>
          {sesi.catatan && <p className="mt-2 text-sm italic text-gray-600">{sesi.catatan}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${st.cls}`}>
            {st.label}
          </span>
          <p className="max-w-xs text-right text-xs text-gray-400">{st.desc}</p>
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{task.length}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Task</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{responden.length}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Terdaftar</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{sudahSubmit}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Sudah Mengisi</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">
            {sesi.min_responden}–{sesi.max_responden}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Target Responden</p>
        </div>
      </div>

      {/* Aksi transisi status */}
      <TransisiSesi sesi={sesi} accessToken={session?.accessToken} />

      {sesi.status === "ANALYZED" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <Link
            href={`/opm/${sesi.id}/hasil`}
            className="text-sm font-medium text-green-700 hover:underline"
          >
            → Lihat Hasil Analisis
          </Link>
        </div>
      )}

      {/* Tambah responden (hanya saat DRAFT/OPEN, dibatasi anggota SME panel) */}
      {(sesi.status === "DRAFT" || sesi.status === "OPEN") && (
        <div>
          <h2 className="mb-4 text-lg font-medium text-gray-900">Tambah Responden</h2>
          <TambahResponden
            sesiId={sesi.id}
            partisipan={partisipanTersedia}
            jabatanLabel={sesi.jabatan_nama ?? sesi.jabatan_id}
            accessToken={session?.accessToken}
          />
          <h3 className="mt-6 text-sm font-medium text-gray-500 dark:text-gray-400">
            Atau tugaskan banyak sekaligus
          </h3>
          <div className="mt-2">
            <AssignRespondenBanyak
              sesiId={sesi.id}
              partisipan={partisipanTersedia}
              accessToken={session?.accessToken}
            />
          </div>
        </div>
      )}

      {/* Snapshot task */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-900">
          Task yang Dinilai ({task.length})
        </h2>
        {task.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada task snapshot.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Kode
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Uraian Tugas
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Tugas Pokok
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {task
                  .slice()
                  .sort((a, b) => a.urutan - b.urutan)
                  .map((t) => (
                    <tr key={t.task_kode} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-mono text-gray-500">{t.task_kode}</td>
                      <td className="px-4 py-3 text-gray-900">{t.uraian_tugas}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {t.tugas_pokok}
                        {t.detil_tugas && <span className="text-gray-400"> — {t.detil_tugas}</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daftar responden */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-900">
          Daftar Responden ({responden.length})
        </h2>
        {responden.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Belum ada responden yang terdaftar di analisis ini.
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
                    Jabatan
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    Status Isian
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
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {r.jabatan_label}
                    </td>
                    <td className="px-4 py-3">
                      {r.sudah_submit ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          <span aria-hidden>✓</span> Sudah diisi
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          Belum diisi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!r.sudah_submit && (
                        <HapusResponden
                          respondenId={r.id}
                          nama={r.nama ?? "Anonim"}
                          accessToken={session?.accessToken}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
