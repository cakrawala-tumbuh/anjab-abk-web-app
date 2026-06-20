"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
      <strong>Gagal memuat sesi DCS.</strong> {error.message}
    </div>
  );
}
