"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { SekolahRead } from "@/lib/api/schema";

const JENIS_OPTIONS = [
  { value: "struktural", label: "Struktural" },
  { value: "fungsional", label: "Fungsional" },
  { value: "teknisi", label: "Teknisi" },
] as const;

const schema = z.object({
  kode: z.string().min(1, "Kode wajib diisi").max(30, "Kode terlalu panjang"),
  nama: z.string().min(1, "Nama wajib diisi").max(200, "Nama terlalu panjang"),
  jenis: z.enum(["struktural", "fungsional", "teknisi"], {
    required_error: "Jenis wajib dipilih",
  }),
  unit_kerja_id: z.string().optional().or(z.literal("")),
  deskripsi: z.string().max(1000, "Deskripsi terlalu panjang").optional().or(z.literal("")),
  aktif: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  sekolah: SekolahRead[];
  accessToken: string | undefined;
}

export function TambahJabatanForm({ sekolah, accessToken }: Props) {
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
      const { error, response } = await client.POST("/api/v1/jabatan", {
        body: {
          kode: values.kode,
          nama: values.nama,
          jenis: values.jenis,
          unit_kerja_id: values.unit_kerja_id || undefined,
          deskripsi: values.deskripsi || undefined,
          aktif: values.aktif,
        },
      });
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      router.push("/master-data/jabatan");
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

      <div className="flex gap-4">
        <div className="w-36">
          <label htmlFor="kode" className="block text-sm font-medium text-gray-700">
            Kode <span aria-hidden>*</span>
          </label>
          <input
            id="kode"
            type="text"
            {...register("kode")}
            placeholder="cth. KS-001"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.kode}
          />
          {errors.kode && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.kode.message}
            </p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="nama" className="block text-sm font-medium text-gray-700">
            Nama Jabatan <span aria-hidden>*</span>
          </label>
          <input
            id="nama"
            type="text"
            {...register("nama")}
            placeholder="cth. Kepala Sekolah"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.nama}
          />
          {errors.nama && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.nama.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="jenis" className="block text-sm font-medium text-gray-700">
          Jenis Jabatan <span aria-hidden>*</span>
        </label>
        <select
          id="jenis"
          {...register("jenis")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.jenis}
        >
          <option value="">-- Pilih jenis --</option>
          {JENIS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.jenis && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.jenis.message}
          </p>
        )}
      </div>

      {sekolah.length > 0 && (
        <div>
          <label htmlFor="unit_kerja_id" className="block text-sm font-medium text-gray-700">
            Unit Kerja / Sekolah <span className="font-normal text-gray-400">(opsional)</span>
          </label>
          <select
            id="unit_kerja_id"
            {...register("unit_kerja_id")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Tidak spesifik --</option>
            {sekolah.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">
          Deskripsi <span className="font-normal text-gray-400">(opsional)</span>
        </label>
        <textarea
          id="deskripsi"
          rows={3}
          {...register("deskripsi")}
          placeholder="Deskripsi singkat tugas dan tanggung jawab jabatan ini…"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.deskripsi && (
          <p className="mt-1 text-xs text-red-600" role="alert">
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
          {isSubmitting ? "Menyimpan…" : "Tambah Jabatan"}
        </button>
        <a href="/master-data/jabatan" className="text-sm text-gray-500 hover:text-gray-700">
          Batal
        </a>
      </div>
    </form>
  );
}
