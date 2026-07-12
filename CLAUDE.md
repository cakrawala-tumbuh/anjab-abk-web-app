# anjab-abk-web-app — Frontend Next.js (ANJAB & ABK, Yayasan Pendidikan)

Ikhtisar & cara pakai (untuk manusia): lihat README.md.
Konteks domain (yayasan pendidikan, jenjang sekolah, struktur organisasi): lihat CLAUDE.md repo induk.

## Perintah

@Makefile

## Struktur / Arsitektur

**Next.js App Router + TypeScript strict** — Server Components default, Client Components hanya bila perlu interaktivitas.

```
src/
├── app/                    # routing App Router (layout, page, loading, error per route)
│   ├── layout.tsx          # root layout (Providers, font, globals.css)
│   ├── providers.tsx       # "use client": QueryClientProvider (TanStack Query)
│   ├── (auth)/             # grup route yang butuh login
│   ├── jabatan/            # domain ANJAB — jabatan, uraian, syarat
│   ├── beban-kerja/        # domain ABK — input volume & norma waktu
│   ├── unit-kerja/         # manajemen satuan pendidikan & sub-unit
│   └── laporan/            # ekspor PDF/Excel hasil ANJAB & ABK
├── components/
│   └── ui/                 # komponen shadcn/ui (Radix primitives, dimiliki project)
├── lib/
│   ├── api/
│   │   ├── client.ts       # openapi-fetch (Bearer middleware)
│   │   ├── errors.ts       # pemetaan envelope error backend
│   │   └── schema.ts       # GENERATED dari openapi.json — jangan edit manual
│   ├── auth/
│   │   └── auth.ts         # Auth.js OIDC Authentik (PKCE, public client)
│   └── config.ts           # validasi env (NEXT_PUBLIC_* vs server)
└── test/                   # Vitest + Testing Library
```

- Entrypoint: `src/app/layout.tsx`
- API backend dikonsumsi via `src/lib/api/client.ts` (tipe dari `openapi/schema.ts`)
- Docs pengguna: `docs-usage/` + `mkdocs-usage.yml`

## Konvensi & Invariants

- **Server Component by default** — tandai `"use client"` hanya saat butuh hook/interaktivitas.
- Semua akses API backend lewat klien bertipe di `src/lib/api/` — dilarang `fetch` ad-hoc tanpa tipe.
- Token akses **tidak** disimpan di `localStorage`; pakai sesi Auth.js (cookie httpOnly).
- Env klien wajib berprefiks `NEXT_PUBLIC_`; env server (tanpa prefiks) tidak boleh terekspos ke klien.
- Setiap route wajib punya `loading.tsx` dan `error.tsx`.
- Komponen shadcn/ui di-copy ke `src/components/ui/` dan dimiliki project — boleh dimodifikasi.
- `src/lib/api/schema.ts` adalah artefak generate — regenerate dengan `npm run gen:api`, jangan edit tangan.

## Revisi Desain

### [2026-07-12] DCS & WCP: hapus sesi, ganti pola instrumen singleton + hasil agregat baru

Mengikuti refactor backend (entitas sesi DCS/WCP dihapus, diganti pola
singleton — satu baris instrumen per alat ukur, status
`OPEN → CLOSED → ANALYZED`). TI dan OPM **tidak disentuh** (istilah "sesi"
tetap dipertahankan di sana).

- **Route dihapus**: `/dcs/buat`, `/dcs/[sesi_id]` (dan seluruh isinya:
  `dcs-sesi-form.tsx`, `transisi-sesi.tsx`, `tambah-responden.tsx`), idem
  `/wcp/buat`, `/wcp/[sesi_id]`.
- **`/dcs` dan `/wcp` ditulis ulang** dari listing sesi menjadi halaman
  instrumen tunggal: kartu status (badge OPEN/CLOSED/ANALYZED, min_responden,
  catatan, jumlah submit vs total), `assign-responden.tsx` (form multi-select
  checkbox — menggantikan `tambah-responden.tsx`, satu submit untuk banyak
  partisipan lewat `POST .../responden` dengan `partisipan_ids: string[]`),
  `aksi-instrumen.tsx` (menggantikan `transisi-sesi.tsx`; **menambahkan**
  tombol "Jalankan Analisis" yang sebelumnya tidak ada sama sekali di
  DCS/WCP — disabled bila submit < min_responden dengan alasan tertulis),
  `edit-instrumen.tsx` (PATCH `min_responden`/`catatan`, disclosure kecil),
  dan `hapus-responden.tsx` (dipindah dari `[sesi_id]/hapus-responden.tsx`,
  endpoint `DELETE /api/v1/{dcs|wcp}/responden/{id}`).
- **`/dcs/hasil` dan `/wcp/hasil` — halaman baru**, sebelumnya tidak ada sama
  sekali. Menampilkan hasil agregat dari `GET /{dcs|wcp}/hasil`: mean/stdev/
  Cronbach alpha per subskala (DCS) atau dimensi (WCP), risk_flag, dan
  (khusus DCS) K-Index psikososial + komponen WCP Risk. Redirect ke
  `/dcs` atau `/wcp` bila status instrumen bukan `ANALYZED`.
- Halaman hasil per-responden pindah dari
  `/dcs/[sesi_id]/hasil-responden/[responden_id]` ke
  `/dcs/hasil-responden/[responden_id]` (idem WCP) — konten sama, hanya
  fetch yang tidak lagi butuh `sesi_id`.
- Halaman pengisian partisipan `/dcs/isi/[responden_id]` & `/wcp/isi/[responden_id]`
  **tidak berubah secara konsep** (tidak pernah menyentuh sesi) — hanya path
  endpoint API yang disesuaikan (`/dcs/sesi/responden/{id}/...` →
  `/dcs/responden/{id}/...`, idem WCP).
- `src/app/(auth)/kuesioner/page.tsx`: kartu DCS & WCP (`InstrumenKuesionerCard`,
  komponen baru terpisah dari `KuesionerCard` yang masih dipakai OPM/TI) kini
  memakai `instrumen_status`/`catatan` — field `sesi_status`/`sesi_periode`/
  `sesi_catatan` sudah tidak ada di respons `DcsKuesionerItemRead`/
  `WcpKuesionerItemRead`. Karena instrumen singleton, maksimal satu kartu
  DCS dan satu kartu WCP per partisipan.
- `schema.ts`: `DcsSesiRead`/`WcpSesiRead` diganti `DcsInstrumenRead`/
  `WcpInstrumenRead` + `DcsInstrumenUpdate`/`WcpInstrumenUpdate` di
  convenience re-exports akhir file (append setelah `gen:api`, sama seperti
  konvensi Task Inventory).
- E2E: `e2e/sesi.spec.ts` (transisi sesi DCS/WCP) dihapus total.
  `e2e/hapus-sesi.spec.ts` (pola hard-delete `paksa=true`) retarget dari DCS
  ke Task Inventory — DCS/WCP tidak lagi punya tombol hapus sesi, tapi
  pola/komponen yang sama masih dipakai OPM & TI. `e2e/kuesioner.spec.ts`
  bagian DCS ditulis ulang untuk alur assign multi-select tanpa sesi.

### [2026-07-10] Shell gaya Gmail: sidebar kiri collapsible

Top-nav horizontal lama diganti shell gaya Gmail — **top bar** + **sidebar kiri
collapsible** (rail ikon ↔ full ikon+label di desktop, drawer overlay di mobile),
meniru pola `school-partner-portal-web`. Menu bersifat role-based (admin vs
partisipan); Master Data jadi grup collapsible bertingkat di sidebar (bukan tab
horizontal lagi).

- Komponen baru di `src/components/shell/`: `app-shell.tsx` (kerangka top bar +
  sidebar + `<main>`, state `railExpanded` dipersist ke `localStorage` key
  `anjab_sidebar_rail`, state `mobileOpen` tidak dipersist), `top-bar.tsx`
  (hamburger, logo, nama user, `ThemeToggle`, link Keluar), `sidebar.tsx`
  (konstanta menu `NAV_ADMIN`/`NAV_PARTISIPAN` + helper `navForGroups`/
  `isActiveHref`, diekspor agar testable).
- `src/app/(auth)/layout.tsx` kini merender `<AppShell groups={...} username={...}>`;
  batas `max-w-6xl` lama dihapus (main jadi fluid).
- `src/app/(auth)/master-data/layout.tsx`: tab horizontal `NAV_ITEMS` dihapus —
  daftar 11 sub-item Master Data pindah ke `sidebar.tsx` (`MASTER_DATA_ITEMS`)
  sebagai grup collapsible.
- Dependency baru: `lucide-react` (ikon sidebar/top bar).
- Sistem tema (`ThemeProvider`/`ThemeToggle` custom, class-based dark mode)
  **tidak diubah** — bukan `next-themes`.

### [2026-07-04] Time Study: hapus sesi, penugasan berbasis partisipan

Time Study tidak lagi memakai sesi. Admin menugaskan partisipan langsung (1
partisipan = 1 penugasan); partisipan mencatat log harian open-ended selama
penugasannya aktif.

- Rute admin: `/time-study` menampilkan daftar penugasan (bukan sesi); `/time-study/buat`
  langsung memilih partisipan untuk ditugaskan (form `ts-penugasan-form.tsx`, menggantikan
  `ts-sesi-form.tsx`); `/time-study/{penugasan_id}` (dulu `{sesi_id}`) menampilkan info
  partisipan + toggle aktif/nonaktif (`toggle-aktif.tsx`, menggantikan `transisi-sesi.tsx`)
  - hapus penugasan (`hapus-penugasan.tsx`). Komponen `tambah-responden.tsx` dihapus —
    assign kini terjadi sekali saat membuat penugasan.
- Rute partisipan: `/time-study/isi/[responden_id]` menjadi `/time-study/isi/[penugasan_id]`.
  Halaman & form log (`ts-log-form.tsx`, `ts-log-edit-form.tsx`) memakai endpoint
  `/api/v1/time-study/penugasan/{penugasan_id}/log`. Tombol tambah/edit log disembunyikan
  saat penugasan nonaktif (`penugasan.aktif === false`).
- `TsKuesionerItemRead` di `schema.ts` diringkas menjadi `{id, aktif, jumlah_log, created_at}`
  — field `sesi_*`/`jabatan_label` dihapus. Halaman `/kuesioner`: `TsKuesionerCard` memakai
  `aktif` (bukan `sesi_status === "OPEN"`) untuk menentukan status & tombol aksi.

### [2026-06-21] Task Inventory: Alur 3 Tahap

- Alur TI berubah dari 2 tahap menjadi 3 tahap.
- **Tahap 1** (`/task-inventory/tahap1/{responden_id}`): Partisipan pilih task relevan.
- **Tahap 2** (`/task-inventory/tahap2/{sesi_id}`): Koordinator review task partial. Dapat diakses oleh admin atau koordinator SME panel yang ditunjuk (`sesi.koordinator_id`).
- **Tahap 3** (`/task-inventory/tahap3/{responden_id}`): Partisipan isi detail CalHR.
- Status sesi: `DRAFT → TAHAP1 → TAHAP2 → TAHAP3 → CLOSED → ANALYZED`.
- Saat transisi TAHAP2→TAHAP3, task dibekukan = unanimous ∪ koordinator-disetujui.
- `src/lib/api/schema.ts` memiliki convenience re-exports di akhir file yang harus dipertahankan saat `gen:api` (append setelah generate ulang).

### [2026-06-25] DCS & WCP: Hilangkan jabatan dari tampilan partisipan

- Halaman `/kuesioner` (DCS & WCP): label kartu kini menggunakan `sesi_catatan ?? sesi_periode`
  (bukan `jabatan_label` responden).
- Halaman `/wcp/isi/{id}` dan `/dcs/isi/{id}`: subtext header hanya menampilkan nama partisipan,
  tidak lagi menampilkan `jabatan_label`.
- `DcsKuesionerItemRead` / `WcpKuesionerItemRead` di `schema.ts`: field `jabatan_label` diganti
  `sesi_catatan?: string | null`.

### [2026-06-21] DCS & WCP: Sesi tidak terikat jabatan

Sesi DCS dan WCP tidak lagi memerlukan pilihan jabatan saat pembuatan.
Partisipan dengan jabatan apapun dapat di-assign ke sesi yang sama.

- Form buat sesi (`/dcs/buat`, `/wcp/buat`): dropdown jabatan dihapus.
- Page list sesi: kolom "Jabatan" diganti "Keterangan" (tampilkan `catatan` atau `periode` sebagai fallback).
- Page detail sesi: heading/breadcrumb menggunakan `sesi.catatan ?? sesi.periode` sebagai label.
- `JabatanRead` tidak lagi di-fetch di halaman buat dan list sesi DCS/WCP.
  Fetch jabatan tetap ada di halaman detail sesi (untuk auto-fill label jabatan di form TambahResponden).

### [2026-06-21] DCS & WCP: Kuesioner berbasis Assignment

- Halaman `/kuesioner` hanya menampilkan DCS/WCP yang sudah di-assign admin
  (endpoint `GET /kuesioner/saya` tidak lagi auto-enroll berdasarkan jabatan).
- Alur admin: buat sesi → buka sesi → tambahkan responden per partisipan via
  halaman detail sesi (`/dcs/{sesi_id}` atau `/wcp/{sesi_id}`).
- Setiap alat ukur (DCS, WCP) dapat di-assign secara mandiri.
- Task Inventory tidak berubah (sudah assignment manual sebelumnya).

## Jangan Sentuh

- `src/lib/api/schema.ts` — di-generate `npm run gen:api` dari `openapi/openapi.json`; edit manual akan tertimpa.
- `docs-usage/` dan `mkdocs-usage.yml` — milik skill `dokumentasi-penggunaan`; update docs saat fitur berubah.
- Cookie sesi Auth.js — jangan baca/tulis dari kode aplikasi; biarkan Auth.js yang mengelola.

## Gotcha

- `npm run gen:api` butuh file `openapi/openapi.json` dari backend; tanpa file itu perintah gagal.
- `NEXT_PUBLIC_API_BASE_URL` wajib di-set di `.env.local`; tanpa itu klien API tidak bisa terhubung ke backend.
- `AUTHENTIK_*` (issuer, client*id) untuk Auth.js ada di env **server** (tanpa `NEXT_PUBLIC*`) — jangan expose ke klien.
- `next build` dengan `output: "standalone"` menghasilkan folder `.next/standalone/` — image Docker menyalin folder itu, bukan seluruh `node_modules`.
- Redirect URI untuk callback OIDC (`/api/auth/callback/authentik`) wajib didaftarkan di Authentik sebelum login bisa berjalan.

## Alur Kerja & Definition of Done

- Sebelum lapor selesai: `make test` hijau (lint + unit) **dan** `npm run build` sukses. Branch utama: `master`.
- Perubahan fitur/layar UI → update `docs-usage/` di sesi yang sama (`dokumentasi-penggunaan-skill`).
- Commit/branch/PR/tag → skill `git-workflow`; eksekusi `gh` → skill `github-cli-skill`.
- Gate test → skill `automated-test`; docstring (TSDoc) → skill `docstring`; README → skill `readme`.

## Delegasi Skill

| Tugas                                                                                     | Skill                                                                  |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Scaffold frontend Next.js (App Router, klien API bertipe, auth seam, Tailwind, shadcn/ui) | `frontend-development-skill`                                           |
| Mengisi seam autentikasi sisi klien (Auth.js OIDC Authentik, PKCE, Bearer ke backend)     | `backend-authentik-skill` (auth klien berpasangan dengan auth backend) |
| Gate test (lint + unit, Makefile + Docker, lokal == CI, Node.js/TS preset)                | `automated-test-skill`                                                 |
| Dokumentasi penggunaan untuk pengguna akhir (Material for MkDocs, `docs-usage/`)          | `dokumentasi-penggunaan-skill`                                         |
| Docstring komponen/hook/fungsi (TSDoc, Docusaurus + TypeDoc)                              | `docstring-skill`                                                      |
| README.md (pintu depan repo)                                                              | `readme-skill`                                                         |
| Commit, branch, PR, tag/release semver, changelog                                         | `git-workflow-skill`                                                   |
| Eksekusi perintah `gh` (PR, release, Actions)                                             | `github-cli-skill`                                                     |
| Orkestrasi deploy (Docker Compose + Traefik, env runtime)                                 | `copier-docker-compose-skill`                                          |
