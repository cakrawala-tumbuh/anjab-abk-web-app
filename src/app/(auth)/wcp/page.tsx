import Link from "next/link";
import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type {
  JabatanRead,
  PartisipanRead,
  WcpInstrumenRead,
  WcpRespondenRead,
} from "@/lib/api/schema";
import { AssignResponden } from "./assign-responden";
import { AksiInstrumen } from "./aksi-instrumen";
import { HapusResponden } from "./hapus-responden";
import { EditInstrumen } from "./edit-instrumen";

export const metadata = { title: "WCP" };

const STATUS_LABEL: Record<string, { label: string; cls: string; desc: string }> = {
  OPEN: {
    label: "Terbuka",
    cls: "bg-blue-100 text-blue-700",
    desc: "Instrumen aktif. Tugaskan responden, lalu tutup pengisian bila sudah selesai.",
  },
  CLOSED: {
    label: "Tertutup",
    cls: "bg-yellow-100 text-yellow-700",
    desc: "Pengisian ditutup. Jalankan analisis untuk memproses hasil, atau buka ulang bila perlu.",
  },
  ANALYZED: {
    label: "Teranalisis",
    cls: "bg-green-100 text-green-700",
    desc: "Analisis selesai. Lihat hasil agregat di halaman hasil.",
  },
};

async function fetchPageData(accessToken: string | undefined) {
  const client = withServerAuth(accessToken);
  const [instrumenRes, respondenRes, jabatanRes, partisipanRes] = await Promise.all([
    client.GET("/api/v1/wcp/instrumen"),
    client.GET("/api/v1/wcp/responden"),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 100 } } }),
    client.GET("/api/v1/partisipan", { params: { query: { limit: 100 } } }),
  ]);
  if (!instrumenRes.data) throw apiErrorDari(instrumenRes);
  // Daftar responden menentukan jumlah submit & kelayakan analisis — kegagalan
  // yang ditelan jadi `[]` menampilkan "0 dari 0 responden" seolah-olah benar.
  if (!respondenRes.data) throw apiErrorDari(respondenRes);
  // `partisipan` = satu-satunya sumber pilihan form "Tugaskan Responden", dan
  // `jabatan` melabeli tiap barisnya. Ditelan jadi `[]`, form itu tampil sebagai
  // "semua partisipan sudah ditugaskan" — padahal daftarnya gagal diambil.
  if (!jabatanRes.data) throw apiErrorDari(jabatanRes);
  if (!partisipanRes.data) throw apiErrorDari(partisipanRes);
  return {
    instrumen: instrumenRes.data as WcpInstrumenRead,
    responden: respondenRes.data as WcpRespondenRead[],
    jabatan: (jabatanRes.data.items ?? []) as JabatanRead[],
    partisipan: (partisipanRes.data.items ?? []) as PartisipanRead[],
  };
}

export default async function WcpInstrumenPage() {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { instrumen, responden, jabatan, partisipan } = await fetchPageData(session?.accessToken);

  const st = STATUS_LABEL[instrumen.status] ?? {
    label: instrumen.status,
    cls: "bg-gray-100 text-gray-500",
    desc: "",
  };
  const sudahSubmit = responden.filter((r) => r.sudah_submit).length;
  const assignedPartisipanIds = new Set(
    responden.map((r) => r.partisipan_id).filter((id): id is string => !!id),
  );
  const partisipanTersedia = partisipan.filter((p) => !assignedPartisipanIds.has(p.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-heading">WCP — Workplace Climate Profile</h1>
          <p className="page-subtext">
            Instrumen tunggal — tugaskan partisipan sebagai responden, kelola status pengisian, dan
            jalankan analisis dari satu halaman ini.
          </p>
        </div>
        <Link
          href="/wcp/demo"
          className="shrink-0 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Demo Pengisian
        </Link>
      </div>

      {/* Kartu status */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${st.cls}`}>
                {st.label}
              </span>
              {instrumen.catatan && (
                <span className="text-sm italic text-gray-600 dark:text-gray-400">
                  {instrumen.catatan}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{st.desc}</p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">{sudahSubmit}</span> dari{" "}
              <span className="font-semibold">{responden.length}</span> responden sudah mengisi —
              minimal <span className="font-semibold">{instrumen.min_responden}</span> untuk
              analisis.
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
          <EditInstrumen instrumen={instrumen} accessToken={session?.accessToken} />
        </div>
      </div>

      {/* Aksi instrumen */}
      <AksiInstrumen
        instrumen={instrumen}
        jumlahSubmit={sudahSubmit}
        accessToken={session?.accessToken}
      />

      {/* Assign responden (hanya saat OPEN) */}
      {instrumen.status === "OPEN" && (
        <div>
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-50">
            Tugaskan Responden
          </h2>
          <AssignResponden
            partisipan={partisipanTersedia}
            jabatan={jabatan}
            accessToken={session?.accessToken}
          />
        </div>
      )}

      {/* Daftar responden */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-50">
          Daftar Responden ({responden.length})
        </h2>
        {responden.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {instrumen.status === "OPEN"
                ? "Belum ada responden. Gunakan form di atas untuk menugaskan partisipan."
                : "Belum ada responden yang ditugaskan."}
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
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
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
                      <div className="flex flex-wrap items-center gap-3">
                        {r.sudah_submit && (
                          <Link
                            href={`/wcp/hasil-responden/${r.id}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            Lihat Hasil
                          </Link>
                        )}
                        {!r.sudah_submit && (
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
    </div>
  );
}
