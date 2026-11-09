"use client";

/** Boundary error usulan AI: pesan galat backend + tombol coba lagi. */
export default function AiUsulanError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="space-y-2">
      <p className="text-red-600">{error.message}</p>
      <button onClick={reset} className="text-sm text-blue-600 underline">
        Coba lagi
      </button>
    </div>
  );
}
