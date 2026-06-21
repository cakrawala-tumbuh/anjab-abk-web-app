# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

## [1.2.0] - 2026-06-21

### Ditambahkan

- **Time Study — halaman admin** (`/time-study`): daftar sesi, buat sesi baru (jabatan + periode),
  detail sesi dengan transisi status (buka/tutup/analisis), kelola responden (tambah/hapus).
- **Time Study — halaman partisipan** (`/time-study/isi/{responden_id}`): daftar log harian,
  form tambah log (waktu masuk, waktu keluar, warna hari, pembagian jam+menit per 6 kategori),
  form edit log yang sudah ada. Tampilan menit dalam format "Xj Ym".
- **Halaman Kuesioner Saya** (`/kuesioner`): tambah seksi "Time Study — Studi Waktu" yang
  menampilkan sesi yang aktif, jumlah log yang telah diinput, dan tombol "Tambah Log" atau
  "Lihat Log".
- **Dashboard**: tambah kartu "Time Study" untuk admin.

### Diubah

- `openapi/openapi.json` dan `src/lib/api/schema.ts` diperbarui untuk mencakup semua endpoint
  Time Study yang baru.

## [1.0.0] - 2026-06-21

### Ditambahkan

- **Koordinator SME Panel**: kolom "Koordinator" pada tabel anggota panel — menampilkan badge
  amber bila anggota berstatus koordinator. Tombol "Jadikan Koordinator" / "Batalkan Koordinator"
  per baris memungkinkan admin menetapkan atau mencabut koordinator via PATCH SME Panel.
- E2E test baru: "admin dapat menetapkan koordinator SME panel".

## [0.9.0] - 2026-06-21

### Diperbaiki

- **E2E `kuesioner.spec.ts`**: empat perbaikan pada test helper:
  - `buatSekolah`: label `selectOption` jenjang disesuaikan dengan format aktual
    `{kode} — {nama}` (sebelumnya hanya nama, menyebabkan timeout 60 s).
  - `tambahRespondenPartisipan`: cek idempoten diganti dari `page.content().includes()`
    ke `tbody.getByText()` agar tidak false-positive dengan `<option>` di dropdown.
  - `tambahRespondenPartisipan`: `selectOption` partisipan menggunakan label eksak
    `{nama} — {jabatan}` (Playwright tidak mendukung `RegExp` untuk `label`).
  - `tambahRespondenPartisipan`: konfirmasi responden terdaftar di-scope ke `tbody`
    agar tidak ambiguous dengan elemen `<option>` di dropdown.
  - `partisipan melihat kuesioner DCS`: `getByText("Belum diisi")` ditambahkan
    `{ exact: true }` untuk menghindari strict mode violation.

## [0.8.0] - 2026-06-21

### Ditambahkan

- **SME Panel**: halaman `master-data/sme-panel/` — daftar panel pakar, detail panel,
  tambah & hapus anggota panel per jabatan.
- E2E test SME Panel di `e2e/master-data.spec.ts`.

### Diubah

- **DCS & WCP "Kuesioner Saya" berbasis assignment**: halaman `/kuesioner` hanya
  menampilkan DCS/WCP yang sudah di-assign admin secara eksplisit; tidak ada lagi
  auto-enrollment berdasarkan jabatan.
- `openapi/openapi.json` dan `src/lib/api/schema.ts` diselaraskan dengan backend v0.5.0
  (SME Panel API + perubahan enrollment).

### Diperbaiki

- `compose.e2e.yml`: backend URL menggunakan `HOST_IP` untuk Next.js SSR (sebelumnya
  hanya `localhost` yang tidak terjangkau dari dalam container saat SSR).
- Form partisipan (`tambah` & `edit`): perbaikan validasi dan tampilan field.
- WCP item editor & Task Inventory sesi detail: perbaikan minor tampilan.
- `eslint.config.mjs`: tambahkan rule yang sebelumnya tidak aktif.

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

[Unreleased]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/releases/tag/v0.1.0
