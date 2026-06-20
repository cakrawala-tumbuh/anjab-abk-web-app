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
