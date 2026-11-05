"use client";

/** Boundary error `/sistem/ai/penyedia`: pesan error + tombol coba lagi. */
export default function PenyediaError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="space-y-2">
      <p className="text-red-600">{error.message}</p>
      <button onClick={reset} className="text-sm text-blue-600 underline">
        Coba lagi
      </button>
    </div>
  );
}
