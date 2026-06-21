"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
      <p className="font-medium">Terjadi kesalahan</p>
      <p className="mt-1">{error.message}</p>
    </div>
  );
}
