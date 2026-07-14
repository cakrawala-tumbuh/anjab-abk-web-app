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
import type { components } from "@/lib/api/schema";

type PartisipanRead = components["schemas"]["PartisipanRead"];
type JabatanRead = components["schemas"]["JabatanRead"];

export const schema = z.object({
  partisipan_id: z.string().min(1, "Partisipan wajib dipilih"),
  catatan: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  partisipan: PartisipanRead[];
  jabatan: JabatanRead[];
  accessToken: string | undefined;
}

export function TsPenugasanForm({ partisipan, jabatan, accessToken }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j.nama]));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { data, error, response } = await client.POST("/api/v1/time-study/penugasan", {
        body: {
          partisipan_id: values.partisipan_id,
          aktif: true,
          catatan: values.catatan || null,
        },
      });
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      notifySukses("Penugasan berhasil dibuat.");
      router.push(`/time-study/${data!.id}`);
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

      {/* Partisipan */}
      <div>
        <label htmlFor="partisipan_id" className="form-label">
          Partisipan <span aria-hidden>*</span>
        </label>
        <select
          id="partisipan_id"
          {...register("partisipan_id")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.partisipan_id}
        >
          <option value="">-- Pilih partisipan --</option>
          {partisipan.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama} — {jabatanMap[p.jabatan_utama_id] ?? p.jabatan_utama_id}
            </option>
          ))}
        </select>
        {errors.partisipan_id && (
          <p className="form-error" role="alert">
            {errors.partisipan_id.message}
          </p>
        )}
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
          {isSubmitting ? "Menugaskan…" : "Tugaskan"}
        </button>
        <Link
          href="/time-study"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
