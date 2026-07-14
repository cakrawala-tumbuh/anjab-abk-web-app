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
- **Jalur BACA DILARANG menelan kegagalan API menjadi kekosongan — dalam ejaan APA PUN.**
  Yang dilarang bukan satu ejaan, melainkan **polanya**: `res.data ?? []`, `res.data ?? null`,
  `res.data?.items ?? []`, `res.data?.items?.[0] ?? null`, `?? ([] as Foo[])`, dan variasi lain
  yang mengubah respons gagal (401/403/5xx) menjadi array/objek kosong. Kekosongan hasil kegagalan
  tidak terbedakan dari kekosongan yang sah, sehingga halaman merender daftar/dropdown/formulir
  kosong yang tampak sah — itu _notifikasi bohong_, sama terlarangnya dengan toast sukses palsu
  (backlog 017 → 026 → 029 → 031). Yang benar: `if (!res.data) throw apiErrorDari(res);`
  - **Larangan ini mencakup data PENDUKUNG**, bukan hanya data inti. Daftar yang "cuma" mengisi
    dropdown atau melabeli ID (jabatan, sekolah, partisipan, tugas pokok) **tetap tidak boleh
    gagal secara senyap** — dropdown kosong karena 401 membuat admin menyimpulkan "master data
    belum diisi" lalu membuat duplikat, dan menyimpan formulir edit dengan pilihan yang hilang
    akan **menghapus relasi yang sudah ada**. Cakupan 026 yang berhenti di data inti adalah
    persis celah yang harus ditambal backlog 031 (29 kemunculan).
  - **Data pendukung boleh tidak menggagalkan halaman — tapi wajib TERLIHAT.** Bila data intinya
    sukses dan yang gagal hanya pelabelan, pakai `pendukungList`/`bagianGagal`
    (`src/lib/api/pendukung.ts`) + render `<GagalMuatSebagian>` (`src/components/gagal-muat.tsx`).
    Bila daftar itu **satu-satunya sumber pilihan sebuah formulir**, perlakukan sebagai data inti
    dan **lempar**.
  - **Pengecualian** hanya untuk data yang ketiadaannya memang jawaban SAH dari backend (mis.
    `GET /partisipan/saya` 404 untuk admin non-partisipan; `GET .../seleksi` 404 saat responden
    belum pernah menyimpan pilihan) — dan hanya **404** yang boleh ditoleransi, sisanya tetap
    melempar. Pengecualian baru wajib didaftarkan di `PENGECUALIAN`
    (`src/test/jaring-pengaman-jalur-baca.test.ts`) agar terlihat di review.
  - **Jaring pengaman**: `src/test/jaring-pengaman-jalur-baca.test.ts` menegakkan semua ejaan di
    atas otomatis. **Jangan** mengandalkan grep sekali-pakai — pola ini kembali tiga kali justru
    karena tiap pemberantasan hanya mengejar satu ejaan.
- **Semua panggilan backend lewat `withServerAuth(accessToken)` — termasuk dari Client
  Component.** Klien tanpa Bearer sengaja tidak tersedia (`src/lib/api/client.ts` tidak lagi
  mengekspor `api`): seluruh endpoint backend, termasuk endpoint BACA, menuntut token.
  Di Client Component, `accessToken` diteruskan sebagai prop dari Server Component induknya.
- **Jalur BACA di Client Component (`useEffect`) tunduk pada invariant yang sama**: gagal harus
  melempar (`if (!res.data) throw apiErrorDari(res);`), dilaporkan lewat **`notifyGagal`** (bukan
  `GagalMuat` — komponen ini tidak dirender di server), dan state _gagal-muat_ **wajib terbedakan**
  dari state _kosong yang sah_. Dilarang `.catch(() => setX([]))` (lihat backlog 029).
- Token akses **tidak** disimpan di `localStorage`; pakai sesi Auth.js (cookie httpOnly).
- Env klien wajib berprefiks `NEXT_PUBLIC_`; env server (tanpa prefiks) tidak boleh terekspos ke klien.
- Setiap route wajib punya `loading.tsx` dan `error.tsx`.
- Komponen shadcn/ui di-copy ke `src/components/ui/` dan dimiliki project — boleh dimodifikasi.
- `src/lib/api/schema.ts` adalah artefak generate — regenerate dengan `npm run gen:api`, jangan edit tangan.

## Revisi Desain

### [2026-07-14] Data PENDUKUNG (dropdown & label) ikut dilarang menelan kegagalan; jaring pengaman menggantikan grep

Backlog 026 memberantas `?? []` di jalur baca **data inti**; 031 menutup sisanya: **29
kemunculan** di jalur **data pendukung** — daftar yang mengisi dropdown & melabeli ID.
Dampaknya lebih halus dari 026/029 (yang hilang adalah _pilihan_ dan _keterbacaan_,
bukan data tersimpan), tapi konsekuensinya serius: dropdown jabatan kosong karena 401
membuat admin menyimpulkan "master data belum diisi" lalu membuat duplikat.

- **Klasifikasi, bukan pukul rata.** Tiap kemunculan dinilai per kasus:
  1. **Pendukung → formulir/dropdown** (20 kemunculan, 12 berkas) → **melempar**
     `apiErrorDari(res)`. Ini bukan sekadar kosmetik: menyimpan formulir edit dengan
     pilihan yang hilang **menghapus relasi yang sudah ada** (mis. `jabatan_ids` tugas
     pokok, jabatan tambahan partisipan).
  2. **Pendukung → pelabelan saja** (halaman daftar `/time-study`, `/partisipan`,
     `/master-data/sme-panel`) → **halaman tetap dirender**, kegagalannya ditampilkan
     lewat `<GagalMuatSebagian>`. Panel itu menyatakan eksplisit bahwa daftar yang tampak
     kosong **bukan** berarti datanya belum ada.
  3. **`data.items ?? []` SETELAH guard `if (!res.data) throw`** → default field opsional
     envelope, bukan penelanan. Dibiarkan.
- Kode bersama baru: `src/lib/api/pendukung.ts` (`pendukungList`, `bagianGagal`,
  tipe `BagianGagal`) + `GagalMuatSebagian` di `src/components/gagal-muat.tsx`.
- **Grep sekali-pakai ditinggalkan, diganti jaring pengaman otomatis**
  (`src/test/jaring-pengaman-jalur-baca.test.ts`). Pola ini kembali tiga kali (017 → 026 → 029) justru karena tiap pemberantasan hanya mengejar **satu ejaan**: grep 026
  (`\.data \?\? \[\]`) tidak menangkap `\.data\?\.items \?\? \[\]`. Jaring baru memindai
  seluruh `src/` untuk **semua** ejaan sekaligus — dan langsung membuktikan dirinya dengan
  menangkap **ejaan keempat** yang lolos dari audit manual backlog 031 sendiri:
  `?? ([] as SekolahRead[])` di `partisipan/tambah/page.tsx`. Pengecualian hanya lewat
  daftar `PENGECUALIAN` yang eksplisit (kini berisi satu entri: `/partisipan/saya`).
- Jalur baca yang disentuh dimigrasikan `toApiError(null, reqId)` → `apiErrorDari(res)`.
  **Catatan utang**: ±20 berkas baca lain masih memakai `toApiError(null, …)` — mereka
  **melempar** (tidak menelan), jadi di luar cakupan 031, tapi membuang pesan backend &
  status HTTP. Layak diseragamkan menyusul.
- Detail keputusan: `backlog/031-web-app-telan-senyap-data-pendukung.md` di repo induk.

### [2026-07-14] Form "Mulai Analisis Jabatan" (TI & OPM) sadar jumlah anggota SME panel

Backend menolak keras (422) pembuatan sesi bila jumlah anggota SME panel melebihi
`max_responden` (OPM sejak lama; TI sejak backlog 028). Form tidak menampilkan jumlah
anggota panel sama sekali → admin mengisi `max_responden` (default 10) secara buta lalu
ditolak, tanpa pernah tahu panelnya berisi 11 orang.

- **Jumlah anggota SME panel ditampilkan begitu jabatan dipilih**, dan `max_responden`
  **di-prefill** sebesar jumlah itu (`setValue` di `useEffect` yang bergantung pada
  `jabatan_id`). **Bukan** validasi klien yang menolak submit — prefill tidak menambah
  gesekan, dan angkanya tetap milik admin.
- **Default `max_responden` DILARANG dinaikkan sebagai "perbaikan"** — itu menyembunyikan
  masalahnya (admin tetap tidak tahu ukuran panelnya), bukan menyelesaikannya.
- Jabatan **tanpa** SME panel tetap sah (sesi dibuat kosong) — submit tidak diblokir,
  hanya ditampilkan "Jabatan ini belum punya SME panel".
- Pesan 422 backend (menyebut kedua angka) wajib tampil **utuh** lewat `notifyGagal` —
  jangan diganti pesan generik.
- Kode bersama: `src/lib/sme-panel.ts` (peta `jabatan_id` → jumlah anggota; panel unik per
  jabatan di backend) + `src/components/sme-panel-info.tsx`, dipakai identik TI & OPM.
- Detail keputusan: `backlog/030-web-app-form-max-responden-sadar-panel.md` di repo induk.

### [2026-07-14] Klien `api` tanpa Bearer dihapus; jalur baca Client Component ikut dilarang menelan error

Backlog 025 (backend) memasang guard auth di seluruh endpoint baca. Audit menemukan **satu**
call site di web app yang memanggil `GET /api/v1/partisipan` dengan klien `api` **telanjang**
(tanpa Bearer) — `AnggotaSection` di `master-data/sme-panel/[id]/anggota-form.tsx`, satu-satunya
panggilan API dari **browser** (`useEffect`). Kegagalannya ditelan dua kali
(`data?.items ?? []` **dan** `.catch(() => setPartisipanList([]))`), sehingga 401 akan tampil
sebagai **"Belum ada anggota"** pada panel yang sebenarnya berisi.

- **`api` (klien tanpa middleware Bearer) dihapus dari `src/lib/api/client.ts`.** Setelah call
  site itu diperbaiki, pemakaiannya nol — dan tidak boleh ada lagi: seluruh endpoint backend,
  termasuk endpoint baca, menuntut token. `withServerAuth(accessToken)` adalah satu-satunya pintu.
- **Invariant jalur baca (026) berlaku juga di Client Component**, dengan satu beda: pelaporan
  gagalnya lewat **`notifyGagal`** (toast + `X-Request-ID`), **bukan** `GagalMuat` — komponen ini
  tidak dirender di server. State _gagal-muat_ disimpan terpisah (`gagalMuat`) dan merender panel
  error; ia **tidak boleh** jatuh ke daftar kosong yang tak terbedakan dari "memang belum ada
  anggota".
- **Urutan rilis mengikat**: backend ber-guard 025 tidak boleh di-deploy tanpa perubahan ini.
  Web app boleh lebih dulu — mengirim token ke endpoint yang belum menuntutnya tetap aman.
- Jaring pengaman: `grep -rnE "(^|[^.a-zA-Z])api\.(GET|POST|PATCH|PUT|DELETE)" src` → nol hasil;
  `grep -rn "catch(() => set" src` → nol hasil.
- Detail keputusan & konteks: `backlog/029-web-app-sme-panel-anggota-form-tanpa-token.md`
  di repo induk `anjab-abk`.

### [2026-07-14] Jalur baca Server Component: `?? []` dilarang untuk data kritis — gagal harus melempar

Perpanjangan backlog 017 (di bawah) ke jalur **baca**. Halaman Tahap 3 mengambil
daftar task dengan `(ttRes.data ?? []) as TiTaskTerpilihRead[]` — respons gagal apa
pun (401/403/422/500) menjadi array kosong, dan halaman merender "Ditandai
dikerjakan: **0 dari 0 task**" dengan formulir kosong tanpa pesan error apa pun.
Terreproduksi di produksi YPII: sesi TI dengan 19 task terpilih tampil sebagai
"0 task" untuk **seluruh 7 responden**, tanpa satu pun petunjuk kesalahan.

- **Invariant** (lihat juga Konvensi di atas): jalur baca Server Component memakai
  `if (!res.data) throw apiErrorDari(res);`. **Dilarang `?? []` / `?? null` untuk
  data kritis.** Jaring pengaman: `grep -rn "\.data ?? \[\]" src/app` → nol hasil.
- `apiErrorDari(res)` (`src/lib/api/errors.ts`) adalah pintu wajibnya — membangun
  `ApiError` lengkap dengan pesan backend, **status HTTP** (field baru
  `ApiError.status`), dan `X-Request-ID`. Pola lama `toApiError(null, reqId)`
  membuang pesan backend dan status; jangan dipakai lagi di jalur baca.
- **Kegagalan yang dikenali (`ApiError`) dirender DI SERVER**, bukan dilempar ke
  `error.tsx`: Next.js **menyensor `error.message`** dari error Server Component
  sebelum sampai ke error boundary (produksi hanya menerima pesan generik +
  `digest`), sehingga `X-Request-ID` **mustahil** ditampilkan dari sana. Komponen
  `GagalMuat` & `TidakBerhak` (`src/components/gagal-muat.tsx`) dipakai halaman
  Tahap 1 & Tahap 3; error **tak dikenal** tetap dilempar ke `error.tsx`.
  403 non-pemilik kini jadi halaman "tidak berhak" yang rapi (dulu: digest React mentah).
- **Bedakan tiga kondisi** — jangan gabungkan:
  1. Prasyarat status belum terpenuhi → **jangan panggil endpoint-nya** (backend
     menolak 422). Pola: `if (["TAHAP3","CLOSED","ANALYZED"].includes(sesi.status))`.
  2. Panggilan sukses tapi hasilnya **benar-benar kosong** → kondisi SAH, tampilkan
     pesan eksplisit. Mis. 0 task final di Tahap 3 (`detail-form.tsx`): pesan
     "Tidak ada task final…" + tombol "Kirim Detail" nonaktif — **bukan** formulir kosong.
  3. Panggilan **gagal** (4xx/5xx) → lempar.
- **Pengecualian yang disengaja** (404 = jawaban sah, bukan kegagalan): `GET
/partisipan/saya` untuk admin non-partisipan, dan `GET .../seleksi` pada kunjungan
  pertama Tahap 1 (backend melempar `NotFound` bila responden belum pernah menyimpan
  pilihan — melempar di sini akan mematikan seluruh alur normal Tahap 1). Hanya **404**
  yang ditoleransi di dua tempat itu; 401/403/5xx tetap melempar.
- `fetchPageData` Tahap 1 & Tahap 3 dipindah ke `data.ts` masing-masing supaya bisa
  diuji langsung — berkas route Next.js (`page.tsx`) tidak boleh mengekspor fungsi
  sembarang (`next build` menolaknya).
- Detail keputusan & konteks temuan: `backlog/026-web-app-error-api-ditelan-senyap.md`
  di repo induk `anjab-abk`.

### [2026-07-14] DCS & WCP: konfirmasi `confirm()` sebelum "Jalankan Analisis"

Ditemukan saat simulasi SOP Persiapan+Pelaksanaan DCS & WCP end-to-end di instance
produksi YPII: tombol **"Jalankan Analisis"** (`doAnalisis()` di
`src/app/(auth)/dcs/aksi-instrumen.tsx` dan `src/app/(auth)/wcp/aksi-instrumen.tsx`)
mengeksekusi aksi paling ireversibel di seluruh alur (instrumen `CLOSED → ANALYZED`,
tidak bisa dibuka ulang lagi) tanpa dialog konfirmasi apa pun — berbeda dari `doTutup()`
di komponen yang sama yang sudah memakai `confirm()`.

- Guard `if (!confirm(...)) return;` ditambahkan sebagai baris pertama `doAnalisis()`
  di kedua file, pola identik `doTutup()`. Teks pesan beda kalimat per alat ukur: DCS
  `"Jalankan analisis DCS? Setelah analisis berhasil, instrumen TIDAK DAPAT dibuka ulang
lagi."`, WCP versi serupa dengan kata "WCP".
- **Tidak ada perubahan lain** ke `doAnalisis()` — struktur `try/catch` tanpa `finally`
  yang sudah ada (sengaja beda dari `doTutup()`: `setLoading(false)` hanya dipanggil
  manual di `catch`, jalur sukses langsung `router.push()` tanpa reset loading) tetap
  dipertahankan.
- Test baru dari nol (sebelumnya tidak ada test untuk `aksi-instrumen` DCS maupun WCP):
  `src/test/dcs-aksi-instrumen.test.tsx`, `src/test/wcp-aksi-instrumen.test.tsx` — pola
  mocking `useRouter`/`withServerAuth` mengikuti `transisi-sesi.test.tsx` &
  `dcs-assign-responden.test.tsx`. Minimal 2 test per file: Cancel tidak memanggil
  `POST`/`push` sama sekali; OK melanjutkan alur (`POST` endpoint benar → `push` ke
  halaman hasil).
- Detail keputusan & konteks temuan: `backlog/021-web-app-konfirmasi-jalankan-analisis-dcs-wcp.md`
  di repo induk `anjab-abk`.

### [2026-07-14] Notifikasi toast terpusat (`sonner`) — satu-satunya pintu ke user untuk hasil simpan data

Audit atas ~55 call site mutasi (POST/PATCH/PUT/DELETE) di 49 berkas menemukan bahwa
keberhasilan hampir tidak pernah dikonfirmasi ke user (hanya 6 dari ~55 punya pesan
sukses eksplisit — sisanya mengandalkan `router.push`/`router.refresh()` yang tidak
terlihat bila layar tidak berubah), sementara kegagalan dilaporkan lewat 4 mekanisme
berbeda yang tidak konsisten (`form-server-error`, `bg-red-50`, `<p className="text-red-600">`,
`alert()` browser) — plus beberapa kasus notifikasi yang **salah** (error ditelan, pesan
sukses bohong tentang data yang sebenarnya tidak lengkap tersimpan, banner yang tidak
pernah muncul karena stale prop, stale closure di `catch`).

- **`sonner`** dipasang sebagai **satu-satunya** mekanisme toast di seluruh app.
  `<Toaster position="top-right" richColors closeButton />` dirender di
  `src/app/providers.tsx`, di dalam `ThemeProvider` (toast ikut tema light/dark) tapi di
  luar `{children}`.
- **`src/lib/notify.ts`** adalah **satu-satunya pintu** ke `toast.*` — komponen **dilarang**
  memanggil `toast.success`/`toast.error` dari `sonner` secara langsung.
  - `notifySukses(pesan: string)` — toast sukses, durasi bawaan sonner (4 detik).
  - `notifyGagal(err: unknown)` — toast error, **`duration: Infinity`** (tidak hilang
    sendiri, user harus menutupnya manual lewat `closeButton`), menampilkan
    `X-Request-ID` (`ApiError.requestId`) di deskripsi toast bila tersedia, supaya user
    bisa menyebutkannya saat lapor masalah.
  - `pesanGagal(err: unknown): string` — ekstrak pesan siap-tampil dari error apa pun;
    dipakai bersama untuk mengisi error inline (`setServerError(pesanGagal(err))`) supaya
    logika `err instanceof Error ? err.message : "…"` tidak terduplikasi di tiap komponen.
- **Toast bersifat tambahan, bukan pengganti.** Form panjang (tahap1/2/3 Task Inventory,
  isi DCS/WCP/OPM, semua form master-data) **tetap mempertahankan** error inline
  (`form-server-error`, `role="alert"`, dll.) — pesan error di form panjang tidak boleh
  hilang sendiri setelah 4 detik. Pola standar: `setServerError(pesanGagal(err))` **dan**
  `notifyGagal(err)` berdampingan di `catch` yang sama.
- **`alert()` browser dilarang total** — satu-satunya cara melaporkan kegagalan ke user
  adalah `notifyGagal(err)`.
- **Setiap call site mutasi WAJIB memanggil `notifySukses(...)` pada jalur sukses**
  (sebelum `router.push`/`router.refresh()` — toast bertahan lintas navigasi App Router)
  **dan** `notifyGagal(err)` pada jalur gagal, tanpa kecuali. Panel sukses yang sudah ada
  dan memuat detail yang tidak muat di toast (mis. ringkasan `created`/`skipped` di
  `assign-responden-banyak.tsx`/`ts-penugasan-bulk-form.tsx`, panel hijau submit
  kuesioner) **tetap dipertahankan** — toast ditambahkan berdampingan.
- Test: `sonner` di-mock global di `vitest.setup.ts`
  (`vi.mock("sonner", () => ({ toast: {...}, Toaster: () => null }))`) — test
  memverifikasi notifikasi lewat assertion pada `toast.success`/`toast.error` (via mock),
  bukan lewat DOM toast yang dirender lewat portal. Lihat `src/test/notify.test.ts` untuk
  test unit helper, dan `src/test/*.test.tsx` per komponen untuk test regresi per call site.
- **Jaring pengaman permanen** (jalankan sebelum lapor selesai pada perubahan yang
  menyentuh mutasi baru): `grep -rn "alert(" src/app` → nol hasil (kecuali
  `role="alert"`/`confirm(`); `grep -rn "toast" src/app` → nol hasil (semua lewat helper
  `notify*`, bukan `toast.*` langsung).

### [2026-07-13] Editor item DCS/WCP: cermin `useState` dibuang, data dipasok Server Component + `router.refresh()`

Tombol "Simpan" di editor item `/master-data/dcs/{kode}` dan `/master-data/wcp/{kode}`
mem-`PATCH` item ke backend, tapi hanya menambal salinan lokal `useState` (`rows`) — satu-
satunya komponen mutasi di seluruh web app yang tidak memanggil `router.refresh()`.
Akibatnya perubahan `urutan` tidak pernah terlihat: backend mengurutkan item berdasarkan
kolom itu, tapi tabel tidak di-render ulang.

- Perbaikannya **bukan** sekadar menambahkan `router.refresh()` di samping `setRows(...)`.
  State `rows` yang di-seed dari prop sekali saja dibuang total — tabel dirender **langsung
  dari prop `items`**, dan `router.refresh()` (dipanggil setelah PATCH sukses) yang memasok
  data segarnya. Ini pola standar 46+ tempat lain di repo (Server Component + `router.refresh()`).
- **Pola cermin-state (`useState` yang di-seed dari prop lalu jadi sumber render) dilarang
  diperkenalkan lagi di komponen baru** — state itu tidak pernah tersinkron ulang dengan
  server kecuali eksplisit di-refresh, dan mudah luput karena hasil PATCH/POST _terlihat_
  ter-update di layar (state lokal ditambal dari respons), padahal sumber kebenarannya
  (urutan, field lain yang diubah proses lain) sudah melenceng.
- `hapus-penugasan.tsx` (Time Study) diseragamkan: `router.refresh()` ditambahkan setelah
  `router.push()`, konsisten dengan tombol hapus Master Data lainnya — sebelumnya "bekerja"
  karena Router Cache mati (`staleTimes: 0`), bukan karena eksplisit benar.

### [2026-07-13] Logout: dari `<Link>` GET menjadi `<form method="post">` — GET punya efek samping

Temuan simulasi end-to-end deployment YPII: `matcher` middleware tidak mengecualikan
aset publik PWA (manifest/sw.js/ikon), dan `<Link href="/api/auth/logout">` di top bar
di-prefetch Next.js secara pasif setiap page load.

- **Middleware** (`src/middleware.ts`): `config.matcher` ditambah pengecualian
  `manifest.webmanifest`, `sw.js`, `favicon.svg`, `icon.svg`. Pola yang sama
  **diduplikasi** (bukan diimpor) di `src/lib/middleware/matcher.ts` khusus untuk unit
  test — Next.js mewajibkan `config.matcher` middleware berupa **literal statis**;
  mereferensikan konstanta dari modul lain membuat `next build` gagal ("Next.js can't
  recognize the exported `config` field"). Bila pola berubah, sinkronkan kedua tempat.
- **Logout** (`src/app/api/auth/logout/route.ts`, `src/components/shell/top-bar.tsx`):
  investigasi menemukan `GET /api/auth/logout` **destruktif** (hapus cookie sesi +
  redirect ke `end-session` Authentik yang meng-invalidate SSO) — `prefetch={false}` saja
  tidak cukup untuk mengamankannya dari navigasi pasif. Route handler diubah jadi
  **`POST`-only** (logika RP-initiated logout tidak berubah, hanya method); tombol
  "Keluar" diubah dari `<Link>` menjadi `<form action="/api/auth/logout" method="post">`
  dengan tombol submit bergaya link. `GET` **tidak dipertahankan** — bukan callback
  provider OAuth, jadi tidak ada alasan untuk tetap menerima navigasi pasif.
  `e2e/auth.spec.ts` disesuaikan (assertion `role="link"` → `role="button"` untuk
  "Keluar", ditambah test regresi "tidak ada GET pasif ke /api/auth/logout").

### [2026-07-13] Task Inventory: kontrol "paksa" transisi jadi checkbox eksplisit (bukan Cancel)

Temuan simulasi end-to-end deployment YPII: pola lama `const paksa = !confirm(...)` di
`transisi-sesi.tsx` membuat menekan **Cancel** pada dialog "Mulai Tahap 2"/"Mulai Tahap 3"
justru **memaksa** transisi berjalan — berbahaya untuk aksi yang tidak bisa dibatalkan.
Bentuk kontrol berubah signifikan:

- `confirm()` sekarang hanya menjawab lanjut/batal. Cancel → `return`, tidak ada
  panggilan API sama sekali.
- Mode paksa menjadi **state komponen** (`paksaTahap2`/`paksaTahap3`, `useState`),
  dikendalikan checkbox terpisah yang **hanya dirender saat memang relevan**: checkbox
  "Lanjutkan walau … belum submit Tahap 1" muncul hanya bila `belumSubmitTahap1 > 0`;
  checkbox "Lanjutkan walau … belum diputuskan koordinator" muncul hanya bila
  `belumDiputuskanTahap2 > 0`. Kedua angka ini prop baru `TransisiSesi` yang dipasok
  dari `[sesi_id]/page.tsx` — `belumSubmitTahap1` dari data `responden` yang sudah
  di-fetch di halaman itu (tanpa panggilan API tambahan), `belumDiputuskanTahap2` dari
  panggilan baru ke `GET /task-inventory/sesi/{sesi_id}/tahap2` (pola conditional-fetch
  yang sama dengan `taskTerpilih`/`hasil`, hanya dipanggil saat `status === "TAHAP2"`).
- Duplikasi try/catch pemanggilan POST Tahap 2 & Tahap 3 disatukan ke satu helper
  `post()` (overload: tanpa `paksa` untuk mulai-tahap1/tutup/analisis, dengan `paksa:
boolean` wajib untuk mulai-tahap2/mulai-tahap3).

### [2026-07-13] UI penugasan massal (bulk) Time Study, Task Inventory, OPM

Mengikuti endpoint bulk-assign baru di backend (`anjab-abk-backend`, lihat entri
`[2026-07-13]` di `CLAUDE.md` backend) — TS, TI, OPM tidak seperti DCS/WCP:
endpoint **single tetap ada**, jadi form bulk ditambahkan **berdampingan**, bukan
menggantikan (`tambah-responden.tsx`/`ts-penugasan-form.tsx` tidak disentuh).

- **Komponen baru**: `task-inventory/[sesi_id]/assign-responden-banyak.tsx`,
  `opm/[sesi_id]/assign-responden-banyak.tsx` (checkbox multi-select, pola sama
  dengan `wcp/assign-responden.tsx`) — dirender setelah form single yang sudah
  ada di halaman detail sesi masing-masing, guard status sama (TI: DRAFT/TAHAP1;
  OPM: DRAFT/OPEN).
- **Halaman baru**: `/time-study/tugaskan-banyak` (TS tidak punya form kedua di
  halaman yang sama — assign selalu di halaman terpisah). Filter partisipan =
  belum punya `TsPenugasanRead` aktif.
- **Response bulk BUKAN array datar** seperti WCP/DCS, melainkan
  `{created: T[], skipped: [{partisipan_id, alasan}]}` — UI wajib menampilkan
  ringkasan setelah submit (jumlah berhasil + daftar dilewati dengan alasan
  berbahasa Indonesia). Mapping kode → label di `src/lib/format/bulk-skip-alasan.ts`,
  dipakai identik di ketiga komponen baru.
- **`src/lib/api/schema.ts` — perhatikan nama tipe generic Pydantic setelah
  `gen:api`**: `BulkAssignResult[T]` di-generate sebagai
  `BulkAssignResult_TsPenugasanRead_`/`BulkAssignResult_TiRespondenRead_`/
  `BulkAssignResult_OpmRespondenRead_` (openapi-typescript menyuffix nama
  generic dengan parameter tipenya) — di-alias di convenience re-exports
  akhir file menjadi `TsPenugasanBulkResult`/`TiRespondenBulkResult`/
  `OpmRespondenBulkResult` (lebih ergonomis dipakai di komponen).
- **Daftar partisipan checkbox TI/OPM** memakai filter yang SAMA dengan prop
  yang sudah diteruskan ke form single (anggota SME panel, untuk OPM dikurangi
  yang sudah jadi responden) — tidak ada filter tambahan di komponen bulk.

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
