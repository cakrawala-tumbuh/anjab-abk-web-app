# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

## [1.8.1] - 2026-06-22

### Ditambahkan

- **Schema API diperbarui** — `openapi.json` dan `schema.ts` diregenerasi dari backend v0.13.1;
  `TiCatalogRead.detil_tugas` kini `string | null`.

### Diperbaiki

- Halaman **Tugas Pokok**, **Detil Tugas**, dan **Uraian Tugas** gagal render (Server Components
  error) karena frontend meminta `limit=200`/`500` sedangkan backend hanya menerima `limit≤100`.
  Diperbaiki setelah backend v0.13.1 menaikkan batas paginasi ke 500.
- Breadcrumb `/task-inventory/tahap1/{id}` menampilkan teks "null" saat `sesi.unit` kosong;
  kini menampilkan "—".
- Halaman detail catalog (`/master-data/task-inventory/[unit]/[kategori]`) gagal saat ada task
  dengan `detil_tugas=null`; diperbaiki dengan menggunakan string kosong sebagai kunci grup.

## [1.8.0] - 2026-06-22

### Ditambahkan

- **Sesi TI tanpa unit kerja** — `TiSesiRead.unit` kini opsional; form buat sesi tidak
  mewajibkan isian unit. Catalog task ditampilkan lintas unit bila sesi tidak punya unit.
- **SME panel bebas jabatan** — halaman tambah anggota panel tidak lagi memfilter partisipan
  berdasarkan jabatan.

## [1.7.0] - 2026-06-22

### Ditambahkan

- **Master data Tugas Pokok** (`/master-data/tugas-pokok`) — daftar, tambah, edit, dan hapus
  tugas pokok (klaster tugas). Sidebar navigasi master data diperbarui dengan tiga tab baru.
- **Master data Detil Tugas** (`/master-data/detil-tugas`) — daftar, tambah, edit, dan hapus
  detil tugas dengan relasi ke tugas pokok induk; dropdown detil tugas difilter sesuai tugas
  pokok yang dipilih di form uraian tugas.
- **Master data Uraian Tugas** (`/master-data/uraian-tugas`) — daftar, tambah, edit, dan hapus
  uraian tugas (task statement individual) dengan field: kode, uraian, unit/jenjang,
  kategori jabatan, urutan, tugas pokok, dan detil tugas (opsional).
- **Regenerasi schema.ts** dari `openapi.json` backend versi terbaru; convenience re-exports
  diperluas dengan `TugasPokokRead`, `DetilTugasRead`, `UraianTugasRead`.
- **E2E tests** untuk ketiga halaman baru di `e2e/master-data.spec.ts` (CRUD dasar + validasi
  form).

## [1.6.0] - 2026-06-22

### Ditambahkan

- **Master data Instrumen TI** — tab "Instrumen TI" baru di navigasi Master Data (`/master-data/task-inventory`).
  Menampilkan seluruh kombinasi unit × kategori jabatan dari catalog bawaan sistem, dikelompokkan per unit (TK, SD, SMP, SMA, dsb.) dalam bentuk grid card dengan jumlah task.
- **Detail catalog per kombinasi** (`/master-data/task-inventory/[unit]/[kategori]`) — menelusuri
  task secara hierarkis: tugas pokok (accordion) → detil tugas → uraian tugas + kode task.
  Tampilan read-only; data bersumber dari catalog JSON bawaan sistem.

## [1.5.0] - 2026-06-21

### Ditambahkan

- **Route handler logout OIDC** (`GET /api/auth/logout`) — melakukan RP-initiated logout
  ke Authentik end-session endpoint dengan `id_token_hint` dan `post_logout_redirect_uri`,
  menggantikan server action yang tidak mendukung redirect lintas-origin di Auth.js v5 beta.
- **`idToken` di JWT dan session** — disimpan dari `account.id_token` saat login untuk
  dipakai sebagai `id_token_hint` saat logout OIDC.
- **`appUrl` di config** — membaca `AUTH_URL` / `NEXTAUTH_URL` untuk dipakai sebagai
  `post_logout_redirect_uri` saat logout.
- **E2E: describe "Alur Logout (Keluar)"** di `auth.spec.ts` — 2 test baru: verifikasi
  tautan Keluar tampil setelah login, dan redirect 303 ke Authentik end-session.

### Diperbaiki

- **Tombol "Keluar" tidak benar-benar logout** — sesi SSO Authentik tetap aktif karena
  Auth.js v5 beta tidak mendukung `redirectTo` lintas-origin dari server action. Diperbaiki
  dengan mengganti `<form>` server action menjadi `<Link>` ke `/api/auth/logout`.
- **Race condition `buatSekolah` di `kuesioner.spec.ts`** — `selectOption` dipanggil
  sebelum opsi dropdown jenjang selesai di-fetch async. Diperbaiki dengan menunggu
  `option.nth(1)` ter-attach sebelum memanggil `selectOption`.

## [1.4.1] - 2026-06-21

### Diperbaiki

- **Tombol "Keluar" tidak berfungsi** — Auth.js v5 tidak mendukung form POST ke
  `/api/auth/signout`. Diperbaiki dengan mengubah form menjadi Server Action yang
  memanggil `signOut({ redirectTo: "/" })` secara langsung.

## [1.4.0] - 2026-06-21

### Diubah

- **DCS & WCP: form buat sesi tidak lagi memiliki dropdown jabatan** — field `jabatan_id`
  dihapus dari form `/dcs/buat` dan `/wcp/buat`. Partisipan dengan jabatan apapun dapat
  di-assign ke sesi yang sama.
- **DCS & WCP: halaman list sesi** — kolom "Jabatan" diganti "Keterangan"; teks link
  menampilkan `sesi.catatan` (jika diisi) atau `sesi.periode` sebagai fallback.
- **DCS & WCP: halaman detail sesi** — heading dan breadcrumb menggunakan
  `sesi.catatan ?? sesi.periode` sebagai label (sebelumnya menggunakan nama jabatan).
- OpenAPI schema (`openapi/openapi.json`) dan tipe TypeScript (`src/lib/api/schema.ts`)
  di-generate ulang menyesuaikan skema backend v0.11.0.
- **E2E test sesi** (`e2e/sesi.spec.ts`): dihapus helper `buatJabatan`, dihapus
  langkah pilih jabatan dari form, dihapus tes "jabatan wajib dipilih", diperbarui
  idempotency check berbasis periode (bukan nama jabatan).
- **E2E test kuesioner** (`e2e/kuesioner.spec.ts`): `buatDcsSesiOpen` diperbarui —
  langkah pilih jabatan di form buat sesi dihapus; idempotency check menggunakan
  link teks periode.
- Unit test form (`src/test/sesi-form-schema.test.ts`): dihapus test kasus `jabatan_id`.

## [1.3.0] - 2026-06-21

### Ditambahkan

- **ThemeToggle di navigasi**: tombol ganti dark/light mode kini muncul di navbar untuk semua
  pengguna (admin maupun partisipan), bukan hanya sebagai komponen tersembunyi.
- **Unit test ThemeProvider & ThemeToggle** (10 kasus): verifikasi baca/tulis localStorage,
  toggle kelas `.dark` pada `<html>`, dan aria-label tombol sesuai mode aktif.
- **E2E test tema** (5 kasus): verifikasi ThemeToggle tersedia di navbar, mengubah kelas
  `.dark`, menyimpan ke localStorage, dan bertahan setelah reload halaman.
- **CSS component utilities** di `globals.css`: `.form-card`, `.form-label`, `.form-error`,
  `.form-server-error`, `.page-heading`, `.page-subtext`, `.page-card`, `.table-container`,
  `.empty-state` — sebagai fondasi dark/light mode konsisten.

### Diperbaiki

- **Dark mode UI rusak**: seluruh halaman (form, tabel, kartu, navigasi, tab Master Data)
  kini merespons dark mode dengan benar. Sebelumnya hampir semua warna hard-coded ke light
  mode (`bg-white`, `text-gray-700`, `border-gray-200`, dst.) sehingga UI terlihat putih di
  atas latar gelap.
- **Input/select/textarea tidak terbaca di dark mode**: ditambahkan CSS global (di luar
  `@layer`) yang meng-override warna form control browser agar menggunakan `gray-800`
  background dan `gray-100` teks di dark mode, mengatasi konflik dengan Tailwind utilities.

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

[Unreleased]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v1.4.1...HEAD
[1.4.1]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v1.0.0...v1.2.0
[1.0.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cakrawala-tumbuh/anjab-abk-web-app/releases/tag/v0.1.0
