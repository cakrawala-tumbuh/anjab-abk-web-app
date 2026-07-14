"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses } from "@/lib/notify";
import type { WcpItemRead, WcpReverseType } from "@/lib/api/schema";

interface Props {
  items: WcpItemRead[];
  accessToken: string | undefined;
}

const REVERSE_LABEL: Record<WcpReverseType, string> = {
  NONE: "NONE — langsung",
  R: "R — reverse",
  UF: "UF — unfavorable (6−x)",
  R_STAR: "R_STAR — reverse khusus",
};

export function WcpItemEditor({ items, accessToken }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  function handleSaved() {
    setEditingId(null);
    router.refresh();
  }

  return (
    <div className="table-container">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="w-16 px-4 py-3 text-left font-medium text-gray-600">No.</th>
            <th className="w-24 px-4 py-3 text-left font-medium text-gray-600">Kode</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
              Pernyataan
            </th>
            <th className="w-28 px-4 py-3 text-left font-medium text-gray-600">Scoring</th>
            <th className="w-24 px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {items.map((item) =>
            editingId === item.item_id ? (
              <WcpItemEditRow
                key={item.item_id}
                item={item}
                accessToken={accessToken}
                onCancel={() => setEditingId(null)}
                onSaved={handleSaved}
              />
            ) : (
              <tr key={item.item_id} className="align-top hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 dark:text-gray-500">{item.urutan}</td>
                <td className="px-4 py-3 font-mono text-gray-700">{item.item_id}</td>
                <td className="px-4 py-3">
                  <p className="text-gray-900">{item.pernyataan}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{item.indikator_label}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                    {item.reverse_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditingId(item.item_id)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Ubah
                  </button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

interface RowProps {
  item: WcpItemRead;
  accessToken: string | undefined;
  onCancel: () => void;
  onSaved: () => void;
}

function WcpItemEditRow({ item, accessToken, onCancel, onSaved }: RowProps) {
  const [pernyataan, setPernyataan] = useState(item.pernyataan);
  const [reverseType, setReverseType] = useState<WcpReverseType>(
    item.reverse_type as WcpReverseType,
  );
  const [urutan, setUrutan] = useState(item.urutan);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const {
        data,
        error: apiError,
        response,
      } = await client.PATCH("/api/v1/wcp/dimensi/items/{item_id}", {
        params: { path: { item_id: item.item_id } },
        body: { pernyataan, reverse_type: reverseType, urutan },
      });
      const requestId = response.headers.get("x-request-id");
      if (apiError || !data) throw toApiError(apiError, requestId);
      notifySukses("Item berhasil disimpan.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
      notifyGagal(err);
      setSaving(false);
    }
  }

  return (
    <tr className="bg-blue-50/40 align-top">
      <td className="px-4 py-3">
        <input
          type="number"
          min={1}
          max={72}
          value={urutan}
          onChange={(e) => setUrutan(Number(e.target.value))}
          className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Urutan"
        />
      </td>
      <td className="px-4 py-3 font-mono text-gray-700">{item.item_id}</td>
      <td className="px-4 py-3" colSpan={2}>
        <textarea
          value={pernyataan}
          onChange={(e) => setPernyataan(e.target.value)}
          rows={2}
          maxLength={500}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Pernyataan"
        />
        <p className="mt-1 text-xs text-gray-400">Indikator: {item.indikator_label}</p>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-xs text-gray-500" htmlFor={`rev-${item.item_id}`}>
            Scoring
          </label>
          <select
            id={`rev-${item.item_id}`}
            value={reverseType}
            onChange={(e) => setReverseType(e.target.value as WcpReverseType)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {(Object.keys(REVERSE_LABEL) as WcpReverseType[]).map((rt) => (
              <option key={rt} value={rt}>
                {REVERSE_LABEL[rt]}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Batal
          </button>
        </div>
      </td>
    </tr>
  );
}
