"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JabatanRead, TugasPokokRead } from "@/lib/api/schema";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(300, "Nama terlalu panjang"),
  tugas_pokok_id: z.string().min(1, "Tugas pokok wajib dipilih"),
  jabatan_ids: z.array(z.string()).min(1, "Pilih minimal satu jabatan"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  tugasPokok: TugasPokokRead[];
  jabatanList: JabatanRead[];
  accessToken: string | undefined;
  defaultValues?: Partial<FormValues>;
  /** ID untuk mode edit; tidak ada = mode tambah */
  editId?: string;
}

export function TambahDetilTugasForm({
  tugasPokok,
  jabatanList,
  accessToken,
  defaultValues,
  editId,
}: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nama: "", tugas_pokok_id: "", jabatan_ids: [], ...defaultValues },
  });

  const watchedPokokId = watch("tugas_pokok_id");
  const watchedJabatanIds = watch("jabatan_ids");

  const selectedTP = tugasPokok.find((tp) => tp.id === watchedPokokId);
  const filteredJabatan = jabatanList.filter((j) => (selectedTP?.jabatan_ids ?? []).includes(j.id));

  function handlePokokChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue("tugas_pokok_id", e.target.value, { shouldValidate: true });
    setValue("jabatan_ids", [], { shouldValidate: true });
  }

  function handleJabatanChange(jabatanId: string, checked: boolean) {
    const current = watchedJabatanIds ?? [];
    if (checked) {
      setValue("jabatan_ids", [...current, jabatanId], { shouldValidate: true });
    } else {
      setValue(
        "jabatan_ids",
        current.filter((id) => id !== jabatanId),
        { shouldValidate: true },
      );
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      if (editId) {
        const { error, response } = await client.PATCH(
          "/api/v1/task-inventory/detil-tugas/{dt_id}",
          {
            params: { path: { dt_id: editId } },
            body: {
              nama: values.nama,
              tugas_pokok_id: values.tugas_pokok_id,
              jabatan_ids: values.jabatan_ids,
            },
          },
        );
        const requestId = response.headers.get("x-request-id");
        if (error) throw toApiError(error, requestId);
      } else {
        const { error, response } = await client.POST("/api/v1/task-inventory/detil-tugas", {
          body: {
            nama: values.nama,
            tugas_pokok_id: values.tugas_pokok_id,
            jabatan_ids: values.jabatan_ids,
          },
        });
        const requestId = response.headers.get("x-request-id");
        if (error) throw toApiError(error, requestId);
      }
      router.push("/master-data/detil-tugas");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  const isEdit = !!editId;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-card space-y-5 p-6">
      {serverError && (
        <div role="alert" className="form-server-error">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="nama" className="form-label">
          Nama Detil Tugas <span aria-hidden>*</span>
        </label>
        <input
          id="nama"
          type="text"
          {...register("nama")}
          placeholder="cth. Mengevaluasi Kinerja Karyawan"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.nama}
        />
        {errors.nama && (
          <p className="form-error" role="alert">
            {errors.nama.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="tugas_pokok_id" className="form-label">
          Tugas Pokok <span aria-hidden>*</span>
        </label>
        <select
          id="tugas_pokok_id"
          value={watchedPokokId}
          onChange={handlePokokChange}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.tugas_pokok_id}
        >
          <option value="">-- Pilih tugas pokok --</option>
          {tugasPokok.map((tp) => (
            <option key={tp.id} value={tp.id}>
              {tp.nama}
            </option>
          ))}
        </select>
        {errors.tugas_pokok_id && (
          <p className="form-error" role="alert">
            {errors.tugas_pokok_id.message}
          </p>
        )}
      </div>

      <div>
        <label className="form-label">
          Jabatan <span aria-hidden>*</span>
        </label>
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          Pilih jabatan dari daftar yang tersedia di tugas pokok yang dipilih.
        </p>
        {!watchedPokokId ? (
          <p className="text-sm text-gray-400">Pilih tugas pokok terlebih dahulu.</p>
        ) : filteredJabatan.length === 0 ? (
          <p className="text-sm text-gray-400">Tidak ada jabatan untuk tugas pokok ini.</p>
        ) : (
          <div className="max-h-40 overflow-y-auto rounded-md border border-gray-300 p-2 dark:border-gray-600">
            <div className="space-y-1">
              {filteredJabatan.map((j) => (
                <label
                  key={j.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    value={j.id}
                    checked={(watchedJabatanIds ?? []).includes(j.id)}
                    onChange={(e) => handleJabatanChange(j.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span>
                    {j.nama} <span className="font-mono text-xs text-gray-400">({j.kode})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        {errors.jabatan_ids && (
          <p className="form-error mt-1" role="alert">
            {errors.jabatan_ids.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Detil Tugas"}
        </button>
        <Link
          href="/master-data/detil-tugas"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
