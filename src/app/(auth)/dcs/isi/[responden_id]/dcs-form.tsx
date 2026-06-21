"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import type { DcsSubSkalaWithItemsRead, DcsJawabanRead } from "@/lib/api/schema";

const SKOR_LABEL: Record<number, string> = {
  1: "Sangat Tidak Setuju",
  2: "Tidak Setuju",
  3: "Ragu-ragu",
  4: "Setuju",
  5: "Sangat Setuju",
};

interface Props {
  respondenId: string;
  subskala: DcsSubSkalaWithItemsRead[];
  jawabanAwal: DcsJawabanRead[];
  sudahSubmit: boolean;
  accessToken: string | undefined;
}

export function DcsForm({ respondenId, subskala, jawabanAwal, sudahSubmit, accessToken }: Props) {
  const router = useRouter();

  const initialValues = Object.fromEntries(jawabanAwal.map((j) => [j.item_id, j.skor_raw]));

  const [skor, setSkor] = useState<Record<string, number>>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState(false);

  const allItems = subskala.flatMap((sk) => sk.items ?? []);
  const allFilled = allItems.length > 0 && allItems.every((item) => skor[item.item_id] != null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled) {
      setError("Semua pernyataan wajib dijawab sebelum mengirim.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.POST(
        "/api/v1/dcs/sesi/responden/{responden_id}/jawaban",
        {
          params: { path: { responden_id: respondenId } },
          body: {
            jawaban: Object.entries(skor).map(([item_id, skor_raw]) => ({
              item_id,
              skor_raw,
            })),
          },
        },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      setSukses(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim jawaban.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sukses) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-lg font-medium text-green-800">Jawaban berhasil dikirim!</p>
        <p className="mt-1 text-sm text-green-600">Terima kasih telah mengisi kuesioner DCS.</p>
        <a
          href="/kuesioner"
          className="mt-4 inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Kembali ke Kuesioner Saya
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {subskala
        .slice()
        .sort((a, b) => a.urutan - b.urutan)
        .map((sk) => (
          <section key={sk.kode}>
            <h2 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-800">
              {sk.nama}
            </h2>
            <div className="space-y-6">
              {(sk.items ?? [])
                .slice()
                .sort((a, b) => a.urutan - b.urutan)
                .map((item, idx) => (
                  <div
                    key={item.item_id}
                    className="rounded-lg border border-gray-100 bg-white p-4"
                  >
                    <p className="text-sm text-gray-800">
                      <span className="mr-2 font-medium text-gray-400">{idx + 1}.</span>
                      {item.pernyataan}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {([1, 2, 3, 4, 5] as const).map((nilai) => (
                        <label
                          key={nilai}
                          className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            skor[item.item_id] === nilai
                              ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
                              : "border-gray-200 text-gray-600 hover:border-blue-300"
                          } ${sudahSubmit ? "cursor-default" : ""}`}
                        >
                          <input
                            type="radio"
                            name={item.item_id}
                            value={nilai}
                            checked={skor[item.item_id] === nilai}
                            onChange={() =>
                              !sudahSubmit &&
                              setSkor((prev) => ({ ...prev, [item.item_id]: nilai }))
                            }
                            disabled={sudahSubmit}
                            className="sr-only"
                          />
                          {nilai} — {SKOR_LABEL[nilai]}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}

      {!sudahSubmit && (
        <div className="sticky bottom-0 border-t border-gray-200 bg-white/90 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {Object.keys(skor).length} / {allItems.length} pernyataan dijawab
            </p>
            <button
              type="submit"
              disabled={submitting || !allFilled}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Mengirim…" : "Kirim Jawaban"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
