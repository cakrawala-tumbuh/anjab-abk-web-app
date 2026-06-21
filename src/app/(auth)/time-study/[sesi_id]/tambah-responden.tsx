"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/schema";

type JabatanRead = components["schemas"]["JabatanRead"];
type PartisipanRead = components["schemas"]["PartisipanRead"];

const schema = z.object({
  partisipan_id: z.string().optional(),
  nama: z.string().max(200).optional(),
  jabatan_label: z.string().min(1, "Label jabatan wajib diisi").max(200),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  sesiId: string;
  partisipan: PartisipanRead[];
  jabatan: JabatanRead[];
  accessToken: string | undefined;
}

export function TambahResponden({ sesiId, partisipan, jabatan, accessToken }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const jabatanMap = Object.fromEntries(jabatan.map((j) => [j.id, j.nama]));

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { partisipan_id: "", nama: "", jabatan_label: "" },
  });

  function onSelectPartisipan(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setValue("partisipan_id", id);
    if (!id) {
      setValue("nama", "");
      setValue("jabatan_label", "");
      return;
    }
    const p = partisipan.find((x) => x.id === id);
    if (p) {
      setValue("nama", p.nama);
      const jabatanNama = jabatanMap[p.jabatan_utama_id] ?? "";
      setValue("jabatan_label", jabatanNama, { shouldValidate: true });
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.POST("/api/v1/time-study/sesi/{sesi_id}/responden", {
        params: { path: { sesi_id: sesiId } },
        body: {
          nama: values.nama || null,
          jabatan_label: values.jabatan_label,
          partisipan_id: values.partisipan_id || null,
        },
      });
      const reqId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, reqId);
      reset();
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
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
        <div className="sm:col-span-3">
          <label htmlFor="partisipan_select" className="block text-sm font-medium text-gray-700">
            Pilih dari Partisipan{" "}
            <span className="font-normal text-gray-400">(opsional — pre-isi nama & jabatan)</span>
          </label>
          <select
            id="partisipan_select"
            onChange={onSelectPartisipan}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Pilih partisipan --</option>
            {partisipan.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama} — {jabatanMap[p.jabatan_utama_id] ?? "?"}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            Memilih partisipan akan mengisi nama dan label jabatan secara otomatis.
          </p>
        </div>

        {/* Nama */}
        <div>
          <label htmlFor="resp-nama" className="block text-sm font-medium text-gray-700">
            Nama <span className="font-normal text-gray-400">(opsional)</span>
          </label>
          <input
            id="resp-nama"
            type="text"
            {...register("nama")}
            placeholder="cth. Budi Santoso, S.Pd."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Jabatan Label */}
        <div>
          <label htmlFor="resp-jabatan" className="block text-sm font-medium text-gray-700">
            Label Jabatan <span aria-hidden>*</span>
          </label>
          <input
            id="resp-jabatan"
            type="text"
            {...register("jabatan_label")}
            placeholder="cth. Guru Matematika"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.jabatan_label}
          />
          {errors.jabatan_label && (
            <p className="mt-1 text-xs text-red-600" role="alert">
              {errors.jabatan_label.message}
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
