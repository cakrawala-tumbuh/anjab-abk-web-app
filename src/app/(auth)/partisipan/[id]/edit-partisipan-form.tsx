"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import type { JabatanRead, MataPelajaranRead, PartisipanRead, SekolahRead } from "@/lib/api/schema";

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi").max(200),
  email: z.string().email("Format email tidak valid"),
  sekolah_id: z.string().min(1, "Sekolah wajib dipilih"),
  jabatan_utama_id: z.string().min(1, "Jabatan utama wajib dipilih"),
  jabatan_tambahan_ids: z.array(z.string()).default([]),
  masa_kerja_tahun: z.number({ invalid_type_error: "Isi angka tahun" }).min(0).max(50),
  masa_kerja_bulan: z.number({ invalid_type_error: "Isi angka bulan" }).min(0).max(11).default(0),
  mata_pelajaran_utama_id: z.string().optional(),
  aktif: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  partisipan: PartisipanRead;
  sekolah: SekolahRead[];
  jabatan: JabatanRead[];
  mataPelajaran: MataPelajaranRead[];
  accessToken: string | undefined;
}

export function EditPartisipanForm({
  partisipan,
  sekolah,
  jabatan,
  mataPelajaran,
  accessToken,
}: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama: partisipan.nama,
      email: partisipan.email,
      sekolah_id: partisipan.sekolah_id,
      jabatan_utama_id: partisipan.jabatan_utama_id,
      jabatan_tambahan_ids: partisipan.jabatan_tambahan_ids,
      masa_kerja_tahun: partisipan.masa_kerja_tahun,
      masa_kerja_bulan: partisipan.masa_kerja_bulan,
      mata_pelajaran_utama_id: partisipan.mata_pelajaran_utama_id ?? undefined,
      aktif: partisipan.aktif,
    },
  });

  const jabatanTambahanIds = watch("jabatan_tambahan_ids");

  function toggleJabatanTambahan(id: string) {
    const current = jabatanTambahanIds ?? [];
    if (current.includes(id)) {
      setValue(
        "jabatan_tambahan_ids",
        current.filter((x) => x !== id),
        { shouldDirty: true },
      );
    } else {
      setValue("jabatan_tambahan_ids", [...current, id], { shouldDirty: true });
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSaved(false);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.PATCH("/api/v1/partisipan/{partisipan_id}", {
        params: { path: { partisipan_id: partisipan.id } },
        body: {
          nama: values.nama,
          email: values.email,
          sekolah_id: values.sekolah_id,
          jabatan_utama_id: values.jabatan_utama_id,
          jabatan_tambahan_ids: values.jabatan_tambahan_ids,
          masa_kerja_tahun: values.masa_kerja_tahun,
          masa_kerja_bulan: values.masa_kerja_bulan,
          mata_pelajaran_utama_id: values.mata_pelajaran_utama_id || null,
          aktif: values.aktif,
        },
      });
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      setSaved(true);
      notifySukses("Partisipan berhasil diperbarui.");
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
      {saved && (
        <div role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-700">
          Data berhasil disimpan.
        </div>
      )}

      {/* Nama */}
      <div>
        <label htmlFor="edit-nama" className="form-label">
          Nama Lengkap <span aria-hidden>*</span>
        </label>
        <input
          id="edit-nama"
          type="text"
          {...register("nama")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.nama}
        />
        {errors.nama && (
          <p className="form-error" role="alert">
            {errors.nama.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="edit-email" className="form-label">
          Email <span aria-hidden>*</span>
        </label>
        <input
          id="edit-email"
          type="email"
          {...register("email")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="form-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Sekolah */}
      <div>
        <label htmlFor="edit-sekolah" className="form-label">
          Satuan Pendidikan <span aria-hidden>*</span>
        </label>
        <select
          id="edit-sekolah"
          {...register("sekolah_id")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">-- Pilih sekolah --</option>
          {sekolah.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
        </select>
        {errors.sekolah_id && (
          <p className="form-error" role="alert">
            {errors.sekolah_id.message}
          </p>
        )}
      </div>

      {/* Jabatan Utama */}
      <div>
        <label htmlFor="edit-jabatan-utama" className="form-label">
          Jabatan Utama <span aria-hidden>*</span>
        </label>
        <select
          id="edit-jabatan-utama"
          {...register("jabatan_utama_id")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">-- Pilih jabatan --</option>
          {jabatan.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nama}
            </option>
          ))}
        </select>
        {errors.jabatan_utama_id && (
          <p className="form-error" role="alert">
            {errors.jabatan_utama_id.message}
          </p>
        )}
      </div>

      {/* Jabatan Tambahan */}
      {jabatan.length > 0 && (
        <fieldset>
          <legend className="form-label">
            Jabatan Tambahan <span className="font-normal text-gray-400">(opsional)</span>
          </legend>
          <div className="mt-2 space-y-1">
            {jabatan.map((j) => (
              <label key={j.id} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={jabatanTambahanIds?.includes(j.id) ?? false}
                  onChange={() => toggleJabatanTambahan(j.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {j.nama}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Masa Kerja */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="edit-masa-kerja-tahun" className="form-label">
            Masa Kerja (Tahun) <span aria-hidden>*</span>
          </label>
          <input
            id="edit-masa-kerja-tahun"
            type="number"
            min={0}
            max={50}
            {...register("masa_kerja_tahun", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.masa_kerja_tahun && (
            <p className="form-error" role="alert">
              {errors.masa_kerja_tahun.message}
            </p>
          )}
        </div>
        <div className="flex-1">
          <label htmlFor="edit-masa-kerja-bulan" className="form-label">
            Bulan
          </label>
          <input
            id="edit-masa-kerja-bulan"
            type="number"
            min={0}
            max={11}
            {...register("masa_kerja_bulan", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Mata Pelajaran */}
      {mataPelajaran.length > 0 && (
        <div>
          <label htmlFor="edit-mata-pelajaran" className="form-label">
            Mata Pelajaran Utama{" "}
            <span className="font-normal text-gray-400">(opsional, untuk guru)</span>
          </label>
          <select
            id="edit-mata-pelajaran"
            {...register("mata_pelajaran_utama_id")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Tidak ada --</option>
            {mataPelajaran.map((mp) => (
              <option key={mp.id} value={mp.id}>
                {mp.nama}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-2">
        <input
          id="edit-aktif"
          type="checkbox"
          {...register("aktif")}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="edit-aktif" className="text-sm font-medium text-gray-700">
          Partisipan aktif
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
        <Link
          href="/partisipan"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Kembali
        </Link>
      </div>
    </form>
  );
}
