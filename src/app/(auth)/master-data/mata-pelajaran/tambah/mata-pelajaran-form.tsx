"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";

const KELOMPOK_OPTIONS = [
  { value: "umum", label: "Umum" },
  { value: "peminatan", label: "Peminatan" },
  { value: "muatan_lokal", label: "Muatan Lokal" },
  { value: "kejuruan", label: "Kejuruan" },
] as const;

const schema = z.object({
  kode: z.string().min(1, "Kode wajib diisi").max(20, "Kode terlalu panjang"),
  nama: z.string().min(1, "Nama wajib diisi").max(150, "Nama terlalu panjang"),
  kelompok: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["umum", "peminatan", "muatan_lokal", "kejuruan"], {
      required_error: "Kelompok wajib dipilih",
      invalid_type_error: "Kelompok wajib dipilih",
    }),
  ),
  deskripsi: z.string().max(500, "Deskripsi terlalu panjang").optional().or(z.literal("")),
  aktif: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  accessToken: string | undefined;
}

export function TambahMataPelajaranForm({ accessToken }: Props) {
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
      const { error, response } = await client.POST("/api/v1/mata-pelajaran", {
        body: {
          kode: values.kode,
          nama: values.nama,
          kelompok: values.kelompok,
          deskripsi: values.deskripsi || undefined,
          aktif: values.aktif,
        },
      });
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      router.push("/master-data/mata-pelajaran");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-card space-y-5 p-6">
      {serverError && (
        <div role="alert" className="form-server-error">
          {serverError}
        </div>
      )}

      <div className="flex gap-4">
        <div className="w-28">
          <label htmlFor="kode" className="form-label">
            Kode <span aria-hidden>*</span>
          </label>
          <input
            id="kode"
            type="text"
            {...register("kode")}
            placeholder="cth. MTK"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.kode}
          />
          {errors.kode && (
            <p className="form-error" role="alert">
              {errors.kode.message}
            </p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="nama" className="form-label">
            Nama Mata Pelajaran <span aria-hidden>*</span>
          </label>
          <input
            id="nama"
            type="text"
            {...register("nama")}
            placeholder="cth. Matematika"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.nama}
          />
          {errors.nama && (
            <p className="form-error" role="alert">
              {errors.nama.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="kelompok" className="form-label">
          Kelompok <span aria-hidden>*</span>
        </label>
        <select
          id="kelompok"
          {...register("kelompok")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.kelompok}
        >
          <option value="">-- Pilih kelompok --</option>
          {KELOMPOK_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.kelompok && (
          <p className="form-error" role="alert">
            {errors.kelompok.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="deskripsi" className="form-label">
          Deskripsi <span className="font-normal text-gray-400">(opsional)</span>
        </label>
        <textarea
          id="deskripsi"
          rows={3}
          {...register("deskripsi")}
          placeholder="Deskripsi singkat mata pelajaran ini…"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.deskripsi && (
          <p className="form-error" role="alert">
            {errors.deskripsi.message}
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
          {isSubmitting ? "Menyimpan…" : "Tambah Mata Pelajaran"}
        </button>
        <a
          href="/master-data/mata-pelajaran"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Batal
        </a>
      </div>
    </form>
  );
}
