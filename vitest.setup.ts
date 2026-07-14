import "@testing-library/jest-dom";
import { vi } from "vitest";

// Toast (sonner) di-mock global: test memverifikasi notifikasi lewat helper
// `src/lib/notify.ts`, bukan lewat DOM toast yang dirender lewat portal.
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));
