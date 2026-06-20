"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { JenjangPendidikanRead } from "@/lib/api/schema";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(200, "Nama terlalu panjang"),
  npsn: z
    .string()
    .regex(/^\d{8}$/, "NPSN harus 8 digit angka")
    .optional()
    .or(z.literal("")),
  jenjang_pendidikan_id: z.string().min(1, "Jenjang pendidikan wajib dipilih"),
  kota: z.string().max(100, "Kota terlalu panjang").optional().or(z.literal("")),
  provinsi: z.string().max(100, "Provinsi terlalu panjang").optional().or(z.literal("")),
  aktif: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  jenjang: JenjangPendidikanRead[];
  accessToken: string | undefined;
}

export function TambahSekolahForm({ jenjang, accessToken }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { aktif: true },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.POST("/api/v1/sekolah", {
        body: {
          nama: values.nama,
          npsn: values.npsn || undefined,
          jenjang_pendidikan_id: values.jenjang_pendidikan_id,
          kota: values.kota || undefined,
          provinsi: values.provinsi || undefined,
          aktif: values.aktif,
        },
      });
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      router.push("/master-data/sekolah");
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
        <label htmlFor="nama" className="block text-sm font-medium text-gray-700">
          Nama Sekolah <span aria-hidden>*</span>
        </label>
        <input
          id="nama"
          type="text"
          {...register("nama")}
          placeholder="cth. SD Negeri 1 Bandung"
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
        <label htmlFor="jenjang_pendidikan_id" className="block text-sm font-medium text-gray-700">
          Jenjang Pendidikan <span aria-hidden>*</span>
        </label>
        <select
          id="jenjang_pendidikan_id"
          {...register("jenjang_pendidikan_id")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.jenjang_pendidikan_id}
        >
          <option value="">-- Pilih jenjang --</option>
          {jenjang.map((j) => (
            <option key={j.id} value={j.id}>
              {j.kode} — {j.nama}
            </option>
          ))}
        </select>
        {errors.jenjang_pendidikan_id && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.jenjang_pendidikan_id.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="npsn" className="block text-sm font-medium text-gray-700">
          NPSN <span className="font-normal text-gray-400">(opsional)</span>
        </label>
        <input
          id="npsn"
          type="text"
          maxLength={8}
          {...register("npsn")}
          placeholder="cth. 20201234"
          className="mt-1 block w-40 rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.npsn}
        />
        <p className="mt-1 text-xs text-gray-500">Nomor Pokok Sekolah Nasional (8 digit).</p>
        {errors.npsn && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.npsn.message}
          </p>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="kota" className="block text-sm font-medium text-gray-700">
            Kota <span className="font-normal text-gray-400">(opsional)</span>
          </label>
          <input
            id="kota"
            type="text"
            {...register("kota")}
            placeholder="cth. Bandung"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="provinsi" className="block text-sm font-medium text-gray-700">
            Provinsi <span className="font-normal text-gray-400">(opsional)</span>
          </label>
          <input
            id="provinsi"
            type="text"
            {...register("provinsi")}
            placeholder="cth. Jawa Barat"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
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
          {isSubmitting ? "Menyimpan…" : "Tambah Sekolah"}
        </button>
        <a href="/master-data/sekolah" className="text-sm text-gray-500 hover:text-gray-700">
          Batal
        </a>
      </div>
    </form>
  );
}
