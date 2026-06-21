# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

## [0.7.0] - 2026-06-21

### Ditambahkan

- **Kuesioner Saya — Task Inventory**: halaman `kuesioner/` kini menampilkan section
  **Task Inventory** (2 fase: Tahap 1 seleksi / Tahap 2 detail) selain DCS & WCP,
  mengonsumsi endpoint `/api/v1/task-inventory/kuesioner/saya`.
- Tipe `TiKuesionerItemRead` dan path Task Inventory "Kuesioner Saya" pada
  `src/lib/api/schema.ts`; `openapi/openapi.json` diselaraskan dengan backend.

### Diubah

- "Kuesioner Saya" mengikuti model enrollment otomatis backend — alat ukur muncul tanpa
  penugasan manual; ringkasan jumlah alat ukur & empty-state disesuaikan.

## [0.6.0] - 2026-06-21

### Ditambahkan

- **Task Inventory**: modul `task-inventory/` (alur 2 tahap, CalHR 5-komponen) — daftar & buat sesi,
  detail sesi dengan transisi status (`DRAFT → TAHAP1 → TAHAP2 → CLOSED → ANALYZED`), kelola
  responden, form seleksi relevansi Tahap 1, form detailing CalHR Tahap 2, tampilan task terpilih
  & hasil agregasi. Link navigasi di nav & dashboard.
- **Kuesioner Saya**: halaman `kuesioner/` (daftar kuesioner DCS/WCP yang ditugaskan) beserta
  halaman pengisian `dcs/isi/` & `wcp/isi/`; e2e `kuesioner.spec.ts`.
- Klien bertipe `src/lib/api/schema.ts` diperluas dengan path & tipe Task Inventory, jawaban,
  serta Kuesioner Saya.
- Unit test Vitest skema Zod form sesi & detail Task Inventory (`src/test/taskinv-form-schema.test.ts`).

## [0.5.0] - 2026-06-20

### Ditambahkan

- **E2E**: `e2e/master-data.spec.ts` — uji master data (jenjang pendidikan, sekolah, mata pelajaran, DCS/WCP) via Playwright
- **E2E**: `e2e/partisipan.spec.ts` — uji navigasi dan validasi form tambah partisipan via Playwright
- **E2E**: `package-e2e.json` — manifest dependensi eksplisit untuk Playwright dengan versi ter-pin

### Diperbaiki

- **Form mata pelajaran**: pesan validasi "Kelompok wajib dipilih" tidak muncul saat field kosong — `z.enum` menerima string kosong `""` sebagai invalid enum, bukan required; diperbaiki dengan `z.preprocess` untuk konversi `""` → `undefined`
- **Form tambah partisipan**: pesan "Format email tidak valid" tidak muncul — browser native validation memblokir submit sebelum Zod berjalan; diperbaiki dengan menambah `noValidate` pada `<form>`
- **E2E sesi DCS/WCP**: `doTransisi` gagal karena `isVisible()` dipanggil sebelum Client Component selesai hydrate setelah `waitForURL`; diperbaiki dengan `btn.waitFor({ state: "visible" })` dan tambah `waitForLoadState("networkidle")`
- **E2E sekolah**: `selectOption({ label: /regex/ })` tidak didukung di Playwright v1.49 — diganti string eksplisit `"E2E-JENJANG — Jenjang E2E Test"`
- **Dockerfile.e2e**: deps Playwright tidak ter-cache saat source berubah — diperbaiki dengan memisahkan `COPY package-e2e.json` sebelum `RUN npm install`

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
