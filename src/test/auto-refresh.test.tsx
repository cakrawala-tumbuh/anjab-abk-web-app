import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock router ──────────────────────────────────────────────────────────────
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
}));

import { AutoRefresh } from "@/components/auto-refresh";

/** Set `document.visibilityState` (jsdom tidak mengizinkan assignment biasa). */
function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  refresh.mockReset();
  setVisibility("visible");
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AutoRefresh", () => {
  it("memanggil router.refresh() sekali per interval selama tab terlihat", () => {
    render(<AutoRefresh intervalMs={20000} />);

    vi.advanceTimersByTime(60000);

    expect(refresh).toHaveBeenCalledTimes(3);
  });

  it("tidak pernah memanggil router.refresh() saat tab tersembunyi", () => {
    setVisibility("hidden");
    render(<AutoRefresh intervalMs={20000} />);

    vi.advanceTimersByTime(60000);

    expect(refresh).not.toHaveBeenCalled();
  });

  it("memanggil router.refresh() segera saat tab kembali terlihat", () => {
    setVisibility("hidden");
    render(<AutoRefresh intervalMs={20000} />);
    vi.advanceTimersByTime(60000);
    expect(refresh).not.toHaveBeenCalled();

    setVisibility("visible");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("tidak memanggil router.refresh() lagi setelah unmount", () => {
    const { unmount } = render(<AutoRefresh intervalMs={20000} />);
    vi.advanceTimersByTime(20000);
    expect(refresh).toHaveBeenCalledTimes(1);

    unmount();
    vi.advanceTimersByTime(60000);

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
