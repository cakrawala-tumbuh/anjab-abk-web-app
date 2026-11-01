"use client";

/** Boundary error segmen redesain-sekolah: menampilkan pesan error + tombol coba lagi. */
export default function RedesainSekolahError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div role="alert" className="space-y-2">
      <p className="text-red-600">{error.message}</p>
      <button onClick={reset} className="text-sm text-blue-600 underline">
        Coba lagi
      </button>
    </div>
  );
}
