"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JabatanRead } from "@/lib/api/schema";

const createSchema = z.object({
  jabatan_id: z.string().min(1, "Jabatan wajib dipilih"),
  nama: z.string().min(1, "Nama wajib diisi").max(300, "Nama terlalu panjang"),
});

const editSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(300, "Nama terlalu panjang"),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

interface Props {
  accessToken: string | undefined;
  defaultValues?: EditValues;
  /** ID untuk mode edit; tidak ada = mode tambah */
  editId?: string;
  jabatanList?: JabatanRead[];
}

export function TambahTugasPokokForm({ accessToken, defaultValues, editId, jabatanList }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!editId;

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { jabatan_id: "", nama: "" },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: defaultValues ?? { nama: "" },
  });

  async function onSubmitCreate(values: CreateValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.POST("/api/v1/task-inventory/tugas-pokok", {
        body: { jabatan_id: values.jabatan_id, nama: values.nama },
      });
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      router.push("/master-data/tugas-pokok");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  async function onSubmitEdit(values: EditValues) {
    if (!editId) return;
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.PATCH("/api/v1/task-inventory/tugas-pokok/{tp_id}", {
        params: { path: { tp_id: editId } },
        body: { nama: values.nama },
      });
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      router.push("/master-data/tugas-pokok");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  if (isEdit) {
    const {
      register,
      handleSubmit,
      formState: { errors, isSubmitting },
    } = editForm;
    return (
      <form onSubmit={handleSubmit(onSubmitEdit)} className="form-card space-y-5 p-6">
        {serverError && (
          <div role="alert" className="form-server-error">
            {serverError}
          </div>
        )}
        <div>
          <label htmlFor="nama" className="form-label">
            Nama Tugas Pokok <span aria-hidden>*</span>
          </label>
          <input
            id="nama"
            type="text"
            {...register("nama")}
            placeholder="cth. Pengelolaan SDM"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.nama}
          />
          {errors.nama && (
            <p className="form-error" role="alert">
              {errors.nama.message}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
          <Link
            href="/master-data/tugas-pokok"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Batal
          </Link>
        </div>
      </form>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = createForm;
  return (
    <form onSubmit={handleSubmit(onSubmitCreate)} className="form-card space-y-5 p-6">
      {serverError && (
        <div role="alert" className="form-server-error">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="jabatan_id" className="form-label">
          Jabatan <span aria-hidden>*</span>
        </label>
        <select
          id="jabatan_id"
          {...register("jabatan_id")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.jabatan_id}
        >
          <option value="">— Pilih jabatan —</option>
          {(jabatanList ?? []).map((j) => (
            <option key={j.id} value={j.id}>
              {j.nama} ({j.kode})
            </option>
          ))}
        </select>
        {errors.jabatan_id && (
          <p className="form-error" role="alert">
            {errors.jabatan_id.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="nama" className="form-label">
          Nama Tugas Pokok <span aria-hidden>*</span>
        </label>
        <input
          id="nama"
          type="text"
          {...register("nama")}
          placeholder="cth. Pengelolaan SDM"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.nama}
        />
        {errors.nama && (
          <p className="form-error" role="alert">
            {errors.nama.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan…" : "Tambah Tugas Pokok"}
        </button>
        <Link
          href="/master-data/tugas-pokok"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
