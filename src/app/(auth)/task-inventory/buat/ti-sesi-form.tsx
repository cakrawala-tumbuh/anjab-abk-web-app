"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import type { TiKombinasiRead } from "@/lib/api/schema";

export const schema = z.object({
  jabatan_id: z.string().min(1, "Jabatan wajib dipilih"),
  cabang: z.enum(["Bandung", "Semarang"], {
    errorMap: () => ({ message: "Cabang wajib dipilih" }),
  }),
  catatan: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  kombinasi: TiKombinasiRead[];
  accessToken: string | undefined;
}

export function TiSesiForm({ kombinasi, accessToken }: Props) {
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
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { jabatan_id: "" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { data, error, response } = await client.POST("/api/v1/task-inventory/sesi", {
        body: {
          jabatan_id: values.jabatan_id,
          cabang: values.cabang,
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
        {errors.jabatan_id && (
          <p className="form-error" role="alert">
            {errors.jabatan_id.message}
          </p>
        )}
      </div>

      {/* Cabang */}
      <div>
        <label htmlFor="cabang" className="form-label">
          Cabang <span aria-hidden>*</span>
        </label>
        <select
          id="cabang"
          {...register("cabang")}
          defaultValue=""
          className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.cabang}
        >
          <option value="">-- Pilih cabang --</option>
          <option value="Bandung">Bandung</option>
          <option value="Semarang">Semarang</option>
        </select>
        {errors.cabang && (
          <p className="form-error" role="alert">
            {errors.cabang.message}
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
