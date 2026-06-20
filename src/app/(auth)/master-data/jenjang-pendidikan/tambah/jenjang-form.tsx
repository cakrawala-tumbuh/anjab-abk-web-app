"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";

const schema = z.object({
  kode: z.string().min(1, "Kode wajib diisi").max(20, "Kode terlalu panjang"),
  nama: z.string().min(1, "Nama wajib diisi").max(100, "Nama terlalu panjang"),
  urutan: z.number({ invalid_type_error: "Isi angka urutan" }).min(0).default(0),
  aktif: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  accessToken: string | undefined;
}

export function TambahJenjangForm({ accessToken }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { urutan: 0, aktif: true },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.POST("/api/v1/jenjang-pendidikan", {
        body: values,
      });
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      router.push("/master-data/jenjang-pendidikan");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-lg border border-gray-200 bg-white p-6"
    >
      {serverError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="kode" className="block text-sm font-medium text-gray-700">
          Kode <span aria-hidden>*</span>
        </label>
        <input
          id="kode"
          type="text"
          {...register("kode")}
          placeholder="cth. SD, SMP, SMA"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.kode}
        />
        {errors.kode && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.kode.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="nama" className="block text-sm font-medium text-gray-700">
          Nama Lengkap <span aria-hidden>*</span>
        </label>
        <input
          id="nama"
          type="text"
          {...register("nama")}
          placeholder="cth. Sekolah Dasar"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.nama}
        />
        {errors.nama && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.nama.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="urutan" className="block text-sm font-medium text-gray-700">
          Urutan Tampilan
        </label>
        <input
          id="urutan"
          type="number"
          min={0}
          {...register("urutan", { valueAsNumber: true })}
          className="mt-1 block w-32 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.urutan}
        />
        <p className="mt-1 text-xs text-gray-500">Makin kecil, makin atas di daftar.</p>
        {errors.urutan && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.urutan.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="aktif"
          type="checkbox"
          {...register("aktif")}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="aktif" className="text-sm text-gray-700">
          Aktif
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan…" : "Tambah Jenjang"}
        </button>
        <a
          href="/master-data/jenjang-pendidikan"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Batal
        </a>
      </div>
    </form>
  );
}
