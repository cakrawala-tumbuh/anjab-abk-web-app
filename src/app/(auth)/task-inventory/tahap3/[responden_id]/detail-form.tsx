"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { withServerAuth } from "@/lib/api/client";
import { toApiError } from "@/lib/api/errors";
import { notifyGagal, notifySukses, pesanGagal } from "@/lib/notify";
import {
  FREKUENSI,
  KONDISI,
  KONDISI_LABEL,
  SUMBER_BUKTI,
  SUMBER_BUKTI_LABEL,
  VA_TYPE_FINAL,
} from "@/components/calhr";
import type { TiDetailItem, TiDetailRead, TiTaskTerpilihRead } from "@/lib/api/schema";

/**
 * `true` bila `v` termasuk 3 nilai final kanonik ({@link VA_TYPE_FINAL}) — dipakai untuk
 * dua keperluan: (1) membedakan baris yang sudah sah difinalisasi dari yang masih
 * `"Context-Dependent"` (prefill belum diselesaikan, tidak boleh dikirim sebagai jawaban
 * akhir Tahap 3), dan (2) menentukan apakah selektor "Jenis Nilai Tambah (VA)" perlu
 * dirender sama sekali untuk sebuah task (lihat `butuhPilihVaType`). Null-safe karena
 * `TiTaskTerpilihRead.std_va_type` boleh `null`/`undefined` (task tanpa nilai standar).
 */
function isVaTypeFinal(v: string | null | undefined): v is (typeof VA_TYPE_FINAL)[number] {
  return v != null && (VA_TYPE_FINAL as readonly string[]).includes(v);
}

/**
 * `true` bila task ini WAJIB menampilkan selektor "Jenis Nilai Tambah (VA)" ke
 * partisipan — yaitu bila `std_va_type` bukan salah satu dari 3 nilai final
 * ({@link VA_TYPE_FINAL}): `null` (task tanpa standar) atau `"Context-Dependent"`
 * (prefill katalog yang belum diselesaikan). Bila standarnya sudah final, nilai itu
 * dikirim apa adanya ke backend tanpa pernah ditampilkan ke partisipan — keputusan
 * produk untuk menyederhanakan formulir (issue backlog
 * `cakrawala-tumbuh/anjab-abk-web-app#41`, workshop SME panel guru TK 2026-07-25).
 */
function butuhPilihVaType(t: TiTaskTerpilihRead): boolean {
  return !isVaTypeFinal(t.std_va_type);
}

/**
 * Skema validasi satu entri detail CalHR (dipakai juga di unit test).
 *
 * `va_type` dipersempit ke {@link VA_TYPE_FINAL} (3 nilai kanonik) — `"Context-Dependent"`
 * bukan jawaban final yang sah untuk Tahap 3; backend menolaknya (422) saat submit
 * (issue `cakrawala-tumbuh/anjab-abk-web-app#39`). Baris dengan `va_type` di luar 3 nilai
 * ini gagal parse di sini, sehingga submit klien terblokir sebelum sampai ke backend.
 */
export const detailItemSchema = z.object({
  task_kode: z.string().min(1),
  sumber_bukti: z.enum(["Formal", "Aktual", "Keduanya"]),
  kondisi: z.enum(["Baseline", "Peak", "Both"]),
  frekuensi_teks: z.string().min(1, "Frekuensi wajib diisi").max(100),
  durasi_per_kali: z.number().int().min(0, "Durasi wajib diisi, ≥ 0"),
  jam_per_minggu: z.number().min(0, "Jam/minggu ≥ 0"),
  peak4w_hours: z.number().min(0).default(0),
  va_type: z.enum(VA_TYPE_FINAL),
  setuju_standar: z.boolean().default(true),
  catatan: z.string().max(500).optional(),
});

/**
 * State per baris tugas yang dirender ke partisipan.
 *
 * Memuat **4 field yang ditampilkan** (`sumber_bukti`, `kondisi`,
 * `frekuensi_teks`, `durasi_per_kali`) plus `va_type` (tampil kondisional, lihat
 * `butuhPilihVaType`) dan `catatan` (textarea opsional, selalu dirender saat
 * `checked`, TIDAK ikut dikunci oleh `setuju_standar` — issue backlog
 * `cakrawala-tumbuh/anjab-abk-web-app#42`). **`jam_per_minggu` dan
 * `peak4w_hours` SENGAJA tidak ada di sini** — keduanya tidak lagi punya input
 * sama sekali; nilai kirimnya dibaca langsung dari
 * `std_jam_per_minggu ?? 0`/`std_peak4w_hours ?? 0` di `buildDetailPayload()`,
 * bukan dari state baris (issue backlog `cakrawala-tumbuh/anjab-abk-web-app#41`).
 */
interface RowState {
  checked: boolean;
  setuju_standar: boolean;
  sumber_bukti: TiDetailItem["sumber_bukti"];
  kondisi: TiDetailItem["kondisi"];
  frekuensi_teks: string;
  /** `null` = belum diisi responden — lihat catatan di `rowDariStandar()`. */
  durasi_per_kali: number | null;
  va_type: TiDetailItem["va_type"];
  /**
   * Catatan/keberatan bebas per task, string kosong `""` bila belum diisi.
   * Dikonversi ke `undefined` saat dikirim ke backend (lihat `parseRow()`) —
   * `""` TIDAK PERNAH dikirim sebagai nilai `catatan` di payload.
   */
  catatan: string;
}

/** Task punya nilai standar bila minimal satu field `std_*` non-null. */
function punyaStandar(t: TiTaskTerpilihRead): boolean {
  return (
    t.std_sumber_bukti != null ||
    t.std_kondisi != null ||
    t.std_frekuensi_teks != null ||
    t.std_durasi_per_kali != null ||
    t.std_jam_per_minggu != null ||
    t.std_peak4w_hours != null ||
    t.std_va_type != null
  );
}

/** Seed isian dari nilai standar master; jatuh ke default lama per-field bila std_* null.
 *
 * `durasi_per_kali` SENGAJA tidak di-prefill (`null`, bukan angka default) — kolom standar
 * `std_durasi_per_kali` adalah teks bebas (mis. "Bervariasi", "1-2 jam"), bukan angka menit,
 * sehingga tidak ada nilai yang bisa dianggap "standar" secara numerik. Nilai teksnya tetap
 * ditampilkan sebagai petunjuk di samping input. Field ini karena itu TIDAK ikut terkunci
 * saat "Setuju dengan isian standar" dicentang (beda dari field sibling lain) — responden
 * tetap wajib mengisi angkanya sendiri. Keputusan produk: issue #22 (Opsi A).
 *
 * `jam_per_minggu`/`peak4w_hours` **tidak lagi diseed di sini** (lihat `RowState`) —
 * nilainya dibaca langsung dari `t.std_*` saat membangun payload, tanpa pernah singgah
 * di state baris. `va_type` diseed `t.std_va_type ?? "VA-Core"` seperti sebelumnya;
 * selektornya tetap dirender untuk task tanpa standar (`std_va_type` null) supaya
 * partisipan bisa mengoreksi default itu — lihat `butuhPilihVaType`. Selektor VA, seperti
 * `durasi_per_kali`, **tidak ikut dikunci** oleh "Setuju dengan isian standar" saat
 * `butuhPilihVaType(t)` bernilai true — tidak ada nilai standar VA yang final untuk
 * "disetujui" pada task semacam itu (issue backlog
 * `cakrawala-tumbuh/anjab-abk-web-app#47`).
 *
 * `catatan` selalu diseed `""` di sini (tidak ada nilai standar untuk catatan) —
 * pemanggil yang punya `TiDetailRead.catatan` tersimpan (lihat inisialisasi `rows`
 * di `DetailForm`) menimpanya sendiri.
 */
function rowDariStandar(t: TiTaskTerpilihRead): RowState {
  return {
    checked: false,
    setuju_standar: true,
    sumber_bukti: t.std_sumber_bukti ?? "Aktual",
    kondisi: t.std_kondisi ?? "Baseline",
    frekuensi_teks: t.std_frekuensi_teks ?? "Mingguan",
    durasi_per_kali: null,
    va_type: t.std_va_type ?? "VA-Core",
    catatan: "",
  };
}

interface Props {
  respondenId: string;
  tasks: TiTaskTerpilihRead[];
  detailAwal: TiDetailRead[];
  accessToken: string | undefined;
}

export function DetailForm({ respondenId, tasks, detailAwal, accessToken }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      tasks.map((t) => {
        const existing = detailAwal.find((d) => d.task_kode === t.kode);
        if (!existing) return [t.kode, rowDariStandar(t)];
        const row: RowState = {
          checked: true,
          setuju_standar: existing.setuju_standar,
          sumber_bukti: existing.sumber_bukti,
          kondisi: existing.kondisi,
          frekuensi_teks: existing.frekuensi_teks,
          durasi_per_kali: existing.durasi_per_kali,
          va_type: existing.va_type,
          catatan: existing.catatan ?? "",
        };
        return [t.kode, row];
      }),
    ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function update(kode: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [kode]: { ...prev[kode], ...patch } }));
  }

  /**
   * Terapkan/lepas nilai standar master ke baris `t`.
   *
   * Saat `setuju === true`, seluruh field field-standar (`sumber_bukti`,
   * `kondisi`, `frekuensi_teks`, `va_type`) direset ke `rowDariStandar(t)` —
   * **kecuali `catatan`**, yang sengaja dipertahankan dari nilai baris saat ini
   * (issue backlog `cakrawala-tumbuh/anjab-abk-web-app#42`) — keberatan
   * partisipan justru paling sering muncul pada task yang isian standarnya
   * diterima apa adanya, dan **kecuali `va_type`** bila
   * {@link butuhPilihVaType}`(t)` bernilai true (issue backlog
   * `cakrawala-tumbuh/anjab-abk-web-app#47`) — untuk task ber-`std_va_type`
   * belum final (mis. `"Context-Dependent"`), `rowDariStandar(t)` akan
   * mengembalikan `va_type` ke nilai tidak-valid itu, membatalkan pilihan sah
   * yang sudah dibuat partisipan dan mengunci ulang formulir. Bila
   * `std_va_type` sudah final, `rowDariStandar(t).va_type` sama dengan nilai
   * final itu sendiri sehingga pengecualian ini tidak berpengaruh.
   */
  function toggleSetuju(t: TiTaskTerpilihRead, setuju: boolean) {
    if (setuju) {
      const std = rowDariStandar(t);
      const catatanSaatIni = rows[t.kode]?.catatan ?? "";
      const vaTypeSaatIni = rows[t.kode]?.va_type ?? std.va_type;
      update(t.kode, {
        ...std,
        checked: true,
        setuju_standar: true,
        catatan: catatanSaatIni,
        va_type: butuhPilihVaType(t) ? vaTypeSaatIni : std.va_type,
      });
    } else {
      update(t.kode, { setuju_standar: false });
    }
  }

  const checkedCount = Object.values(rows).filter((r) => r.checked).length;
  const adaTaskBerstandar = tasks.some(punyaStandar);

  /**
   * Validasi satu baris `t`/`r` terhadap {@link detailItemSchema}.
   *
   * Sumber tunggal aturan "isian baris ini sah dikirim" — dipakai baik oleh
   * `isRowLengkap()` (menentukan status kunci tombol "Kirim Detail") maupun
   * `buildDetailPayload()` (membangun payload sesungguhnya), sehingga kedua
   * jalur itu **tidak pernah berbeda pendapat**: bila tombol aktif,
   * `buildDetailPayload()` dijamin berhasil untuk seluruh baris tercentang.
   *
   * `jam_per_minggu`/`peak4w_hours` **selalu** dibaca dari `t.std_jam_per_minggu ?? 0` /
   * `t.std_peak4w_hours ?? 0` — bukan dari `RowState` (yang sudah tidak memilikinya)
   * — partisipan tidak pernah mengisi kedua field ini secara manual (issue backlog
   * `cakrawala-tumbuh/anjab-abk-web-app#41`). `catatan` string kosong `""` diubah
   * jadi `undefined` sebelum divalidasi/dikirim — `""` tidak pernah menjadi nilai
   * `catatan` di payload (issue backlog `cakrawala-tumbuh/anjab-abk-web-app#42`).
   */
  function parseRow(t: TiTaskTerpilihRead, r: RowState) {
    return detailItemSchema.safeParse({
      task_kode: t.kode,
      sumber_bukti: r.sumber_bukti,
      kondisi: r.kondisi,
      frekuensi_teks: r.frekuensi_teks,
      durasi_per_kali: r.durasi_per_kali,
      jam_per_minggu: t.std_jam_per_minggu ?? 0,
      peak4w_hours: t.std_peak4w_hours ?? 0,
      va_type: r.va_type,
      setuju_standar: r.setuju_standar,
      catatan: r.catatan === "" ? undefined : r.catatan,
    });
  }

  /**
   * `true` bila task `t` sudah dicentang DAN isiannya lolos {@link parseRow}.
   *
   * Dipakai untuk menghitung `incompleteTasks`/`semuaLengkap` yang mengunci
   * tombol "Kirim Detail" — task yang belum dicentang **maupun** task yang
   * dicentang tapi isiannya tidak valid (mis. `durasi_per_kali` kosong, atau
   * `va_type` masih `"Context-Dependent"`) sama-sama dihitung "belum lengkap"
   * (issue backlog `cakrawala-tumbuh/anjab-abk-web-app#42`).
   */
  function isRowLengkap(t: TiTaskTerpilihRead): boolean {
    const r = rows[t.kode];
    return !!r && r.checked && parseRow(t, r).success;
  }

  const incompleteTasks = tasks.filter((t) => !isRowLengkap(t));
  const semuaLengkap = incompleteTasks.length === 0;

  /**
   * Kumpulkan entri detail yang ditandai & valid; `null` bila ada isian tidak valid.
   *
   * `va_type` divalidasi terhadap {@link VA_TYPE_FINAL} lewat `detailItemSchema` — baris
   * yang masih `"Context-Dependent"` (prefill belum diselesaikan) gagal parse di sini,
   * sehingga submit klien terblokir dengan pesan yang menyebut task & VA Type secara
   * spesifik, bukan pesan generik (issue backlog #39). Dipanggil baik oleh
   * `handleSave()` (draft, boleh parsial) maupun `onSubmit()` (final, tombolnya
   * sendiri sudah terkunci selama `!semuaLengkap` — lihat `isRowLengkap`).
   */
  function buildDetailPayload(): { detail: TiDetailItem[] } | null {
    const detail: TiDetailItem[] = [];
    for (const t of tasks) {
      const r = rows[t.kode];
      if (!r.checked) continue;
      const parsed = parseRow(t, r);
      if (!parsed.success) {
        const vaTypeInvalid = parsed.error.issues.some((iss) => iss.path[0] === "va_type");
        setError(
          vaTypeInvalid
            ? `Task "${t.uraian_tugas}": pilih Jenis Nilai Tambah (VA) final (VA-Core/VA-Enable/NVA-Residual) — "Context-Dependent" belum final.`
            : `Periksa isian pada task "${t.uraian_tugas}".`,
        );
        return null;
      }
      detail.push(parsed.data as TiDetailItem);
    }
    return { detail };
  }

  async function handleSave() {
    setError(null);
    setSaveMessage(null);
    const payload = buildDetailPayload();
    if (!payload) return;
    setSaving(true);
    try {
      const client = withServerAuth(accessToken);
      const { error: apiError, response } = await client.PUT(
        "/api/v1/task-inventory/sesi/responden/{responden_id}/detail",
        { params: { path: { responden_id: respondenId } }, body: payload },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      setSaveMessage("Draft tersimpan.");
      notifySukses("Draft tersimpan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan draft.");
      notifyGagal(err);
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit() {
    setError(null);
    setSaveMessage(null);
    const payload = buildDetailPayload();
    if (!payload) return;
    if (payload.detail.length === 0) {
      setError("Tandai minimal satu tugas yang Anda kerjakan, lalu isi rinciannya.");
      return;
    }
    setSubmitting(true);
    try {
      const client = withServerAuth(accessToken);
      const { error: saveError, response: saveResponse } = await client.PUT(
        "/api/v1/task-inventory/sesi/responden/{responden_id}/detail",
        { params: { path: { responden_id: respondenId } }, body: payload },
      );
      const saveReqId = saveResponse.headers.get("x-request-id");
      if (saveError) throw toApiError(saveError, saveReqId);

      const { error: apiError, response } = await client.POST(
        "/api/v1/task-inventory/sesi/responden/{responden_id}/detail/submit",
        { params: { path: { responden_id: respondenId } } },
      );
      const reqId = response.headers.get("x-request-id");
      if (apiError) throw toApiError(apiError, reqId);
      notifySukses("Jawaban berhasil dikirim.");
      router.push("/kuesioner");
      router.refresh();
    } catch (err) {
      setError(pesanGagal(err));
      notifyGagal(err);
      setSubmitting(false);
    }
  }

  // Kondisi SAH tapi buntu: sesi sudah TAHAP3 (halaman hanya merender form ini
  // saat status TAHAP3) namun himpunan task final kosong — koordinator tidak
  // menyetujui satu pun task partial. Jangan tampilkan formulir kosong dengan
  // tombol Simpan/Kirim yang menyesatkan; katakan apa adanya.
  if (tasks.length === 0) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
        >
          <p className="font-medium">Tidak ada task final pada analisis ini.</p>
          <p className="mt-1">
            Koordinator tidak menyetujui satu pun task partial, sehingga tidak ada tugas yang bisa
            dirinci. Hubungi administrator.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Kirim Detail
        </button>
      </div>
    );
  }

  const selectCls =
    "rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500";
  const numCls =
    "w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500";

  return (
    <div className="space-y-5">
      {error && (
        <div role="alert" className="form-server-error">
          {error}
        </div>
      )}
      {saveMessage && !error && (
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">{saveMessage}</div>
      )}

      {adaTaskBerstandar && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Centang tugas yang Anda kerjakan. Sebagian tugas sudah punya isian standar yang otomatis
          terpakai saat dicentang — bila sudah sesuai, biarkan apa adanya; bila tidak, hapus centang
          &quot;Setuju dengan isian standar&quot; lalu ubah isiannya.
        </p>
      )}

      <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ditandai dikerjakan: <strong>{checkedCount}</strong> dari {tasks.length} task
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || submitting}
              className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting || saving || !semuaLengkap}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Mengirim…" : "Kirim Detail"}
            </button>
          </div>
        </div>
        {!semuaLengkap && (
          <p className="text-xs text-amber-600">
            {incompleteTasks.length} task belum dilengkapi — lengkapi semuanya sebelum mengirim.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {tasks.map((t) => {
          const r = rows[t.kode];
          const berstandar = punyaStandar(t);
          const terkunci = r.checked && berstandar && r.setuju_standar;
          return (
            <div key={t.kode} className="rounded-lg border border-gray-200 bg-white p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={r.checked}
                  onChange={(e) => update(t.kode, { checked: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-800">
                  {t.uraian_tugas}
                  <span className="ml-1 text-xs font-normal text-gray-400">({t.tugas_pokok})</span>
                </span>
              </label>

              {r.checked && (
                <div className="mt-4 pl-7">
                  {berstandar && (
                    <label className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={r.setuju_standar}
                        onChange={(e) => toggleSetuju(t, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Setuju dengan isian standar
                    </label>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-xs text-gray-600">
                      Sumber Bukti
                      <select
                        value={r.sumber_bukti}
                        disabled={terkunci}
                        onChange={(e) =>
                          update(t.kode, {
                            sumber_bukti: e.target.value as RowState["sumber_bukti"],
                          })
                        }
                        className={`mt-1 block w-full ${selectCls}`}
                      >
                        {SUMBER_BUKTI.map((v) => (
                          <option key={v} value={v}>
                            {SUMBER_BUKTI_LABEL[v]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-gray-600">
                      Kondisi
                      <select
                        value={r.kondisi}
                        disabled={terkunci}
                        onChange={(e) =>
                          update(t.kode, { kondisi: e.target.value as RowState["kondisi"] })
                        }
                        className={`mt-1 block w-full ${selectCls}`}
                      >
                        {KONDISI.map((v) => (
                          <option key={v} value={v}>
                            {KONDISI_LABEL[v]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-gray-600">
                      Frekuensi
                      <select
                        value={r.frekuensi_teks}
                        disabled={terkunci}
                        onChange={(e) => update(t.kode, { frekuensi_teks: e.target.value })}
                        className={`mt-1 block w-full ${selectCls}`}
                      >
                        {(FREKUENSI.includes(r.frekuensi_teks as (typeof FREKUENSI)[number])
                          ? FREKUENSI
                          : [r.frekuensi_teks, ...FREKUENSI]
                        ).map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-gray-600">
                      Durasi/kali (menit)
                      {t.std_durasi_per_kali && (
                        <span className="ml-1 font-normal text-gray-400">
                          (petunjuk standar: {t.std_durasi_per_kali})
                        </span>
                      )}
                      {terkunci && (
                        <span className="ml-1 font-normal text-amber-600">
                          — wajib diisi manual
                        </span>
                      )}
                      <input
                        type="number"
                        min={0}
                        value={r.durasi_per_kali ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          update(t.kode, { durasi_per_kali: v === "" ? null : Number(v) });
                        }}
                        className={`mt-1 block ${numCls}`}
                      />
                    </label>
                    {/* "Jam/minggu" dan "Jam peak (4 minggu)" SENGAJA dicabut dari formulir
                        partisipan (issue backlog #41) — tidak ada input sama sekali, bukan
                        input tersembunyi. Nilainya dikirim dari nilai standar master apa
                        adanya, lihat `buildDetailPayload`. */}
                    {butuhPilihVaType(t) && (
                      <label className="text-xs text-gray-600">
                        Jenis Nilai Tambah (VA)
                        {!isVaTypeFinal(r.va_type) && (
                          <span className="ml-1 font-normal text-amber-600">— wajib dipilih</span>
                        )}
                        <select
                          value={isVaTypeFinal(r.va_type) ? r.va_type : ""}
                          onChange={(e) =>
                            update(t.kode, { va_type: e.target.value as RowState["va_type"] })
                          }
                          className={`mt-1 block w-full ${selectCls}`}
                        >
                          {!isVaTypeFinal(r.va_type) && (
                            <option value="" disabled>
                              — pilih salah satu —
                            </option>
                          )}
                          {VA_TYPE_FINAL.map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  <label className="mt-3 block text-xs text-gray-600">
                    Catatan (opsional)
                    <textarea
                      value={r.catatan}
                      maxLength={500}
                      rows={2}
                      placeholder="Tuliskan keberatan atau catatan lain, mis. bila task ini ternyata bukan tugas Anda"
                      onChange={(e) => update(t.kode, { catatan: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ditandai dikerjakan: <strong>{checkedCount}</strong> dari {tasks.length} task
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || submitting}
              className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting || saving || !semuaLengkap}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Mengirim…" : "Kirim Detail"}
            </button>
          </div>
        </div>
        {!semuaLengkap && (
          <p className="text-xs text-amber-600">
            {incompleteTasks.length} task belum dilengkapi — lengkapi semuanya sebelum mengirim.
          </p>
        )}
      </div>
    </div>
  );
}
