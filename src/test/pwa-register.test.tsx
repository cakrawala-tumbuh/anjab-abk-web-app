import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PwaRegister, daftarkanSwSetelahLoad } from "@/components/pwa-register";

/** `window` palsu minimal: readyState bisa diatur, pendengar `load` bisa dipicu manual. */
function jendela(readyState: DocumentReadyState) {
  const target = new EventTarget();
  return Object.assign(target, { document: { readyState } }) as unknown as Window;
}

function navigatorDenganSw() {
  const register = vi.fn(() => Promise.resolve({} as ServiceWorkerRegistration));
  return { nav: { serviceWorker: { register } } as unknown as Navigator, register };
}

describe("daftarkanSwSetelahLoad", () => {
  it("dokumen masih memuat: registrasi menunggu event load", () => {
    const win = jendela("loading");
    const { nav, register } = navigatorDenganSw();
    daftarkanSwSetelahLoad(win, nav);
    expect(register).not.toHaveBeenCalled();
    win.dispatchEvent(new Event("load"));
    expect(register).toHaveBeenCalledWith("/sw.js");
    win.dispatchEvent(new Event("load"));
    expect(register).toHaveBeenCalledTimes(1);
  });

  it("dokumen interactive (DOMContentLoaded, belum load) juga menunggu", () => {
    const win = jendela("interactive");
    const { nav, register } = navigatorDenganSw();
    daftarkanSwSetelahLoad(win, nav);
    expect(register).not.toHaveBeenCalled();
  });

  it("dokumen sudah complete: langsung didaftarkan", () => {
    const { nav, register } = navigatorDenganSw();
    daftarkanSwSetelahLoad(jendela("complete"), nav);
    expect(register).toHaveBeenCalledTimes(1);
  });

  it("pembersih melepas pendengar load sebelum terpicu", () => {
    const win = jendela("loading");
    const { nav, register } = navigatorDenganSw();
    const bersihkan = daftarkanSwSetelahLoad(win, nav);
    bersihkan();
    win.dispatchEvent(new Event("load"));
    expect(register).not.toHaveBeenCalled();
  });

  it("browser tanpa service worker: tidak melakukan apa pun", () => {
    const win = jendela("complete");
    expect(() => daftarkanSwSetelahLoad(win, {} as Navigator)()).not.toThrow();
  });

  it("registrasi gagal tidak melempar", async () => {
    const register = vi.fn(() => Promise.reject(new Error("gagal")));
    const nav = { serviceWorker: { register } } as unknown as Navigator;
    daftarkanSwSetelahLoad(jendela("complete"), nav);
    await Promise.resolve();
    expect(register).toHaveBeenCalled();
  });
});

describe("PwaRegister", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("merender null dan mendaftarkan SW setelah mount (jsdom: dokumen complete)", () => {
    const register = vi.fn(() => Promise.resolve({} as ServiceWorkerRegistration));
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register },
      configurable: true,
    });
    const { container } = render(<PwaRegister />);
    expect(container.innerHTML).toBe("");
    expect(document.readyState).toBe("complete");
    expect(register).toHaveBeenCalledWith("/sw.js");
    delete (navigator as unknown as Record<string, unknown>).serviceWorker;
  });
});
