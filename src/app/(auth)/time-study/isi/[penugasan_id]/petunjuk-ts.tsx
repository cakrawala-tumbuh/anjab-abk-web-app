"use client";

import { PetunjukModal } from "@/components/petunjuk-modal";

// Label persis KATEGORI di tambah/ts-log-form.tsx.
const KATEGORI = [
  "Pekerjaan Inti",
  "Asesmen Karakter",
  "Pengembangan Diri",
  "Pekerjaan Strategis",
  "Administrasi",
  "Istirahat Terstruktur",
] as const;

// Label persis DAY_COLOR_LABEL di page.tsx / warna hari di form.
const KATEGORI_HARI = [
  { warna: "Hijau", label: "Hari Biasa" },
  { warna: "Kuning", label: "Hari Sibuk" },
  { warna: "Merah", label: "Hari Puncak" },
] as const;

interface Props {
  defaultOpen: boolean;
}

export function PetunjukTs({ defaultOpen }: Props) {
  return (
    <PetunjukModal
      title="Petunjuk Pengisian Log Harian Time Study"
      defaultOpen={defaultOpen}
      ctaLabel="Saya Mengerti"
    >
      <p>
        <strong>Time Study (Studi Waktu)</strong> mencatat distribusi waktu kerja Anda per hari
        untuk mengukur beban kerja. Isi <strong>satu log tiap hari kerja</strong> selama penugasan
        aktif — jangan menumpuknya di akhir, karena ingatan atas rincian waktu memudar.
      </p>

      <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-950/40">
        <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-200">Petunjuk Umum</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-blue-900/90 dark:text-blue-200/90">
          <li>Isi waktu masuk dan waktu keluar Anda pada hari itu.</li>
          <li>
            Bagi durasi kerja Anda ke dalam <strong>enam kategori aktivitas</strong> (dalam jam dan
            menit).
          </li>
          <li>Pilih Kategori Hari sesuai tingkat kesibukan hari itu.</li>
          <li>Log yang sudah dibuat masih bisa diedit selama penugasan aktif.</li>
          <li>
            Isilah sejujurnya — data dipakai untuk analisis beban kerja, bukan menilai kinerja.
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
          Enam Kategori Aktivitas
        </h3>
        <ul className="list-disc space-y-1 pl-5">
          {KATEGORI.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Kelompokkan aktivitas Anda ke kategori yang paling sesuai, lalu isi jam dan menitnya.
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Kategori Hari</h3>
        <ul className="space-y-1">
          {KATEGORI_HARI.map((h) => (
            <li key={h.warna}>
              <strong>{h.warna}</strong> — {h.label}.
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Cara Mengisi</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Pilih tanggal log.</li>
          <li>Isi waktu masuk dan waktu keluar.</li>
          <li>Isi jam dan menit untuk tiap kategori aktivitas.</li>
          <li>Pilih Kategori Hari (Hijau/Kuning/Merah).</li>
          <li>Tekan &ldquo;Simpan Log&rdquo;. Ulangi tiap hari kerja.</li>
        </ol>
      </div>
    </PetunjukModal>
  );
}
