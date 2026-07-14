"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { jumlahAnggotaPanel, type PetaAnggotaPanel } from "@/lib/sme-panel";
import { SmePanelInfo } from "@/components/sme-panel-info";
import type { TiKombinasiRead } from "@/lib/api/schema";

export const schema = z
  .object({
    jabatan_id: z.string().min(1, "Jabatan wajib dipilih"),
    periode: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Format periode: YYYY-MM (cth. 2026-06)")
      .min(7)
      .max(7),
    min_responden: z
      .number({ invalid_type_error: "Isi angka" })
      .int()
      .min(1, "Minimal 1")
      .default(3),
    max_responden: z
      .number({ invalid_type_error: "Isi angka" })
      .int()
      .min(1, "Minimal 1")
      .default(10),
    catatan: z.string().max(500).optional(),
  })
  .refine((d) => d.max_responden >= d.min_responden, {
    message: "Maksimum harus ≥ minimum",
    path: ["max_responden"],
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  kombinasi: TiKombinasiRead[];
  /** `jabatan_id` → jumlah anggota SME panel; menentukan `max_responden` yang sah. */
  petaAnggota: PetaAnggotaPanel;
  accessToken: string | undefined;
}

export function TiSesiForm({ kombinasi, petaAnggota, accessToken }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const jabatanOptions = useMemo(() => {
    const seen = new Set<string>();
    return kombinasi
      .filter((k) => {
        if (seen.has(k.jabatan_id)) return false;
        seen.add(k.jabatan_id);
        return true;
      })
      .sort((a, b) => a.jabatan_nama.localeCompare(b.jabatan_nama));
  }, [kombinasi]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { jabatan_id: "", min_responden: 3, max_responden: 10 },
  });

  const jabatanId = watch("jabatan_id");
  const jumlahAnggota = jumlahAnggotaPanel(petaAnggota, jabatanId);

  // Seluruh anggota SME panel otomatis jadi responden; backend menolak keras
  // (422) bila jumlahnya melebihi max_responden. Prefill supaya admin tidak
  // menebak — angkanya tetap bisa diubah manual.
  useEffect(() => {
    if (jumlahAnggota && jumlahAnggota > 0) {
      setValue("max_responden", jumlahAnggota, { shouldValidate: true });
    }
  }, [jumlahAnggota, setValue]);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { data, error, response } = await client.POST("/api/v1/task-inventory/sesi", {
        body: {
          jabatan_id: values.jabatan_id,
          periode: values.periode,
          min_responden: values.min_responden,
          max_responden: values.max_responden,
          catatan: values.catatan || null,
        },
      });
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      notifySukses("Analisis jabatan berhasil dibuat.");
      router.push(`/task-inventory/${data!.id}`);
    } catch (err) {
      setServerError(pesanGagal(err));
      notifyGagal(err);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="form-card space-y-5 p-6">
      {serverError && (
        <div role="alert" className="form-server-error">
          {serverError}
        </div>
      )}

      {/* Jabatan */}
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
          <option value="">-- Pilih jabatan --</option>
          {jabatanOptions.map((k) => (
            <option key={k.jabatan_id} value={k.jabatan_id}>
              {k.jabatan_nama}
            </option>
          ))}
        </select>
        <SmePanelInfo jumlah={jumlahAnggota} />
        {errors.jabatan_id && (
          <p className="form-error" role="alert">
            {errors.jabatan_id.message}
          </p>
        )}
      </div>

      {/* Periode */}
      <div>
        <label htmlFor="periode" className="form-label">
          Periode <span aria-hidden>*</span>
        </label>
        <input
          id="periode"
          type="text"
          {...register("periode")}
          placeholder="cth. 2026-06"
          maxLength={7}
          className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.periode}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Format: YYYY-MM</p>
        {errors.periode && (
          <p className="form-error" role="alert">
            {errors.periode.message}
          </p>
        )}
      </div>

      {/* Min/Max Responden */}
      <div className="flex gap-4">
        <div className="w-36">
          <label htmlFor="min_responden" className="form-label">
            Min. Responden <span aria-hidden>*</span>
          </label>
          <input
            id="min_responden"
            type="number"
            min={1}
            {...register("min_responden", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.min_responden}
          />
          {errors.min_responden && (
            <p className="form-error" role="alert">
              {errors.min_responden.message}
            </p>
          )}
        </div>
        <div className="w-36">
          <label htmlFor="max_responden" className="form-label">
            Maks. Responden <span aria-hidden>*</span>
          </label>
          <input
            id="max_responden"
            type="number"
            min={1}
            {...register("max_responden", { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.max_responden}
          />
          {errors.max_responden && (
            <p className="form-error" role="alert">
              {errors.max_responden.message}
            </p>
          )}
        </div>
      </div>

      {/* Catatan */}
      <div>
        <label htmlFor="catatan" className="form-label">
          Catatan <span className="font-normal text-gray-400">(opsional)</span>
        </label>
        <textarea
          id="catatan"
          rows={3}
          {...register("catatan")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Membuat…" : "Mulai Analisis Jabatan"}
        </button>
        <Link
          href="/task-inventory"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
