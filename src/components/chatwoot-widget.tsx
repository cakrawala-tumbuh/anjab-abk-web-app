"use client";

import { useEffect } from "react";
import { config } from "@/lib/config";

declare global {
  interface Window {
    chatwootSDK?: {
      run: (options: { websiteToken: string; baseUrl: string }) => void;
    };
    $chatwoot?: {
      setUser: (identifier: string, user: { name?: string; email?: string }) => void;
    };
  }
}

const SCRIPT_ID = "chatwoot-sdk";

interface ChatwootWidgetProps {
  /** Nama user dari sesi login — dipakai untuk identify (`setUser`). */
  name?: string | null;
  /** Email user dari sesi login — identifier & payload identify (`setUser`). */
  email?: string | null;
}

/** Launcher live-chat "Butuh Bantuan?" — menyuntik SDK Chatwoot resmi.
 *  Mati diam (tanpa error) bila `NEXT_PUBLIC_CHATWOOT_*` tidak dikonfigurasi. */
export function ChatwootWidget({ name, email }: ChatwootWidgetProps) {
  useEffect(() => {
    const { baseUrl, websiteToken } = config.chatwoot;
    if (!baseUrl || !websiteToken) return;
    if (document.getElementById(SCRIPT_ID) || window.chatwootSDK) return;

    const identify = () => {
      if (email) {
        window.$chatwoot?.setUser(email, { name: name ?? undefined, email });
      }
    };
    window.addEventListener("chatwoot:ready", identify, { once: true });

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `${baseUrl}/packs/js/sdk.js`;
    script.defer = true;
    script.async = true;
    script.onload = () => {
      window.chatwootSDK?.run({ websiteToken, baseUrl });
    };
    document.head.appendChild(script);

    return () => {
      window.removeEventListener("chatwoot:ready", identify);
    };
  }, [name, email]);

  return null;
}
