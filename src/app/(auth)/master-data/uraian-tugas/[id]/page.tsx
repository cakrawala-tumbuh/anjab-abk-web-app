import { notFound } from "next/navigation";
import { auth, isAdmin } from "@/lib/auth/auth";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import type {
  DetilTugasRead,
  JabatanRead,
  TugasPokokRead,
  UraianTugasRead,
} from "@/lib/api/schema";
import { TambahUraianTugasForm } from "../tambah/uraian-tugas-form";
import { HapusUraianTugasButton } from "./hapus-button";

export const metadata = { title: "Edit Uraian Tugas — Master Data" };

async function fetchData(accessToken: string | undefined, id: string) {
  const client = withServerAuth(accessToken);
  const [uraianRes, pokokRes, detilRes, jabatanRes] = await Promise.all([
    client.GET("/api/v1/task-inventory/uraian-tugas/{ut_id}", {
      params: { path: { ut_id: id } },
    }),
    client.GET("/api/v1/task-inventory/tugas-pokok", { params: { query: { limit: 200 } } }),
    client.GET("/api/v1/task-inventory/detil-tugas", { params: { query: { limit: 500 } } }),
    client.GET("/api/v1/jabatan", { params: { query: { limit: 200 } } }),
  ]);
  if (!uraianRes.data) throw apiErrorDari(uraianRes);
  if (!pokokRes.data) throw apiErrorDari(pokokRes);
  if (!detilRes.data) throw apiErrorDari(detilRes);
  // `jabatanList` menyaring pilihan jabatan pada formulir edit — ditelan jadi
  // `[]`, menyimpan form akan MELEPAS jabatan yang sudah terkait.
  if (!jabatanRes.data) throw apiErrorDari(jabatanRes);
  return {
    uraianTugas: uraianRes.data as UraianTugasRead,
    tugasPokok: (pokokRes.data.items ?? []) as TugasPokokRead[],
    detilTugas: (detilRes.data.items ?? []) as DetilTugasRead[],
    jabatanList: (jabatanRes.data.items ?? []) as JabatanRead[],
  };
}

export default async function EditUraianTugasPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) notFound();

  const { id } = await params;
  const { uraianTugas, tugasPokok, detilTugas, jabatanList } = await fetchData(
    session?.accessToken,
    id,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Edit Uraian Tugas
        </h2>
        <p className="page-subtext">
          Perbarui detail uraian tugas <span className="font-mono text-xs">{uraianTugas.kode}</span>
          .
        </p>
      </div>
      <div className="max-w-2xl space-y-4">
        <TambahUraianTugasForm
          tugasPokok={tugasPokok}
          detilTugas={detilTugas}
          jabatanList={jabatanList}
          accessToken={session?.accessToken}
          defaultValues={{
            kode: uraianTugas.kode,
            uraian: uraianTugas.uraian,
            unit: uraianTugas.unit,
            urutan: uraianTugas.urutan,
            tugas_pokok_id: uraianTugas.tugas_pokok_id,
            detil_tugas_id: uraianTugas.detil_tugas_id ?? "",
            jabatan_id: uraianTugas.jabatan_id ?? "",
            std_sumber_bukti: uraianTugas.std_sumber_bukti ?? undefined,
            std_kondisi: uraianTugas.std_kondisi ?? undefined,
            std_frekuensi_teks: uraianTugas.std_frekuensi_teks ?? undefined,
            std_durasi_per_kali: uraianTugas.std_durasi_per_kali ?? undefined,
            std_jam_per_minggu: uraianTugas.std_jam_per_minggu ?? undefined,
            std_peak4w_hours: uraianTugas.std_peak4w_hours ?? undefined,
            std_va_type: uraianTugas.std_va_type ?? undefined,
          }}
          editId={id}
        />
        <HapusUraianTugasButton
          id={id}
          kode={uraianTugas.kode}
          accessToken={session?.accessToken}
        />
      </div>
    </div>
  );
}
