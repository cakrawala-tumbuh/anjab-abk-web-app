"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { DetilTugasRead, TugasPokokRead } from "@/lib/api/schema";

const schema = z.object({
  kode: z.string().min(1, "Kode wajib diisi").max(20, "Kode terlalu panjang"),
  uraian: z.string().min(1, "Uraian wajib diisi").max(500, "Uraian terlalu panjang"),
  unit: z.string().min(1, "Unit wajib diisi").max(20, "Unit terlalu panjang"),
  kategori_jabatan: z
    .string()
    .min(1, "Kategori jabatan wajib diisi")
    .max(200, "Kategori jabatan terlalu panjang"),
  urutan: z
    .number({ invalid_type_error: "Isi angka urutan" })
    .int("Urutan harus bilangan bulat")
    .min(1, "Urutan minimal 1"),
  tugas_pokok_id: z.string().min(1, "Tugas pokok wajib dipilih"),
  detil_tugas_id: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  tugasPokok: TugasPokokRead[];
  detilTugas: DetilTugasRead[];
  accessToken: string | undefined;
  defaultValues?: Partial<FormValues>;
  /** ID untuk mode edit; tidak ada = mode tambah */
  editId?: string;
}

export function TambahUraianTugasForm({
  tugasPokok,
  detilTugas,
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
    defaultValues: {
      kode: "",
      uraian: "",
      unit: "",
      kategori_jabatan: "",
      urutan: 1,
      tugas_pokok_id: "",
      detil_tugas_id: "",
      ...defaultValues,
    },
  });

  const watchedPokokId = watch("tugas_pokok_id");
  const filteredDetil = detilTugas.filter((dt) => dt.tugas_pokok_id === watchedPokokId);

  function handlePokokChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue("tugas_pokok_id", e.target.value);
    setValue("detil_tugas_id", "");
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const body = {
        kode: values.kode,
        uraian: values.uraian,
        unit: values.unit,
        kategori_jabatan: values.kategori_jabatan,
        urutan: values.urutan,
        tugas_pokok_id: values.tugas_pokok_id,
        detil_tugas_id: values.detil_tugas_id || null,
      };

      if (editId) {
        const { error, response } = await client.PATCH(
          "/api/v1/task-inventory/uraian-tugas/{ut_id}",
          {
            params: { path: { ut_id: editId } },
            body,
          },
        );
        const requestId = response.headers.get("x-request-id");
        if (error) throw toApiError(error, requestId);
      } else {
        const { error, response } = await client.POST("/api/v1/task-inventory/uraian-tugas", {
          body: {
            kode: values.kode,
            uraian: values.uraian,
            unit: values.unit,
            kategori_jabatan: values.kategori_jabatan,
            urutan: values.urutan,
            tugas_pokok_id: values.tugas_pokok_id,
            detil_tugas_id: values.detil_tugas_id || null,
          },
        });
        const requestId = response.headers.get("x-request-id");
        if (error) throw toApiError(error, requestId);
      }
      router.push("/master-data/uraian-tugas");
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

      <div className="flex gap-4">
        <div className="w-40">
          <label htmlFor="kode" className="form-label">
            Kode <span aria-hidden>*</span>
          </label>
          <input
            id="kode"
            type="text"
            {...register("kode")}
            placeholder="cth. TIf0b59714"
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
          <label htmlFor="uraian" className="form-label">
            Uraian Tugas <span aria-hidden>*</span>
          </label>
          <input
            id="uraian"
            type="text"
            {...register("uraian")}
            placeholder="cth. Menyusun evaluasi karyawan"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.uraian}
          />
          {errors.uraian && (
            <p className="form-error" role="alert">
              {errors.uraian.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="unit" className="form-label">
            Unit / Jenjang <span aria-hidden>*</span>
          </label>
          <input
            id="unit"
            type="text"
            {...register("unit")}
            placeholder="cth. TK, SD, SMP"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.unit}
          />
          {errors.unit && (
            <p className="form-error" role="alert">
              {errors.unit.message}
            </p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="kategori_jabatan" className="form-label">
            Kategori Jabatan <span aria-hidden>*</span>
          </label>
          <input
            id="kategori_jabatan"
            type="text"
            {...register("kategori_jabatan")}
            placeholder="cth. Kepala Sekolah"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.kategori_jabatan}
          />
          {errors.kategori_jabatan && (
            <p className="form-error" role="alert">
              {errors.kategori_jabatan.message}
            </p>
          )}
        </div>
        <div className="w-28">
          <label htmlFor="urutan" className="form-label">
            Urutan <span aria-hidden>*</span>
          </label>
          <input
            id="urutan"
            type="number"
            min={1}
            {...register("urutan", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.urutan}
          />
          {errors.urutan && (
            <p className="form-error" role="alert">
              {errors.urutan.message}
            </p>
          )}
        </div>
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
        <label htmlFor="detil_tugas_id" className="form-label">
          Detil Tugas <span className="font-normal text-gray-400">(opsional)</span>
        </label>
        <select
          id="detil_tugas_id"
          {...register("detil_tugas_id")}
          disabled={!watchedPokokId}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">-- Tidak masuk detil tugas --</option>
          {filteredDetil.map((dt) => (
            <option key={dt.id} value={dt.id}>
              {dt.nama}
            </option>
          ))}
        </select>
        {!watchedPokokId && (
          <p className="mt-1 text-xs text-gray-400">Pilih tugas pokok terlebih dahulu.</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Uraian Tugas"}
        </button>
        <Link
          href="/master-data/uraian-tugas"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
