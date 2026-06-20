import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import { PwaRegister } from "@/components/pwa-register";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "ANJAB-ABK",
    template: "%s — ANJAB-ABK",
  },
  description: "Analisis Jabatan dan Analisis Beban Kerja untuk yayasan pendidikan",
  applicationName: "ANJAB-ABK",
  authors: [{ name: "Yayasan Pendidikan" }],
  keywords: [
    "anjab",
    "abk",
    "analisis jabatan",
    "analisis beban kerja",
    "sdm",
    "yayasan pendidikan",
  ],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1d4ed8" },
    { media: "(prefers-color-scheme: dark)", color: "#1e3a8a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
