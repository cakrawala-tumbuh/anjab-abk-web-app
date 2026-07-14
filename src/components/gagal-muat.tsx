/**
 * Panel kegagalan untuk jalur BACA di Server Component.
 *
 * Kenapa dirender di server, bukan dilempar ke `error.tsx`:
 * Next.js MENYENSOR `error.message` dari error yang dilempar Server Component
 * sebelum sampai ke error boundary di klien (produksi hanya menerima pesan
 * generik + `digest`). Padahal `X-Request-ID` WAJIB terlihat oleh user supaya
 * bisa disebutkan saat melapor. Maka kegagalan yang kita KENALI (`ApiError`)
 * dirender langsung di server; error tak dikenal tetap dilempar ke `error.tsx`.
 *
 * Yang dilarang: merender daftar/formulir KOSONG saat data gagal diambil.
 * Formulir kosong yang tampak sah = notifikasi bohong.
 */
import type { ApiError } from "@/lib/api/errors";
import type { BagianGagal } from "@/lib/api/pendukung";

function BarisMeta({ err }: { err: ApiError }) {
  return (
    <dl className="mt-3 space-y-1 text-xs">
      {err.status !== null && (
        <div>
          <dt className="inline font-medium">Status: </dt>
          <dd className="inline">{err.status}</dd>
        </div>
      )}
      <div>
        <dt className="inline font-medium">Kode: </dt>
        <dd className="inline">{err.code}</dd>
      </div>
      <div>
        <dt className="inline font-medium">ID permintaan (X-Request-ID): </dt>
        <dd className="inline font-mono">{err.requestId ?? "(tidak tersedia)"}</dd>
      </div>
    </dl>
  );
}

/** Kegagalan mengambil data kritis (4xx/5xx tak terduga) — halaman sengaja tidak menampilkan formulir. */
export function GagalMuat({ judul, err }: { judul: string; err: ApiError }) {
  return (
    <div className="space-y-4">
      <h1 className="page-heading">{judul}</h1>
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        <p className="font-medium">Data gagal diambil dari server.</p>
        <p className="mt-2">{err.message}</p>
        <BarisMeta err={err} />
        <p className="mt-3">
          Halaman ini sengaja tidak menampilkan formulir kosong — isinya tidak dapat dipastikan
          benar. Sebutkan ID permintaan di atas saat melapor ke administrator.
        </p>
      </div>
    </div>
  );
}

/**
 * Kegagalan mengambil data PENDUKUNG (pengisi dropdown / pelabel ID) sementara
 * data INTI halaman berhasil dimuat — halaman tetap dirender, tapi kegagalannya
 * harus TERLIHAT.
 *
 * Tanpa panel ini, dropdown yang kosong karena 401 tidak terbedakan dari
 * dropdown yang kosong karena master data-nya memang belum diisi — admin bisa
 * menyimpulkan "belum ada jabatan" lalu membuat duplikat.
 *
 * Merender `null` bila `bagian` kosong, sehingga aman dipasang tanpa syarat.
 */
export function GagalMuatSebagian({ bagian }: { bagian: BagianGagal[] }) {
  if (bagian.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
    >
      <p className="font-medium">Sebagian data pendukung gagal dimuat.</p>
      <p className="mt-2">
        Isi utama halaman ini tetap ditampilkan, tetapi bagian di bawah ini{" "}
        <strong>tidak dapat dipercaya</strong>: pilihan pada dropdown bisa hilang dan sebagian nama
        akan tampil sebagai ID mentah. Daftar yang tampak kosong di sini <strong>bukan</strong>{" "}
        berarti datanya memang belum ada.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        {bagian.map((b) => (
          <li key={b.nama}>
            <span className="font-medium">{b.nama}</span> — {b.err.message}
            {b.err.status !== null && <span> (status {b.err.status})</span>}
            <span className="block text-xs">
              Kode: {b.err.code} · ID permintaan:{" "}
              <span className="font-mono">{b.err.requestId ?? "(tidak tersedia)"}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3">Sebutkan ID permintaan di atas saat melapor ke administrator.</p>
    </div>
  );
}

/** Penolakan akses (401/403) atau data tidak ditemukan (404) — kondisi wajar, ditampilkan rapi. */
export function TidakBerhak({ judul, err }: { judul: string; err: ApiError }) {
  const pesan =
    err.status === 401
      ? "Sesi Anda sudah berakhir. Silakan masuk kembali."
      : err.status === 404
        ? "Data yang Anda buka tidak ditemukan. Mungkin sudah dihapus, atau tautannya keliru."
        : "Anda tidak berhak membuka halaman ini. Halaman pengisian hanya dapat dibuka oleh partisipan pemiliknya.";

  return (
    <div className="space-y-4">
      <h1 className="page-heading">{judul}</h1>
      <div
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
      >
        <p className="font-medium">{pesan}</p>
        <BarisMeta err={err} />
      </div>
    </div>
  );
}
