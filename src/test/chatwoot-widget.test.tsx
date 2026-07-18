import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BASE_URL = "https://chat.contoh.sch.id";
const WEBSITE_TOKEN = "token-uji";

/** Mock `@/lib/config` per test lewat `vi.doMock` + import dinamis — nilai
 *  `config.chatwoot` dibaca modul komponen sekali saat di-import, jadi tiap
 *  skenario env butuh modul segar (`vi.resetModules`). */
async function renderWidget(
  chatwoot: { baseUrl?: string; websiteToken?: string },
  props: { name?: string | null; email?: string | null } = {},
) {
  vi.resetModules();
  vi.doMock("@/lib/config", () => ({ config: { chatwoot } }));
  const { ChatwootWidget } = await import("@/components/chatwoot-widget");
  return render(<ChatwootWidget {...props} />);
}

function chatwootScript(): HTMLScriptElement | null {
  return document.getElementById("chatwoot-sdk") as HTMLScriptElement | null;
}

describe("ChatwootWidget", () => {
  beforeEach(() => {
    delete (window as { chatwootSDK?: unknown }).chatwootSDK;
    delete (window as { $chatwoot?: unknown }).$chatwoot;
  });

  afterEach(() => {
    cleanup();
    document.getElementById("chatwoot-sdk")?.remove();
    vi.doUnmock("@/lib/config");
  });

  it("env lengkap → script SDK tersuntik dan run() dipanggil dengan token/baseUrl benar", async () => {
    await renderWidget({ baseUrl: BASE_URL, websiteToken: WEBSITE_TOKEN });

    const script = chatwootScript();
    expect(script).not.toBeNull();
    expect(script?.src).toBe(`${BASE_URL}/packs/js/sdk.js`);

    const run = vi.fn();
    window.chatwootSDK = { run };
    script?.onload?.(new Event("load"));

    expect(run).toHaveBeenCalledWith({ websiteToken: WEBSITE_TOKEN, baseUrl: BASE_URL });
  });

  it("env kosong → tidak ada script tersuntik (fitur mati diam)", async () => {
    await renderWidget({});
    expect(chatwootScript()).toBeNull();
  });

  it("hanya baseUrl terisi, websiteToken kosong → tidak ada script tersuntik", async () => {
    await renderWidget({ baseUrl: BASE_URL });
    expect(chatwootScript()).toBeNull();
  });

  it("hanya websiteToken terisi, baseUrl kosong → tidak ada script tersuntik", async () => {
    await renderWidget({ websiteToken: WEBSITE_TOKEN });
    expect(chatwootScript()).toBeNull();
  });

  it("render dua kali (StrictMode-like) → hanya satu script chatwoot-sdk terpasang", async () => {
    vi.resetModules();
    vi.doMock("@/lib/config", () => ({
      config: { chatwoot: { baseUrl: BASE_URL, websiteToken: WEBSITE_TOKEN } },
    }));
    const { ChatwootWidget } = await import("@/components/chatwoot-widget");

    const { rerender } = render(<ChatwootWidget />);
    rerender(<ChatwootWidget />);
    rerender(<ChatwootWidget />);

    expect(document.querySelectorAll("#chatwoot-sdk")).toHaveLength(1);
  });

  it("event chatwoot:ready → setUser dipanggil dengan name/email dari prop", async () => {
    await renderWidget(
      { baseUrl: BASE_URL, websiteToken: WEBSITE_TOKEN },
      { name: "Budi Santoso", email: "budi@ypii.sch.id" },
    );

    const setUser = vi.fn();
    window.$chatwoot = { setUser };
    window.dispatchEvent(new Event("chatwoot:ready"));

    expect(setUser).toHaveBeenCalledWith("budi@ypii.sch.id", {
      name: "Budi Santoso",
      email: "budi@ypii.sch.id",
    });
  });

  it("event chatwoot:ready tanpa email → setUser tidak dipanggil", async () => {
    await renderWidget({ baseUrl: BASE_URL, websiteToken: WEBSITE_TOKEN }, { name: "Budi" });

    const setUser = vi.fn();
    window.$chatwoot = { setUser };
    window.dispatchEvent(new Event("chatwoot:ready"));

    expect(setUser).not.toHaveBeenCalled();
  });
});
