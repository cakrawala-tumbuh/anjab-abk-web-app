"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import type { WcpInstrumenRead } from "@/lib/api/schema";

interface Props {
  instrumen: WcpInstrumenRead;
  jumlahSubmit: number;
  accessToken: string | undefined;
}

/** Aksi transisi status instrumen WCP: tutup, buka ulang, jalankan analisis, lihat hasil. */
export function AksiInstrumen({ instrumen, jumlahSubmit, accessToken }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cukupResponden = jumlahSubmit >= instrumen.min_responden;

  async function doTutup() {
    if (
      !confirm(
        "Tutup pengisian WCP? Setelah ditutup, partisipan tidak dapat lagi mengisi atau mengubah jawaban.",
      )
    )
      return;
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.POST("/api/v1/wcp/instrumen/tutup", {});
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      notifySukses("Instrumen ditutup.");
      router.refresh();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  async function doBukaUlang() {
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.POST(
        "/api/v1/wcp/instrumen/buka-ulang",
        {},
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      notifySukses("Instrumen dibuka ulang.");
      router.refresh();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
    } finally {
      setLoading(false);
    }
  }

  async function doAnalisis() {
    setLoading(true);
    setError(null);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.POST("/api/v1/wcp/analisis", {});
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      notifySukses("Analisis selesai.");
      router.push("/wcp/hasil");
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
      {error && (
        <p className="w-full text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {instrumen.status === "OPEN" && (
        <button
          onClick={doTutup}
          disabled={loading}
          className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-60"
        >
          {loading ? "Memproses…" : "Tutup Pengisian"}
        </button>
      )}

      {instrumen.status === "CLOSED" && (
        <>
          <div className="flex flex-col gap-1">
            <button
              onClick={doAnalisis}
              disabled={loading || !cukupResponden}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Memproses…" : "Jalankan Analisis"}
            </button>
            {!cukupResponden && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Butuh minimal {instrumen.min_responden} responden ber-submit, baru ada{" "}
                {jumlahSubmit}.
              </p>
            )}
          </div>
          <button
            onClick={doBukaUlang}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Buka Ulang
          </button>
        </>
      )}

      {instrumen.status === "ANALYZED" && (
        <Link
          href="/wcp/hasil"
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Lihat Hasil
        </Link>
      )}
    </div>
  );
}
