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

  it("keyUntuk: isi sama mengembalikan key sama antar render", () => {
    const { result, rerender } = renderHook(() => useIdempotencyKey());
    const k1 = result.current.keyUntuk({ a: 1 });
    rerender();
    expect(result.current.keyUntuk({ a: 1 })).toBe(k1);
    expect(result.current.key).toBe(k1);
  });

  it("keyUntuk: isi berbeda mengembalikan key berbeda dan menjadikannya aktif", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const k1 = result.current.keyUntuk({ a: 1 });
    let k2 = "";
    act(() => {
      k2 = result.current.keyUntuk({ a: 2 });
    });
    expect(k2).not.toBe(k1);
    expect(result.current.key).toBe(k2);
    expect(result.current.keyUntuk({ a: 2 })).toBe(k2);
  });

  it("keyUntuk: A, lalu B, lalu A menghasilkan tiga key berbeda", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    let ka = "";
    let kb = "";
    let ka2 = "";
    act(() => {
      ka = result.current.keyUntuk("A");
      kb = result.current.keyUntuk("B");
      ka2 = result.current.keyUntuk("A");
    });
    expect(new Set([ka, kb, ka2]).size).toBe(3);
  });

  it("keyUntuk: setelah perbarui() key berganti walau isi sama", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const k1 = result.current.keyUntuk({ a: 1 });
    act(() => result.current.perbarui());
    expect(result.current.keyUntuk({ a: 1 })).not.toBe(k1);
  });
});
