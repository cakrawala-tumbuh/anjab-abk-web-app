"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { PartisipanRead } from "@/lib/api/schema";

// ─── Tambah Anggota Form ──────────────────────────────────────────────────────

const schema = z.object({
  partisipan_id: z.string().min(1, "Partisipan wajib dipilih"),
});
type FormValues = z.infer<typeof schema>;

interface TambahProps {
  panelId: string;
  partisipanBelumAnggota: PartisipanRead[];
  accessToken: string | undefined;
}

function TambahForm({ panelId, partisipanBelumAnggota, accessToken }: TambahProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error, response } = await client.POST("/api/v1/sme-panel/{panel_id}/anggota", {
        params: { path: { panel_id: panelId } },
        body: { partisipan_id: values.partisipan_id },
      });
      const requestId = response.headers.get("x-request-id");
      if (error) throw toApiError(error, requestId);
      reset();
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  }

  if (partisipanBelumAnggota.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Semua partisipan yang sesuai jabatan sudah menjadi anggota panel ini.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3">
      {serverError && (
        <div role="alert" className="text-sm text-red-600">
          {serverError}
        </div>
      )}
      <div className="flex-1">
        <label htmlFor="partisipan_id" className="block text-sm font-medium text-gray-700">
          Tambah Anggota
        </label>
        <select
          id="partisipan_id"
          {...register("partisipan_id")}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-invalid={!!errors.partisipan_id}
        >
          <option value="">-- Pilih partisipan --</option>
          {partisipanBelumAnggota.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama} — {p.email}
            </option>
          ))}
        </select>
        {errors.partisipan_id && (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {errors.partisipan_id.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Menambahkan…" : "Tambah"}
      </button>
    </form>
  );
}

// ─── Hapus Anggota Button ─────────────────────────────────────────────────────

interface HapusAnggotaProps {
  panelId: string;
  partisipanId: string;
  accessToken: string | undefined;
}

export function HapusAnggotaButton({ panelId, partisipanId, accessToken }: HapusAnggotaProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleHapus() {
    if (!confirm("Hapus partisipan ini dari panel SME?")) return;
    setLoading(true);
    try {
      const client = withServerAuth(accessToken);
      await client.DELETE("/api/v1/sme-panel/{panel_id}/anggota/{partisipan_id}", {
        params: { path: { panel_id: panelId, partisipan_id: partisipanId } },
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleHapus}
      disabled={loading}
      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {loading ? "Menghapus…" : "Hapus"}
    </button>
  );
}

// ─── Set Koordinator Button ───────────────────────────────────────────────────

interface SetKoordinatorProps {
  panelId: string;
  partisipanId: string;
  isKoordinator: boolean;
  accessToken: string | undefined;
}

export function SetKoordinatorButton({
  panelId,
  partisipanId,
  isKoordinator,
  accessToken,
}: SetKoordinatorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSet() {
    setLoading(true);
    try {
      const client = withServerAuth(accessToken);
      const newKoordinatorId = isKoordinator ? null : partisipanId;
      await client.PATCH("/api/v1/sme-panel/{panel_id}", {
        params: { path: { panel_id: panelId } },
        body: { koordinator_id: newKoordinatorId },
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (isKoordinator) {
    return (
      <button
        onClick={handleSet}
        disabled={loading}
        className="text-xs text-amber-600 hover:text-amber-800 disabled:opacity-50"
        title="Klik untuk hapus sebagai koordinator"
      >
        {loading ? "Memproses…" : "Batalkan Koordinator"}
      </button>
    );
  }

  return (
    <button
      onClick={handleSet}
      disabled={loading}
      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
    >
      {loading ? "Memproses…" : "Jadikan Koordinator"}
    </button>
  );
}

// ─── Anggota Section (client-side fetch partisipan) ──────────────────────────

interface AnggotaSectionProps {
  panelId: string;
  panelJabatanId: string;
  partisipanIds: string[];
  koordinatorId: string | null;
  jabatanMap: Record<string, { nama: string }>;
  accessToken: string | undefined;
}

export function AnggotaSection({
  panelId,
  panelJabatanId,
  partisipanIds,
  koordinatorId,
  jabatanMap,
  accessToken,
}: AnggotaSectionProps) {
  const [partisipanList, setPartisipanList] = useState<PartisipanRead[] | null>(null);

  useEffect(() => {
    api
      .GET("/api/v1/partisipan", { params: { query: { limit: 100 } } })
      .then(({ data }) => setPartisipanList(data?.items ?? []))
      .catch(() => setPartisipanList([]));
  }, []);

  if (partisipanList === null) {
    return <p className="text-sm text-gray-400">Memuat data partisipan…</p>;
  }

  const partisipanMap = Object.fromEntries(partisipanList.map((p) => [p.id, p]));
  const partisipanAnggota = partisipanIds
    .map((pid) => partisipanMap[pid])
    .filter(Boolean) as PartisipanRead[];

  const partisipanTersedia = partisipanList.filter((p) => {
    const jabatanIds = new Set([p.jabatan_utama_id, ...(p.jabatan_tambahan_ids ?? [])]);
    return jabatanIds.has(panelJabatanId);
  });
  const partisipanBelumAnggota = partisipanTersedia.filter((p) => !partisipanIds.includes(p.id));

  return (
    <>
      <TambahForm
        panelId={panelId}
        partisipanBelumAnggota={partisipanBelumAnggota}
        accessToken={accessToken}
      />

      {partisipanAnggota.length === 0 ? (
        <p className="text-sm text-gray-500">
          Belum ada anggota. Tambahkan partisipan yang jabatannya sesuai.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nama</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Jabatan Utama</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Koordinator</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partisipanAnggota.map((p) => {
                const isKoordinator = koordinatorId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nama}</td>
                    <td className="px-4 py-3 text-gray-600">{p.email}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {jabatanMap[p.jabatan_utama_id]?.nama ?? p.jabatan_utama_id}
                    </td>
                    <td className="px-4 py-3">
                      {isKoordinator ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Koordinator
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <SetKoordinatorButton
                        panelId={panelId}
                        partisipanId={p.id}
                        isKoordinator={isKoordinator}
                        accessToken={accessToken}
                      />
                      <HapusAnggotaButton
                        panelId={panelId}
                        partisipanId={p.id}
                        accessToken={accessToken}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
