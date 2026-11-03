import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useIdempotencyKey } from "@/lib/use-idempotency-key";

describe("useIdempotencyKey", () => {
  it("key stabil antar render", () => {
    const { result, rerender } = renderHook(() => useIdempotencyKey());
    const awal = result.current.key;
    expect(awal).toMatch(/^[0-9a-f-]{36}$/);
    rerender();
    rerender();
    expect(result.current.key).toBe(awal);
  });

  it("berubah setelah perbarui()", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const awal = result.current.key;
    act(() => result.current.perbarui());
    expect(result.current.key).not.toBe(awal);
  });
});
