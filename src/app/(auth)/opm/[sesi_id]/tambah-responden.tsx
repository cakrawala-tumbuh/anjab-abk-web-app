"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import type { PartisipanRead } from "@/lib/api/schema";

const schema = z.object({
  partisipan_id: z.string().min(1, "Partisipan wajib dipilih"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  sesiId: string;
  /** Hanya partisipan yang merupakan anggota SME panel jabatan sesi ini dan belum terdaftar. */
  partisipan: PartisipanRead[];
  jabatanLabel: string;
  accessToken: string | undefined;
}

export function TambahResponden({ sesiId, partisipan, jabatanLabel, accessToken }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { partisipan_id: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const p = partisipan.find((x) => x.id === values.partisipan_id);
      const { error, response } = await client.POST("/api/v1/opm/sesi/{sesi_id}/responden", {
        params: { path: { sesi_id: sesiId } },
        body: {
          nama: p?.nama ?? null,
          jabatan_label: jabatanLabel,
          partisipan_id: values.partisipan_id,
        },
      });
      const reqId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, reqId);
      notifySukses("Responden berhasil ditambahkan.");
      reset();
      router.refresh();
    } catch (err) {
      setServerError(pesanGagal(err));
      notifyGagal(err);
    }
  }

  if (partisipan.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500 dark:text-gray-400">
        Semua anggota SME panel jabatan ini sudah terdaftar sebagai responden.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-lg border border-gray-200 bg-white p-5"
    >
      {serverError && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Pilih Partisipan */}
        <div className="sm:col-span-2">
          <label htmlFor="partisipan_select" className="form-label">
            Anggota SME Panel <span aria-hidden>*</span>
          </label>
          <select
            id="partisipan_select"
            {...register("partisipan_id")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.partisipan_id}
          >
            <option value="">-- Pilih partisipan --</option>
            {partisipan.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Hanya anggota SME panel jabatan ini yang belum terdaftar sebagai responden.
          </p>
          {errors.partisipan_id && (
            <p className="form-error" role="alert">
              {errors.partisipan_id.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Mendaftarkan…" : "+ Daftarkan"}
          </button>
        </div>
      </div>
    </form>
  );
}
