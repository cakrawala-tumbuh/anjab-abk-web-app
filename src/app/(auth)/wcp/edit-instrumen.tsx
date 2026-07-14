"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import type { WcpInstrumenRead } from "@/lib/api/schema";

export const schema = z.object({
  min_responden: z.number({ invalid_type_error: "Isi angka" }).int().min(1, "Minimal 1"),
  catatan: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  instrumen: WcpInstrumenRead;
  accessToken: string | undefined;
}

/** Form inline pembaruan pengaturan instrumen WCP (min_responden/catatan). */
export function EditInstrumen({ instrumen, accessToken }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      min_responden: instrumen.min_responden,
      catatan: instrumen.catatan ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.PATCH("/api/v1/wcp/instrumen", {
        body: {
          min_responden: values.min_responden,
          catatan: values.catatan || null,
        },
      });
      const reqId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, reqId);
      notifySukses("Instrumen berhasil disimpan.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setServerError(pesanGagal(err));
      notifyGagal(err);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
      >
        Ubah pengaturan instrumen
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div role="alert" className="form-server-error">
          {serverError}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div className="w-40">
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
        <div className="flex-1">
          <label htmlFor="catatan" className="form-label">
            Catatan <span className="font-normal text-gray-400">(opsional)</span>
          </label>
          <input
            id="catatan"
            type="text"
            {...register("catatan")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan…" : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
