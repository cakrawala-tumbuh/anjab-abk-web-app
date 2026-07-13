/**
 * Label & warna badge status sesi Task Inventory (alur 3 tahap:
 * DRAFT → TAHAP1 → TAHAP2 → TAHAP3 → CLOSED → ANALYZED).
 *
 * Dipakai di halaman daftar (`task-inventory/page.tsx`) dan siapa pun yang perlu
 * menampilkan status TI secara konsisten. Diekspor terpisah dari page.tsx (Server
 * Component yang mengimpor Auth.js) agar bisa di-unit-test tanpa efek samping.
 */
export const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
  TAHAP1: { label: "Tahap 1 — Seleksi", cls: "bg-blue-100 text-blue-700" },
  TAHAP2: { label: "Tahap 2 — Review Koordinator", cls: "bg-indigo-100 text-indigo-700" },
  TAHAP3: { label: "Tahap 3 — Detailing", cls: "bg-purple-100 text-purple-700" },
  CLOSED: { label: "Tertutup", cls: "bg-yellow-100 text-yellow-700" },
  ANALYZED: { label: "Teranalisis", cls: "bg-green-100 text-green-700" },
};
