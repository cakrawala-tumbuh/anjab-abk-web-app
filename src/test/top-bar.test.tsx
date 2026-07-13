import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/theme-provider";
import { TopBar } from "@/components/shell/top-bar";

// Mock matchMedia yang tidak ada di JSDOM — dibutuhkan ThemeProvider.
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function renderTopBar() {
  return render(
    <ThemeProvider>
      <TopBar username="Budi" onToggleSidebar={vi.fn()} />
    </ThemeProvider>,
  );
}

describe("TopBar — logout tidak boleh terpicu navigasi pasif (prefetch)", () => {
  it("Keluar dirender sebagai form POST ke /api/auth/logout, bukan <a>/<Link> GET", () => {
    renderTopBar();

    // Tidak ada link "Keluar" — logout bukan navigasi GET yang bisa di-prefetch.
    expect(screen.queryByRole("link", { name: "Keluar" })).toBeNull();

    const button = screen.getByRole("button", { name: "Keluar" });
    expect(button).toHaveAttribute("type", "submit");

    const form = button.closest("form");
    expect(form).not.toBeNull();
    expect(form).toHaveAttribute("action", "/api/auth/logout");
    expect(form).toHaveAttribute("method", "post");
  });

  it("link lain (logo) tetap <Link> normal — hanya logout yang diubah", () => {
    renderTopBar();
    expect(screen.getByRole("link", { name: "ANJAB-ABK" })).toHaveAttribute("href", "/dashboard");
  });
});
