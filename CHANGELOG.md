# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

## [0.4.0] - 2026-06-20

### Ditambahkan

- **CI/CD**: Workflow rilis otomatis (`.github/workflows/release.yml`) — dipicu push tag `v*`, membuat GitHub Release dan mem-push image Docker ke GHCR (`andhit-r/github-release@v1` + `andhit-r/release-docker-image-ghcr@v2`, preset nextjs, output standalone)
- **Operasional**: `scripts/backup-config.sh` — backup `.env.local` ke folder `backups/` dengan timestamp
- **Operasional**: `scripts/restore-config.sh` — restore `.env.local` dari file backup
- **Makefile**: target `backup-config`, `restore-config`, `backup-list` untuk operasi backup konfigurasi

### Diubah

- `Makefile` — tambah deklarasi `.PHONY` untuk target backup/restore
- `.gitignore` — tambah pola `backups/` agar folder backup tidak masuk repositori

## [0.3.0] - 2026-06-20

### Ditambahkan

- **PWA**: Web App Manifest (`src/app/manifest.ts`) — nama, deskripsi, `display: standalone`, warna tema
- **PWA**: Service Worker (`public/sw.js`) — cache-first untuk aset statis, network-first untuk navigasi, bypass untuk rute `/api/*`
- **PWA**: Komponen `PwaRegister` untuk registrasi service worker di sisi klien tanpa library tambahan
- **Ikon**: `public/icon.svg` (512×512) dan `public/favicon.svg` (32×32) — desain organizational chart + bar chart merepresentasikan ANJAB & ABK
- **Tema**: `ThemeProvider` (`src/components/theme-provider.tsx`) — dukungan tema `light`, `dark`, dan `system` dengan persistensi ke `localStorage`
- **Tema**: `ThemeToggle` (`src/components/theme-toggle.tsx`) — tombol toggle sun/moon siap pakai di navbar/header
- **Tema**: CSS variables semantik (`--bg`, `--fg`, `--border`, `--ring`) dan color tokens `--color-primary-*` (50–950) di `globals.css`
- **Tema**: Blocking script di `<head>` untuk mencegah flash of wrong theme saat hydration
- **Responsive**: Export `viewport` terpisah (tipe `Viewport` Next.js 15) dengan `themeColor` per media query light/dark
- **A11y**: Focus ring global via `var(--ring)` di base styles

### Diubah

- `src/app/globals.css` — ditambah `@variant dark` class-based, `@theme` tokens, dan base styles responsif
- `src/app/layout.tsx` — metadata diperluas (applicationName, keywords, icons, manifest), viewport dipisah ke export `viewport`, `suppressHydrationWarning` pada `<html>`
- `src/app/providers.tsx` — `ThemeProvider` dibungkus di dalam `QueryClientProvider`
- `.gitignore` — tambah pola untuk artefak workbox yang di-generate

## [0.2.0] - 2026-06-20

### Ditambahkan

- Runtime injection `NEXT_PUBLIC_API_BASE_URL` via Docker entrypoint — URL backend dapat dikonfigurasi tanpa rebuild image

## [0.1.0] - 2026-06-20

### Ditambahkan

- Scaffold awal aplikasi Next.js 15 (App Router, TypeScript strict)
- Autentikasi via Auth.js 5 + Authentik OIDC (PKCE, public client)
- Klien API bertipe menggunakan `openapi-fetch` + schema hasil generate dari OpenAPI
- Modul master data: jabatan, jenjang pendidikan, mata pelajaran, sekolah
- Modul DCS (Data Collection Sheet) dan WCP (Work Checklist Procedure)
- Modul partisipan
- Dashboard ringkasan
- Gate test: lint (ESLint + Prettier) + typecheck + unit test (Vitest) via Docker
- E2E test scaffold (Playwright) dengan stack Authentik + backend

[Unreleased]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/releases/tag/v0.1.0
