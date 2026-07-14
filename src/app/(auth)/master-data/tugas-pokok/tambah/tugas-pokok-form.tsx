"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import type { JabatanRead } from "@/lib/api/schema";

const schema = z.object({
  jabatan_ids: z.array(z.string()).min(1, "Pilih minimal satu jabatan"),
  nama: z.string().min(1, "Nama wajib diisi").max(300, "Nama terlalu panjang"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  accessToken: string | undefined;
  defaultValues?: Partial<FormValues>;
  /** ID untuk mode edit; tidak ada = mode tambah */
  editId?: string;
  jabatanList?: JabatanRead[];
}

export function TambahTugasPokokForm({ accessToken, defaultValues, editId, jabatanList }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!editId;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      jabatan_ids: [],
      nama: "",
      ...defaultValues,
    },
  });

  const watchedJabatanIds = watch("jabatan_ids");

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
      if (isEdit) {
        const { error, response } = await client.PATCH(
          "/api/v1/task-inventory/tugas-pokok/{tp_id}",
          {
            params: { path: { tp_id: editId! } },
            body: { jabatan_ids: values.jabatan_ids, nama: values.nama },
          },
        );
        const requestId = response.headers.get("x-request-id");
        if (error) throw toApiError(error, requestId);
      } else {
        const { error, response } = await client.POST("/api/v1/task-inventory/tugas-pokok", {
          body: { jabatan_ids: values.jabatan_ids, nama: values.nama },
        });
        const requestId = response.headers.get("x-request-id");
        if (error) throw toApiError(error, requestId);
      }
      notifySukses(
        isEdit ? "Tugas pokok berhasil diperbarui." : "Tugas pokok berhasil ditambahkan.",
      );
      router.push("/master-data/tugas-pokok");
      router.refresh();
    } catch (err) {
      setServerError(pesanGagal(err));
      notifyGagal(err);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-card space-y-5 p-6">
      {serverError && (
        <div role="alert" className="form-server-error">
          {serverError}
        </div>
      )}

      <div>
        <label className="form-label">
          Jabatan <span aria-hidden>*</span>
        </label>
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          Pilih satu atau lebih jabatan yang terkait dengan tugas pokok ini.
        </p>
        {(jabatanList ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada data jabatan.</p>
        ) : (
          <div className="max-h-48 overflow-y-auto rounded-md border border-gray-300 p-2 dark:border-gray-600">
            <div className="space-y-1">
              {(jabatanList ?? []).map((j) => (
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
          {isSubmitting ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Tugas Pokok"}
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
