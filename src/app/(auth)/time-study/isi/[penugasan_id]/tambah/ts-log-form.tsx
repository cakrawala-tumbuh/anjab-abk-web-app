"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";

const KATEGORI = [
  { key: "core", label: "Pekerjaan Inti" },
  { key: "character", label: "Asesmen Karakter" },
  { key: "improve", label: "Pengembangan Diri" },
  { key: "strategic", label: "Pekerjaan Strategis" },
  { key: "admin", label: "Administrasi" },
  { key: "recovery", label: "Istirahat Terstruktur" },
] as const;

type KategoriKey = (typeof KATEGORI)[number]["key"];

export const schema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  waktu_masuk: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  waktu_keluar: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM"),
  day_color: z.enum(["GREEN", "YELLOW", "RED"]),
  jam_core: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(23).default(0),
  menit_core: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(59).default(0),
  jam_character: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(23).default(0),
  menit_character: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(59).default(0),
  jam_improve: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(23).default(0),
  menit_improve: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(59).default(0),
  jam_strategic: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(23).default(0),
  menit_strategic: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(59).default(0),
  jam_admin: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(23).default(0),
  menit_admin: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(59).default(0),
  jam_recovery: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(23).default(0),
  menit_recovery: z.number({ invalid_type_error: "Isi angka" }).int().min(0).max(59).default(0),
  catatan: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  penugasanId: string;
  accessToken: string | undefined;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TsLogForm({ penugasanId, accessToken }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tanggal: todayString(),
      day_color: "GREEN",
      jam_core: 0,
      menit_core: 0,
      jam_character: 0,
      menit_character: 0,
      jam_improve: 0,
      menit_improve: 0,
      jam_strategic: 0,
      menit_strategic: 0,
      jam_admin: 0,
      menit_admin: 0,
      jam_recovery: 0,
      menit_recovery: 0,
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.POST(
        "/api/v1/time-study/penugasan/{penugasan_id}/log",
        {
          params: { path: { penugasan_id: penugasanId } },
          body: {
            tanggal: values.tanggal,
            waktu_masuk: values.waktu_masuk,
            waktu_keluar: values.waktu_keluar,
            day_color: values.day_color,
            menit_core: values.jam_core * 60 + values.menit_core,
            menit_character: values.jam_character * 60 + values.menit_character,
            menit_improve: values.jam_improve * 60 + values.menit_improve,
            menit_strategic: values.jam_strategic * 60 + values.menit_strategic,
            menit_admin: values.jam_admin * 60 + values.menit_admin,
            menit_recovery: values.jam_recovery * 60 + values.menit_recovery,
            catatan: values.catatan || null,
          },
        },
      );
      const reqId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, reqId);
      router.push(`/time-study/isi/${penugasanId}`);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-lg border border-gray-200 bg-white p-6"
    >
      {serverError && (
        <div role="alert" className="form-server-error">
          {serverError}
        </div>
      )}

      {/* Tanggal & Waktu */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="tanggal" className="form-label">
            Tanggal <span aria-hidden>*</span>
          </label>
          <input
            id="tanggal"
            type="date"
            {...register("tanggal")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.tanggal}
          />
          {errors.tanggal && (
            <p className="form-error" role="alert">
              {errors.tanggal.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="waktu_masuk" className="form-label">
            Waktu Masuk <span aria-hidden>*</span>
          </label>
          <input
            id="waktu_masuk"
            type="time"
            {...register("waktu_masuk")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.waktu_masuk}
          />
          {errors.waktu_masuk && (
            <p className="form-error" role="alert">
              {errors.waktu_masuk.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="waktu_keluar" className="form-label">
            Waktu Keluar <span aria-hidden>*</span>
          </label>
          <input
            id="waktu_keluar"
            type="time"
            {...register("waktu_keluar")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-invalid={!!errors.waktu_keluar}
          />
          {errors.waktu_keluar && (
            <p className="form-error" role="alert">
              {errors.waktu_keluar.message}
            </p>
          )}
        </div>
      </div>

      {/* Warna Hari */}
      <div>
        <label htmlFor="day_color" className="form-label">
          Kategori Hari <span aria-hidden>*</span>
        </label>
        <select
          id="day_color"
          {...register("day_color")}
          className="mt-1 block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="GREEN">Hijau (Hari Biasa)</option>
          <option value="YELLOW">Kuning (Hari Sibuk)</option>
          <option value="RED">Merah (Hari Puncak)</option>
        </select>
      </div>

      {/* Distribusi Waktu per Kategori */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-gray-700">
          Distribusi Waktu per Kategori <span aria-hidden>*</span>
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          Isi jam dan menit untuk setiap kategori aktivitas kerja.
        </p>
        <div className="space-y-3">
          {KATEGORI.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-4">
              <span className="w-48 text-sm text-gray-700">{label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={23}
                  {...register(`jam_${key}` as `jam_${KategoriKey}`, { valueAsNumber: true })}
                  className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label={`${label} jam`}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">jam</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  {...register(`menit_${key}` as `menit_${KategoriKey}`, { valueAsNumber: true })}
                  className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label={`${label} menit`}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">menit</span>
              </div>
            </div>
          ))}
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
          placeholder="Catatan tambahan untuk hari ini…"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan…" : "Simpan Log"}
        </button>
        <Link
          href={`/time-study/isi/${penugasanId}`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
