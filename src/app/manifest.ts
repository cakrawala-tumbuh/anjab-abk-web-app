import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ANJAB-ABK — Analisis Jabatan & Beban Kerja",
    short_name: "ANJAB-ABK",
    description:
      "Aplikasi Analisis Jabatan (ANJAB) dan Analisis Beban Kerja (ABK) untuk yayasan pendidikan",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f9fafb",
    theme_color: "#1d4ed8",
    categories: ["education", "productivity", "business"],
    lang: "id",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  };
}
