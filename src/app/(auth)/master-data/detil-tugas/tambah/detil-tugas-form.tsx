"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { TugasPokokRead } from "@/lib/api/schema";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(300, "Nama terlalu panjang"),
  tugas_pokok_id: z.string().min(1, "Tugas pokok wajib dipilih"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  tugasPokok: TugasPokokRead[];
  accessToken: string | undefined;
  defaultValues?: FormValues;
  /** ID untuk mode edit; tidak ada = mode tambah */
  editId?: string;
}

export function TambahDetilTugasForm({ tugasPokok, accessToken, defaultValues, editId }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { nama: "", tugas_pokok_id: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      if (editId) {
        const { error, response } = await client.PATCH(
          "/api/v1/task-inventory/detil-tugas/{dt_id}",
          {
            params: { path: { dt_id: editId } },
            body: { nama: values.nama, tugas_pokok_id: values.tugas_pokok_id },
          },
        );
        const requestId = response.headers.get("x-request-id");
        if (error) throw toApiError(error, requestId);
      } else {
        const { error, response } = await client.POST("/api/v1/task-inventory/detil-tugas", {
          body: { nama: values.nama, tugas_pokok_id: values.tugas_pokok_id },
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
          {...register("tugas_pokok_id")}
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
