"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";
import { SUMBER_BUKTI, SUMBER_BUKTI_LABEL, KONDISI, KONDISI_LABEL } from "@/components/calhr";

interface Props {
  defaultOpen: boolean;
}

/**
 * Konten petunjuk pengisian Tahap 3 Task Inventory (detailing CalHR),
 * dirender di dalam {@link PetunjukModal}.
 *
 * **Sejak issue backlog `cakrawala-tumbuh/anjab-abk-web-app#41`, formulir Tahap 3
 * hanya menampilkan EMPAT field ke partisipan** (Sumber Bukti, Kondisi, Frekuensi,
 * Durasi/kali) — "Jam/minggu", "Jam peak (4 minggu)", dan "VA Type" dicabut/dijadikan
 * kondisional (lihat `detail-form.tsx`). Panel petunjuk ini karena itu **hanya
 * menjelaskan keempat field itu**, bukan seluruh 7 komponen CalHR seperti versi
 * sebelumnya — menjelaskan field yang tidak pernah dilihat partisipan hanya menambah
 * kebingungan, bukan mengurangi. Latar belakang: workshop SME panel guru TK
 * (2026-07-25, transkrip `review-aplikasi.txt` repo induk) menunjukkan tujuh field
 * per task terlalu banyak, tiga di antaranya tidak bisa dijawab peserta, dan istilah
 * `Baseline`/`Peak`/`Both` dibaca sebagai kata benda asing tanpa penjelasan.
 *
 * Nilai opsi Sumber Bukti & Kondisi dibaca dari `@/components/calhr.ts`
 * (`SUMBER_BUKTI`/`KONDISI`), teks penjelasannya dari `SUMBER_BUKTI_LABEL`/
 * `KONDISI_LABEL` — **sumber tunggal yang sama** dengan teks `<option>` di
 * `detail-form.tsx`, supaya penjelasan di sini tidak pernah menyimpang dari yang
 * benar-benar dilihat partisipan saat memilih.
 */
export function PetunjukTahap3({ defaultOpen }: Props) {
  return (
    <PetunjukModal title="Petunjuk — Tahap 3: Detailing Tugas (CalHR)" defaultOpen={defaultOpen}>
      <p>
        Pada <strong>Tahap 3</strong> Anda merinci beban kerja (<strong>CalHR</strong>) untuk tugas
        yang <strong>benar-benar Anda kerjakan</strong> dari daftar final.
      </p>

      <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/40">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-200">Petunjuk Umum</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-blue-900/90 dark:text-blue-200/90">
          <li>Centang tugas yang Anda kerjakan.</li>
          <li>
            Sebagian tugas punya <strong>isian standar</strong> yang otomatis terpakai saat
            dicentang. Bila sudah sesuai, biarkan (&ldquo;Setuju dengan isian standar&rdquo;); bila
            tidak, hapus centang persetujuan lalu ubah nilainya.
          </li>
          <li>Pilih minimal satu tugas.</li>
          <li>
            Untuk tiap tugas yang dicentang, isi <strong>empat</strong> hal: Sumber Bukti, Kondisi,
            Frekuensi, dan Durasi/kali.
          </li>
          <li>
            Anda bisa menekan &ldquo;Simpan&rdquo; untuk menyimpan draft dan melanjutkan nanti.
          </li>
          <li>
            <strong>&ldquo;Kirim Detail&rdquo; mengunci</strong> isian Anda — setelah dikirim tidak
            dapat diubah lagi.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Arti Keempat Isian</h3>
        <ul className="space-y-3">
          <li>
            <strong>Sumber Bukti</strong> — dari mana tugas ini diketahui sebagai bagian pekerjaan
            Anda.
            <ul className="mt-1 list-disc space-y-1 pl-5 font-normal">
              {SUMBER_BUKTI.map((v) => (
                <li key={v}>{SUMBER_BUKTI_LABEL[v]}</li>
              ))}
            </ul>
          </li>
          <li>
            <strong>Kondisi</strong> — kapan tugas ini biasanya terjadi.
            <ul className="mt-1 list-disc space-y-1 pl-5 font-normal">
              {KONDISI.map((v) => (
                <li key={v}>{KONDISI_LABEL[v]}</li>
              ))}
            </ul>
          </li>
          <li>
            <strong>Frekuensi</strong> — seberapa sering tugas ini dilakukan: Harian, Mingguan,
            Semesteran (mis. per semester ajaran), atau Insidental (sewaktu-waktu, tidak terjadwal
            tetap).
          </li>
          <li>
            <strong>Durasi/kali</strong> — lama satu kali mengerjakan tugas ini, dalam{" "}
            <strong>menit</strong>.
          </li>
        </ul>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
          Keterangan &ldquo;(petunjuk standar: …)&rdquo; di samping Durasi hanya acuan — tetap isi
          angka sesuai keadaan Anda sendiri.
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
          Contoh Pengisian (ilustrasi)
        </h3>
        <div className="rounded-lg border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            &ldquo;Menyusun modul ajar per pekan&rdquo;
          </p>
          <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>Sumber Bukti: Keduanya</li>
            <li>Kondisi: Rutin (hari biasa)</li>
            <li>Frekuensi: Mingguan</li>
            <li>Durasi/kali: 90 menit</li>
          </ul>
        </div>
        <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
          Angka pada contoh di atas hanya ilustrasi — isi sesuai beban kerja Anda yang sebenarnya.
        </p>
      </div>
    </PetunjukModal>
  );
}
