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
import { FREKUENSI, KONDISI, SUMBER_BUKTI, VA_TYPE } from "@/components/calhr";
import type { DetilTugasRead, JabatanRead, TugasPokokRead } from "@/lib/api/schema";

const schema = z.object({
  kode: z.string().min(1, "Kode wajib diisi").max(20, "Kode terlalu panjang"),
  uraian: z.string().min(1, "Uraian wajib diisi").max(500, "Uraian terlalu panjang"),
  unit: z.string().min(1, "Unit wajib diisi").max(20, "Unit terlalu panjang"),
  urutan: z
    .number({ invalid_type_error: "Isi angka urutan" })
    .int("Urutan harus bilangan bulat")
    .min(1, "Urutan minimal 1"),
  tugas_pokok_id: z.string().min(1, "Tugas pokok wajib dipilih"),
  detil_tugas_id: z.string().min(1, "Detil tugas wajib dipilih"),
  jabatan_id: z.string().min(1, "Jabatan wajib dipilih"),
  std_sumber_bukti: z.enum(SUMBER_BUKTI).optional(),
  std_kondisi: z.enum(KONDISI).optional(),
  std_frekuensi_teks: z.string().max(100).optional(),
  std_durasi_per_kali: z.string().max(100).optional(),
  std_jam_per_minggu: z.number().min(0).optional(),
  std_peak4w_hours: z.number().min(0).optional(),
  std_va_type: z.enum(VA_TYPE).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  tugasPokok: TugasPokokRead[];
  detilTugas: DetilTugasRead[];
  jabatanList: JabatanRead[];
  accessToken: string | undefined;
  defaultValues?: Partial<FormValues>;
  /** ID untuk mode edit; tidak ada = mode tambah */
  editId?: string;
}

export function TambahUraianTugasForm({
  tugasPokok,
  detilTugas,
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
    defaultValues: {
      kode: "",
      uraian: "",
      unit: "",
      urutan: 1,
      tugas_pokok_id: "",
      detil_tugas_id: "",
      jabatan_id: "",
      ...defaultValues,
    },
  });

  const watchedPokokId = watch("tugas_pokok_id");
  const watchedDetilId = watch("detil_tugas_id");
  const watchedFrekuensi = watch("std_frekuensi_teks");

  const filteredDetil = detilTugas.filter((dt) => dt.tugas_pokok_id === watchedPokokId);
  const selectedDT = detilTugas.find((dt) => dt.id === watchedDetilId);
  const filteredJabatan = jabatanList.filter((j) => (selectedDT?.jabatan_ids ?? []).includes(j.id));

  function handlePokokChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue("tugas_pokok_id", e.target.value, { shouldValidate: true });
    setValue("detil_tugas_id", "", { shouldValidate: true });
    setValue("jabatan_id", "", { shouldValidate: true });
  }

  function handleDetilChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setValue("detil_tugas_id", e.target.value, { shouldValidate: true });
    setValue("jabatan_id", "", { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const body = {
        kode: values.kode,
        uraian: values.uraian,
        unit: values.unit,
        urutan: values.urutan,
        tugas_pokok_id: values.tugas_pokok_id,
        detil_tugas_id: values.detil_tugas_id,
        jabatan_id: values.jabatan_id,
        std_sumber_bukti: values.std_sumber_bukti || null,
        std_kondisi: values.std_kondisi || null,
        std_frekuensi_teks: values.std_frekuensi_teks || null,
        std_durasi_per_kali: values.std_durasi_per_kali || null,
        std_jam_per_minggu: values.std_jam_per_minggu ?? null,
        std_peak4w_hours: values.std_peak4w_hours ?? null,
        std_va_type: values.std_va_type || null,
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
          body,
        });
        const requestId = response.headers.get("x-request-id");
        if (error) throw toApiError(error, requestId);
      }
      notifySukses(
        editId ? "Uraian tugas berhasil diperbarui." : "Uraian tugas berhasil ditambahkan.",
      );
      router.push("/master-data/uraian-tugas");
      router.refresh();
    } catch (err) {
      setServerError(pesanGagal(err));
      notifyGagal(err);
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
          Detil Tugas <span aria-hidden>*</span>
        </label>
        <select
          id="detil_tugas_id"
          value={watchedDetilId}
          onChange={handleDetilChange}
          disabled={!watchedPokokId}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          aria-invalid={!!errors.detil_tugas_id}
        >
          <option value="">-- Pilih detil tugas --</option>
          {filteredDetil.map((dt) => (
            <option key={dt.id} value={dt.id}>
              {dt.nama}
            </option>
          ))}
        </select>
        {!watchedPokokId && (
          <p className="mt-1 text-xs text-gray-400">Pilih tugas pokok terlebih dahulu.</p>
        )}
        {errors.detil_tugas_id && (
          <p className="form-error" role="alert">
            {errors.detil_tugas_id.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="jabatan_id" className="form-label">
          Jabatan <span aria-hidden>*</span>
        </label>
        <select
          id="jabatan_id"
          {...register("jabatan_id")}
          disabled={!watchedDetilId}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          aria-invalid={!!errors.jabatan_id}
        >
          <option value="">-- Pilih jabatan --</option>
          {filteredJabatan.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nama} ({j.kode})
            </option>
          ))}
        </select>
        {!watchedDetilId && (
          <p className="mt-1 text-xs text-gray-400">Pilih detil tugas terlebih dahulu.</p>
        )}
        {watchedDetilId && filteredJabatan.length === 0 && (
          <p className="mt-1 text-xs text-gray-400">Tidak ada jabatan untuk detil tugas ini.</p>
        )}
        {errors.jabatan_id && (
          <p className="form-error" role="alert">
            {errors.jabatan_id.message}
          </p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-5">
        <h3 className="text-sm font-semibold text-gray-800">Nilai Standar Tahap 3</h3>
        <p className="mt-1 text-xs text-gray-500">
          Bila diisi, nilai ini akan otomatis muncul sebagai isian awal partisipan di Tahap 3.
          Partisipan cukup menyatakan setuju; bila tidak setuju, ia dapat mengubahnya. Kosongkan
          bila tugas ini tidak punya standar.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="std_sumber_bukti" className="form-label">
              Sumber Bukti
            </label>
            <select
              id="std_sumber_bukti"
              {...register("std_sumber_bukti")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— tidak ada standar —</option>
              {SUMBER_BUKTI.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="std_kondisi" className="form-label">
              Kondisi
            </label>
            <select
              id="std_kondisi"
              {...register("std_kondisi")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— tidak ada standar —</option>
              {KONDISI.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="std_frekuensi_teks" className="form-label">
              Frekuensi
            </label>
            <select
              id="std_frekuensi_teks"
              {...register("std_frekuensi_teks")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— tidak ada standar —</option>
              {watchedFrekuensi &&
                !FREKUENSI.includes(watchedFrekuensi as (typeof FREKUENSI)[number]) && (
                  <option value={watchedFrekuensi}>{watchedFrekuensi}</option>
                )}
              {FREKUENSI.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="std_durasi_per_kali" className="form-label">
              Durasi/kali
            </label>
            <input
              id="std_durasi_per_kali"
              type="text"
              placeholder="cth. 60 menit, Bervariasi, <2 jam"
              {...register("std_durasi_per_kali")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="std_jam_per_minggu" className="form-label">
              Jam/minggu
            </label>
            <input
              id="std_jam_per_minggu"
              type="number"
              min={0}
              step="0.5"
              {...register("std_jam_per_minggu", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="std_peak4w_hours" className="form-label">
              Jam peak (4 minggu)
            </label>
            <input
              id="std_peak4w_hours"
              type="number"
              min={0}
              step="0.5"
              {...register("std_peak4w_hours", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="std_va_type" className="form-label">
              VA Type
            </label>
            <select
              id="std_va_type"
              {...register("std_va_type")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— tidak ada standar —</option>
              {VA_TYPE.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
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
