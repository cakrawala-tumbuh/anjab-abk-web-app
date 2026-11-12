"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withServerAuth } from "@/lib/api/client";
import { apiErrorDari } from "@/lib/api/errors";
import { headerIdempotencyKey, petakanKonkurensi } from "@/lib/konkurensi";
import {
  aksiTersedia,
  petakanGalatKlarifikasi,
  validasiCatatan,
  validasiJawaban,
  type GalatForm,
  type IsianJawaban,
} from "@/lib/narasi-klarifikasi";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

const INPUT =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800";
const TOMBOL = "rounded-md px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50";

/** Properti {@link AksiKlarifikasi}. */
export interface AksiKlarifikasiProps {
  /** Id klarifikasi. */
  id: string;
  reviewerApproval: string;
  disposition: string;
  /** Teks pertanyaan yang disalin tombol "Salin pertanyaan". */
  questionText: string;
  /** Token akses dari Server Component induk. */
  accessToken: string | undefined;
}

/**
 * Panel aksi detail klarifikasi. Aksi yang tampil ditentukan {@link aksiTersedia}: Setujui/Tolak
 * (`MENUNGGU`), Salin pertanyaan + Catat jawaban (`DISETUJUI`+`TERBUKA`), Batalkan (`TERBUKA`).
 * Semua POST memakai `Idempotency-Key`; sukses hanya setelah 2xx, lalu `router.refresh()`.
 * Galat 409 tampil sebagai pesan Indonesia spesifik. Tidak ada aksi kirim pesan: pertanyaan
 * dikirim fasilitator di luar aplikasi.
 */
export function AksiKlarifikasi({
  id,
  reviewerApproval,
  disposition,
  questionText,
  accessToken,
}: AksiKlarifikasiProps) {
  const aksi = aksiTersedia({
    reviewer_approval: reviewerApproval as "MENUNGGU" | "DISETUJUI" | "DITOLAK",
    disposition: disposition as "TERBUKA" | "TERJAWAB" | "DIBATALKAN" | "DITOLAK",
  });
  if (aksi.length === 0) {
    return (
      <p role="status" className="text-sm text-gray-600 dark:text-gray-400">
        Klarifikasi ini sudah selesai; tidak ada aksi yang tersedia.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {(aksi.includes("setujui") || aksi.includes("tolak")) && (
        <div className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <p className="text-sm font-medium">Persetujuan reviewer</p>
          <TombolSetujui id={id} accessToken={accessToken} />
          <FormCatatan jenis="tolak" id={id} accessToken={accessToken} />
        </div>
      )}
      {aksi.includes("salin") && (
        <div className="space-y-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Pertanyaan ini dikirim fasilitator di luar aplikasi. Salin teksnya, kirim, lalu catat
            jawabannya di bawah.
          </p>
          <TombolSalin teks={questionText} />
        </div>
      )}
      {aksi.includes("catat_jawaban") && <FormJawaban id={id} accessToken={accessToken} />}
      {aksi.includes("batalkan") && (
        <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
          <FormCatatan jenis="batalkan" id={id} accessToken={accessToken} />
        </div>
      )}
    </div>
  );
}

interface DasarProps {
  id: string;
  accessToken: string | undefined;
}

function TombolSetujui({ id, accessToken }: DasarProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [loading, setLoading] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  async function kirim() {
    setLoading(true);
    setGalat(null);
    const body = { keputusan: "SETUJU" as const };
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/narasi/klarifikasi/{klarifikasi_id}/persetujuan",
        {
          params: { path: { klarifikasi_id: id } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Pertanyaan disetujui");
      router.refresh();
    } catch (err) {
      const g = petakanGalatKlarifikasi(petakanKonkurensi(err, true));
      setGalat(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void kirim()}
        className={`${TOMBOL} bg-green-700 hover:bg-green-800`}
      >
        {loading ? "Memproses…" : "Setujui"}
      </button>
      {galat && (
        <p role="alert" className="form-error mt-2">
          {galat}
        </p>
      )}
    </div>
  );
}

function TombolSalin({ teks }: { teks: string }) {
  const [status, setStatus] = useState<"diam" | "tersalin" | "gagal">("diam");

  async function salin() {
    try {
      await navigator.clipboard.writeText(teks);
      setStatus("tersalin");
    } catch {
      setStatus("gagal");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void salin()}
        className={`${TOMBOL} bg-blue-600 hover:bg-blue-700`}
      >
        Salin pertanyaan
      </button>
      {status === "tersalin" && (
        <span role="status" className="ml-3 text-sm text-green-700 dark:text-green-400">
          Pertanyaan tersalin.
        </span>
      )}
      {status === "gagal" && (
        <span role="alert" className="ml-3 text-sm text-red-600">
          Gagal menyalin; salin teks pertanyaan secara manual.
        </span>
      )}
    </div>
  );
}

/**
 * Form catatan untuk Tolak (`/persetujuan` dengan `TOLAK`) atau Batalkan (`/batalkan`).
 * Catatan wajib minimal 5 karakter.
 */
function FormCatatan({ jenis, id, accessToken }: DasarProps & { jenis: "tolak" | "batalkan" }) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [catatan, setCatatan] = useState("");
  const [galatField, setGalatField] = useState<string | null>(null);
  const [umum, setUmum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tolak = jenis === "tolak";
  const label = tolak ? "Tolak" : "Batalkan klarifikasi";
  const idField = `catatan-${jenis}-${id}`;

  async function kirim() {
    const salah = validasiCatatan(catatan);
    setGalatField(salah);
    setUmum(null);
    if (salah) return;
    setLoading(true);
    try {
      const jalur = { params: { path: { klarifikasi_id: id } } };
      const headers = (b: unknown) => headerIdempotencyKey(idem.keyUntuk(b));
      if (tolak) {
        const body = { keputusan: "TOLAK" as const, catatan: catatan.trim() };
        const res = await withServerAuth(accessToken).POST(
          "/api/v1/narasi/klarifikasi/{klarifikasi_id}/persetujuan",
          { ...jalur, body, headers: headers(body) },
        );
        if (!res.data) throw apiErrorDari(res);
      } else {
        const body = { catatan: catatan.trim() };
        const res = await withServerAuth(accessToken).POST(
          "/api/v1/narasi/klarifikasi/{klarifikasi_id}/batalkan",
          { ...jalur, body, headers: headers(body) },
        );
        if (!res.data) throw apiErrorDari(res);
      }
      idem.perbarui();
      notifySukses(tolak ? "Pertanyaan ditolak" : "Klarifikasi dibatalkan");
      router.refresh();
    } catch (err) {
      const g = petakanGalatKlarifikasi(petakanKonkurensi(err, true));
      setUmum(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm" htmlFor={idField}>
        <span className="block text-gray-600 dark:text-gray-400">
          Catatan {tolak ? "penolakan" : "pembatalan"} (wajib)
        </span>
        <textarea
          id={idField}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          rows={2}
          className={INPUT}
        />
        {galatField && (
          <span role="alert" className="mt-1 block text-xs text-red-600">
            {galatField}
          </span>
        )}
      </label>
      <button
        type="button"
        disabled={loading}
        onClick={() => void kirim()}
        className={`${TOMBOL} bg-red-700 hover:bg-red-800`}
      >
        {loading ? "Memproses…" : label}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
        </p>
      )}
    </div>
  );
}

/** Form "Catat jawaban": `response_ref` dan `jawaban_mentah`, keduanya wajib. */
function FormJawaban({ id, accessToken }: DasarProps) {
  const router = useRouter();
  const idem = useIdempotencyKey();
  const [isian, setIsian] = useState<IsianJawaban>({ response_ref: "", jawaban_mentah: "" });
  const [galat, setGalat] = useState<GalatForm<keyof IsianJawaban>>({});
  const [umum, setUmum] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function kirim() {
    const salah = validasiJawaban(isian);
    setGalat(salah);
    setUmum(null);
    if (Object.keys(salah).length > 0) return;
    const body = {
      response_ref: isian.response_ref.trim(),
      jawaban_mentah: isian.jawaban_mentah.trim(),
    };
    setLoading(true);
    try {
      const res = await withServerAuth(accessToken).POST(
        "/api/v1/narasi/klarifikasi/{klarifikasi_id}/jawaban",
        {
          params: { path: { klarifikasi_id: id } },
          body,
          headers: headerIdempotencyKey(idem.keyUntuk(body)),
        },
      );
      if (!res.data) throw apiErrorDari(res);
      idem.perbarui();
      notifySukses("Jawaban dicatat");
      router.refresh();
    } catch (err) {
      const g = petakanGalatKlarifikasi(petakanKonkurensi(err, true));
      setUmum(pesanGagal(g));
      notifyGagal(g);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-sm font-medium">Catat jawaban</p>
      <label className="block text-sm" htmlFor={`ref-${id}`}>
        <span className="block text-gray-600 dark:text-gray-400">
          Rujukan jawaban (ResponseRef)
        </span>
        <input
          id={`ref-${id}`}
          value={isian.response_ref}
          onChange={(e) => setIsian((p) => ({ ...p, response_ref: e.target.value }))}
          className={INPUT}
        />
        {galat.response_ref && (
          <span role="alert" className="mt-1 block text-xs text-red-600">
            {galat.response_ref}
          </span>
        )}
      </label>
      <label className="block text-sm" htmlFor={`jawab-${id}`}>
        <span className="block text-gray-600 dark:text-gray-400">Jawaban mentah</span>
        <textarea
          id={`jawab-${id}`}
          value={isian.jawaban_mentah}
          onChange={(e) => setIsian((p) => ({ ...p, jawaban_mentah: e.target.value }))}
          rows={4}
          className={INPUT}
        />
        {galat.jawaban_mentah && (
          <span role="alert" className="mt-1 block text-xs text-red-600">
            {galat.jawaban_mentah}
          </span>
        )}
      </label>
      <button
        type="button"
        disabled={loading}
        onClick={() => void kirim()}
        className={`${TOMBOL} bg-blue-600 hover:bg-blue-700`}
      >
        {loading ? "Menyimpan…" : "Catat jawaban"}
      </button>
      {umum && (
        <p role="alert" className="form-error">
          {umum}
        </p>
      )}
    </div>
  );
}
