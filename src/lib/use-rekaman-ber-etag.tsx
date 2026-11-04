"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { bacaEtag } from "@/lib/konkurensi";
import { notifyGagal, pesanGagal } from "@/lib/notify";

/** Klien backend bertipe yang diteruskan ke fungsi pengambil. */
export type KlienBackend = ReturnType<typeof withServerAuth>;

/** Bentuk minimal hasil `openapi-fetch` yang dikonsumsi hook. */
interface HasilGet<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/** Opsi {@link useRekamanBerEtag}. */
export interface OpsiRekamanBerEtag<T> {
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
  /** Identitas rekaman; berubah → muat ulang. */
  kunci: string;
  /** Panggilan `GET` detail lewat klien bertipe. */
  ambil: (client: KlienBackend) => Promise<HasilGet<T>>;
  /** `false` menunda pemuatan (mis. `<details>` belum dibuka). Bawaan `true`. */
  aktif?: boolean;
}

/** Hasil {@link useRekamanBerEtag}. */
export interface HasilRekamanBerEtag<T> {
  /** Rekaman dari GET detail; `null` selama loading atau bila gagal. */
  data: T | null;
  /** Header `ETag` dari respons GET yang SAMA dengan `data`; `null` bila tak ada. */
  etag: string | null;
  loading: boolean;
  /** Error pemuatan; `data` selalu `null` saat terisi. */
  error: unknown;
}

/**
 * Muat satu rekaman lewat GET detail beserta ETag-nya dari respons yang sama.
 *
 * Kontrak kunci optimistik: nilai formulir dan `If-Match` harus berasal dari satu GET —
 * ETag yang diambil terpisah tepat sebelum PATCH tidak mendeteksi apa pun. Gagal (termasuk
 * 401/403) tidak ditelan menjadi data kosong: `error` terisi dan `data` tetap `null`.
 *
 * @param opsi - Lihat {@link OpsiRekamanBerEtag}.
 * @returns `{data, etag, loading, error}`.
 */
export function useRekamanBerEtag<T>({
  accessToken,
  kunci,
  ambil,
  aktif = true,
}: OpsiRekamanBerEtag<T>): HasilRekamanBerEtag<T> {
  const ambilRef = useRef(ambil);
  ambilRef.current = ambil;
  const [hasil, setHasil] = useState<HasilRekamanBerEtag<T>>({
    data: null,
    etag: null,
    loading: aktif,
    error: null,
  });

  useEffect(() => {
    if (!aktif) return;
    let batal = false;
    setHasil({ data: null, etag: null, loading: true, error: null });
    (async () => {
      try {
        const res = await ambilRef.current(withServerAuth(accessToken));
        if (!res.data) throw apiErrorDari({ error: res.error, response: res.response });
        if (!batal)
          setHasil({ data: res.data, etag: bacaEtag(res.response), loading: false, error: null });
      } catch (err) {
        if (!batal) setHasil({ data: null, etag: null, loading: false, error: err });
      }
    })();
    return () => {
      batal = true;
    };
  }, [accessToken, kunci, aktif]);

  return hasil;
}

/**
 * Panel galat pemuatan rekaman; melaporkan lewat `notifyGagal` sekali per galat.
 *
 * @param props.error - Error dari {@link useRekamanBerEtag}.
 */
export function ErrorState({ error }: { error: unknown }) {
  useEffect(() => {
    notifyGagal(error);
  }, [error]);
  return (
    <p role="alert" className="form-error">
      Gagal memuat data: {pesanGagal(error)}
    </p>
  );
}

/** Properti {@link PemuatRekaman}. */
export interface PemuatRekamanProps<T> extends OpsiRekamanBerEtag<T> {
  /** Dirender hanya setelah GET sukses; menerima rekaman dan ETag dari GET itu. */
  children: (data: T, etag: string | null) => ReactNode;
}

/**
 * Pembungkus {@link useRekamanBerEtag}: skeleton selama loading, {@link ErrorState} bila
 * gagal (formulir — dan tombol simpannya — tidak dirender), `children` bila sukses.
 *
 * @param props - Lihat {@link PemuatRekamanProps}.
 */
export function PemuatRekaman<T>({ children, ...opsi }: PemuatRekamanProps<T>) {
  const { data, etag, loading, error } = useRekamanBerEtag<T>(opsi);
  if (opsi.aktif === false) return null;
  if (loading)
    return (
      <div role="status" aria-label="Memuat data" className="space-y-2">
        <div className="h-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  if (error || !data) return <ErrorState error={error} />;
  return <>{children(data, etag)}</>;
}
