"use client";

import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

// Mock matchMedia yang tidak ada di JSDOM
const mockMatchMedia = (prefersDark: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark && query.includes("dark"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  mockMatchMedia(false);
});

// ── ThemeProvider ─────────────────────────────────────────────────────────────

describe("ThemeProvider", () => {
  it("default: tidak menambah .dark saat sistem prefer light", async () => {
    mockMatchMedia(false);
    await act(async () => {
      render(
        <ThemeProvider>
          <div />
        </ThemeProvider>,
      );
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("membaca localStorage dan menerapkan dark mode", async () => {
    localStorage.setItem("theme", "dark");
    await act(async () => {
      render(
        <ThemeProvider>
          <div />
        </ThemeProvider>,
      );
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("membaca localStorage dan menerapkan light mode", async () => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "light");
    await act(async () => {
      render(
        <ThemeProvider>
          <div />
        </ThemeProvider>,
      );
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("setTheme('dark') menambah kelas .dark dan menyimpan ke localStorage", async () => {
    function Consumer() {
      const { setTheme } = useTheme();
      return <button onClick={() => setTheme("dark")}>set dark</button>;
    }
    await act(async () => {
      render(
        <ThemeProvider>
          <Consumer />
        </ThemeProvider>,
      );
    });
    await act(async () => {
      fireEvent.click(screen.getByText("set dark"));
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("setTheme('light') menghapus kelas .dark", async () => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
    function Consumer() {
      const { setTheme } = useTheme();
      return <button onClick={() => setTheme("light")}>set light</button>;
    }
    await act(async () => {
      render(
        <ThemeProvider>
          <Consumer />
        </ThemeProvider>,
      );
    });
    await act(async () => {
      fireEvent.click(screen.getByText("set light"));
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("resolvedTheme mengikuti preferensi sistem saat theme=system dan prefersDark", async () => {
    mockMatchMedia(true);
    localStorage.setItem("theme", "system");
    function Consumer() {
      const { resolvedTheme } = useTheme();
      return <span data-testid="resolved">{resolvedTheme}</span>;
    }
    await act(async () => {
      render(
        <ThemeProvider>
          <Consumer />
        </ThemeProvider>,
      );
    });
    expect(screen.getByTestId("resolved").textContent).toBe("dark");
  });
});

// ── ThemeToggle ───────────────────────────────────────────────────────────────

describe("ThemeToggle", () => {
  it("menampilkan ikon bulan di light mode", async () => {
    localStorage.setItem("theme", "light");
    await act(async () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );
    });
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-label", "Ganti ke tema gelap");
  });

  it("menampilkan ikon matahari di dark mode", async () => {
    localStorage.setItem("theme", "dark");
    await act(async () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );
    });
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-label", "Ganti ke tema terang");
  });

  it("klik toggle mengubah tema dari light ke dark", async () => {
    localStorage.setItem("theme", "light");
    await act(async () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("klik toggle mengubah tema dari dark ke light", async () => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
    await act(async () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>,
      );
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
