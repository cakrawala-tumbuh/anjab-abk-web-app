"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import type { TiCatalogPurgeResult, TiCatalogReseedResult } from "@/lib/api/schema";

interface Props {
  accessToken: string | undefined;
  initialTotal: number;
}

type Ringkasan = {
  deleted: TiCatalogPurgeResult["deleted"];
  created: TiCatalogReseedResult["created"];
};

export function ResetKatalogPanel({ accessToken, initialTotal }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);

  async function resetKatalog() {
    if (
      !confirm(
        `Reset katalog Task Inventory? Ini akan MENGHAPUS TOTAL ${initialTotal} uraian tugas ` +
          "beserta seluruh tugas pokok & detil tugas, lalu mengisi ulang dari task_catalog.json. " +
          "Ditolak bila masih ada sesi Task Inventory (status apa pun).",
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    setRingkasan(null);

    // Variabel LOKAL, bukan state: nilainya harus terbaca di `catch` pada invocation
    // yang sama. State React tidak ter-update di tengah fungsi yang sedang berjalan,
    // jadi memakai state di sini membuat cabang pemulihan tidak pernah terpicu.
    let sudahDikosongkan = false;

    try {
      const client = withServerAuth(accessToken);

      const purgeRes = await client.POST("/api/v1/task-inventory/catalog/purge", {});
      const purgeReqId = purgeRes.response.headers.get("x-request-id");
      if (purgeRes.error) throw toApiError(purgeRes.error, purgeReqId);
      sudahDikosongkan = true;

      const reseedRes = await client.POST("/api/v1/task-inventory/catalog/reseed", {});
      const reseedReqId = reseedRes.response.headers.get("x-request-id");
      if (reseedRes.error) throw toApiError(reseedRes.error, reseedReqId);

      setRingkasan({
        deleted: purgeRes.data!.deleted,
        created: reseedRes.data!.created,
      });
      notifySukses("Katalog berhasil di-reset.");
      router.refresh();
    } catch (err) {
      if (sudahDikosongkan) {
        const pesan =
          "Katalog sudah dikosongkan tapi reseed gagal — klik ulang untuk mengisi ulang.";
        setError(pesan);
        notifyGagal(new Error(pesan));
      } else {
        setError(pesanGagal(err));
        notifyGagal(err);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {ringkasan && (
        <div className="text-sm text-green-700 dark:text-green-400">
          <p>✓ Katalog berhasil di-reset.</p>
          <p>
            Dihapus: {ringkasan.deleted.uraian_tugas} uraian tugas, {ringkasan.deleted.detil_tugas}{" "}
            detil tugas, {ringkasan.deleted.tugas_pokok} tugas pokok.
          </p>
          <p>
            Diisi ulang: {ringkasan.created.jabatan} jabatan, {ringkasan.created.tugas_pokok} tugas
            pokok, {ringkasan.created.detil_tugas} detil tugas, {ringkasan.created.uraian_tugas}{" "}
            uraian tugas.
          </p>
        </div>
      )}

      <button
        onClick={resetKatalog}
        disabled={loading}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {loading ? "Memproses…" : "Reset Katalog"}
      </button>
    </div>
  );
}
