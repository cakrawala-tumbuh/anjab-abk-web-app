# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

## [4.6.2] - 2026-07-20

### Diperbaiki

- **Task Inventory Tahap 3: durasi standar tidak lagi diprefill 60 menit palsu** (issue #22).
  Saat "Setuju dengan isian standar" dicentang, field `Durasi/kali (menit)` sebelumnya selalu
  terisi angka 60 hard-code, padahal petunjuk standarnya berbeda-beda per task ("<15 menit",
  "1-2 jam", dst. — teks bebas, bukan angka). Keputusan produk (Opsi A, dicatat di komentar
  issue): durasi **tidak lagi diprefill** (kosong, wajib diisi responden) dan karena itu **tetap
  dapat diedit** meski field sibling lain (`Sumber Bukti`, `Kondisi`, `Frekuensi`, `Jam/minggu`,
  `Jam peak`, `VA Type`) terkunci — ditandai penjelas "wajib diisi manual" di UI. Draft/kirim
  ditolak bila durasi belum diisi.
- **Jalur baca mempertahankan pesan & status backend, bukan lagi dibuang** (issue #21). 24
  berkas jalur baca Server Component (32 kemunculan) masih memakai pola lama `toApiError(null,
reqId)` — membuang pesan error backend **dan** status HTTP-nya sekaligus, sehingga pengguna
  melihat pesan generik dan kode pemanggil tidak bisa membedakan 401/403/500. Seluruhnya
  dimigrasikan ke `apiErrorDari(res)` (sudah dipakai di jalur yang tersentuh backlog
  026/029/031) yang mempertahankan pesan backend, `status`, dan `X-Request-ID` secara utuh.
  - **Pengecualian Tahap 2** (`task-inventory/tahap2/[sesi_id]/page.tsx`): `GET
/partisipan/saya` sebelumnya menelan **semua** status jadi `null` (didaftarkan sebagai
    pengecualian sah untuk 404, tapi implementasinya tidak sesempit itu — 401 pun ikut jadi
    `null`). Kini eksplisit: hanya 404 yang jatuh ke `null`; 401/403/5xx tetap melempar seperti
    data kritis lain di halaman.
  - `toApiError` **dipertahankan** (masih dipakai sah di jalur mutasi/tulis di seluruh app) —
    hanya pemakaian jalur baca yang dicabut.

## [4.6.1] - 2026-07-19

### Diperbaiki

- **403/500 dari backend tidak lagi tampil sebagai crash "Server Components render"** (backlog
  035 / issue #23). Setelah backlog 026/031 menghentikan penelanan-senyap error API, lemparan
  yang tidak tertangkap oleh panel ramah muncul sebagai pesan mentah Next.js yang menyensor
  `X-Request-ID`. Dua perbaikan:
  - **Tahap 2 Task Inventory** (`task-inventory/tahap2/[sesi_id]/page.tsx`) dan **isi kuesioner
    OPM** (`opm/isi/[responden_id]/page.tsx`): `ApiError` ber-`status === 403` (partisipan bukan
    anggota panel / bukan pemilik responden) kini ditangkap dan dirender sebagai panel "Tidak
    berwenang" — status lain tetap dilempar apa adanya. Halaman Tahap 1/Tahap 3 sudah benar
    sejak backlog 026, tidak disentuh.
  - **Detail sesi Task Inventory** (`task-inventory/[sesi_id]/page.tsx`): kegagalan
    `task-terpilih`/`hasil` (mis. bug backend backlog 024) tidak lagi mematikan seluruh halaman —
    header dan panel aksi admin (termasuk tombol "Hapus paksa analisis", satu-satunya jalan
    keluar admin dari sesi rusak) tetap terender; kegagalannya ditampilkan lewat
    `GagalMuatSebagian`, bukan ditelan.

## [4.6.0] - 2026-07-18

### Ditambahkan

- **Widget helpdesk Chatwoot "Butuh Bantuan?"** (backlog 025 di `anjab-abk-web-app`) — launcher
  live-chat di semua halaman terautentikasi, menyuntik SDK resmi Chatwoot lewat komponen Client
  baru `src/components/chatwoot-widget.tsx` (pola `pwa-register.tsx`). Dikonfigurasi lewat env
  publik `NEXT_PUBLIC_CHATWOOT_BASE_URL`/`NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` — kosong berarti
  fitur mati diam tanpa error. Identify user (`setUser`) aktif: nama & email dari sesi Auth.js
  diteruskan sebagai prop dari `(auth)/layout.tsx`, dipanggil saat event `chatwoot:ready`. Tidak
  tampil di halaman `/login`. `Dockerfile`/`docker-entrypoint.sh` diperluas agar kedua env bisa
  diganti di **runtime deployment** (tanpa rebuild image), konsisten dengan pola
  `NEXT_PUBLIC_API_BASE_URL` yang sudah ada.

## [4.5.0] - 2026-07-16

### Ditambahkan

- **Pop-up "Petunjuk Pengisian" di semua alat ukur** (backlog 049) — pola gaya-DCS diterapkan
  ke **WCP, OPM, Time Study, dan Task Inventory Tahap 1/2/3**. Mekanik modal diekstrak ke
  komponen bersama `src/components/petunjuk-modal.tsx` (hand-rolled, tanpa dependency dialog
  baru); **DCS ikut di-refactor** memakainya tanpa mengubah teks/perilaku. Tiap alat ukur
  punya komponen konten co-located (`petunjuk-wcp/opm/ts/tahap1/tahap2/tahap3.tsx`) dengan
  konten sesuai form-nya (skala/dimensi/kategori/kolom CalHR diambil dari kode aktual). Pop-up
  auto-muncul tiap kunjungan **selama alat ukur masih bisa diisi** (tanpa `localStorage`,
  tanpa "jangan tampilkan lagi"); tombol pemicu selalu terlihat. Form (`*-form.tsx`) tidak
  disentuh.

### Diubah

- Blok header halaman pengisian WCP/OPM/TI-1/TI-2/TI-3 menjadi `flex justify-between` agar
  tombol "Petunjuk Pengisian" berdampingan dengan judul; header Time Study menampung tombol
  petunjuk di samping "+ Tambah Log".

## [4.4.0] - 2026-07-15

### Ditambahkan

- **DCS: pop-up "Petunjuk Pengisian"** di halaman pengisian (`/dcs/isi/{responden_id}`)
  (backlog 046) — komponen baru `petunjuk-dcs.tsx` (hand-rolled, tanpa dependency dialog
  baru), berisi pengantar tiga aspek DCS, aturan umum menjawab, arti skala 1–5, cara
  menjawab, dan dua contoh pengisian non-interaktif. Muncul otomatis setiap kali halaman
  dibuka selama belum submit; dapat dibuka lagi kapan saja lewat tombol "Petunjuk
  Pengisian" yang selalu terlihat. `dcs-form.tsx` tidak disentuh. Lingkup sengaja hanya
  DCS — WCP tidak diubah.

## [4.3.0] - 2026-07-15

### Dihapus

- **Task Inventory Tahap 3: dropdown "AI Mode" & checkbox "Ada risiko DCS" dihapus tuntas**
  (backlog 040, langkah 2 — menyusul backend 039 mencabut `ai_mode`/`dcs_flag` dari kontrak).
  Dua komponen CalHR ini dinilai tidak relevan untuk konteks yayasan pendidikan.
  - `detail-form.tsx` (Tahap 3 partisipan): field, zod, `RowState`, seed dari nilai standar/detail
    tersimpan, dan render `<select>` AI Mode + checkbox "Ada risiko DCS" dicabut seluruhnya.
  - `uraian-tugas-form.tsx` & `[id]/page.tsx` (Master Data → Uraian Tugas, nilai standar
    `std_ai_mode`/`std_dcs_flag`): field, zod, payload submit, dan render dicabut seluruhnya.
  - Tabel **Hasil Agregasi** TI (`[sesi_id]/page.tsx`): kolom "DCS" (`dcs_flag_count`) dihapus.
  - `export const AI_MODE` dicabut dari `src/components/calhr.ts` setelah pemakaiannya nol.

### Diubah

- **Task Inventory Tahap 3: field "Frekuensi" dari input teks bebas menjadi dropdown terkontrol**
  (backlog 040, langkah 1) — 4 opsi: Harian, Mingguan, Semesteran, Insidental. Berlaku identik di
  form partisipan Tahap 3 (`detail-form.tsx`) dan form standar Master Data → Uraian Tugas
  (`uraian-tugas-form.tsx`). `frekuensi_teks`/`std_frekuensi_teks` **tetap `string`** di backend
  (tidak jadi enum) — nilai lama di luar 4 opsi (mis. "Bulanan") tetap tervalidasi dan ditampilkan
  sebagai opsi tambahan di `<select>`, tidak diam-diam berubah. Konstanta `FREKUENSI` didefinisikan
  sekali di `src/components/calhr.ts`.
- **Form "Mulai Analisis Jabatan" Task Inventory: field "Periode" diganti dropdown "Cabang"
  (Bandung/Semarang); "Min. Responden" & "Maks. Responden" dihapus** (backlog 038, menyusul
  perubahan kontrak backend 037). Studi ANJAB/ABK di YPII dijalankan per **cabang**, bukan per
  periode bulanan, dan jumlah responden TI sudah selalu = seluruh anggota SME panel (auto-populate,
  backlog 028) sehingga batas min/maks tidak lagi punya makna operasional.
  - Dropdown **Cabang** wajib dipilih, tepat dua opsi statis (`Bandung`, `Semarang`).
  - Prefill panel-aware `max_responden` (backlog 030) dan komponen `SmePanelInfo` **dicabut dari
    form TI** — tanpa field `max_responden`, teks panduannya jadi menyesatkan. `SmePanelInfo` dan
    `src/lib/sme-panel.ts` **tetap dipakai OPM**, tidak dihapus.
  - Listing `/task-inventory`: kolom "Periode" → "Cabang", nilai sel fallback `s.cabang ?? "—"`
    (dua sesi produksi lama punya `cabang = NULL`, belum di-backfill secara sengaja).
  - Konsekuensi kompilasi di titik lain yang mengonsumsi `TiSesiRead`/`TiKuesionerItemRead`:
    detail sesi TI (`[sesi_id]/page.tsx`), kartu Task Inventory di `/kuesioner`, dan label dropdown
    "Analisis Jabatan Task Inventory (sumber task)" di form OPM — seluruhnya beralih dari
    `periode` ke `cabang ?? "—"` tanpa mengubah perilaku OPM.

## [4.2.0] - 2026-07-14

### Diperbaiki

- **Kegagalan memuat data pendukung (dropdown & label) tidak lagi ditelan senyap** (backlog 031).
  Backlog 026 memberantas pola `?? []` di jalur baca data _inti_, tapi **29 kemunculan** tersisa
  di jalur data _pendukung_ — daftar jabatan, sekolah, partisipan, tugas pokok yang mengisi
  **dropdown** dan **melabeli ID**. Bila fetch-nya gagal (401/403/5xx), halaman tetap dirender
  dengan dropdown kosong yang **tidak terbedakan** dari "master data memang belum diisi" — admin
  bisa menyimpulkan salah lalu membuat duplikat. Nilainya naik tajam setelah backend backlog 025
  menuntut token di **seluruh** endpoint baca: setiap jalur bertoken kedaluwarsa mulai
  mengembalikan 401, dan seluruh titik ini akan menelannya.
  - **Data pendukung yang mengisi formulir/dropdown → melempar** (`apiErrorDari(res)`): 20
    kemunculan di 12 berkas (`partisipan/[id]`, `partisipan/tambah`, `time-study/buat`,
    `time-study/tugaskan-banyak`, `time-study/[penugasan_id]`, `dcs`, `wcp`, `opm/[sesi_id]`,
    `task-inventory/[sesi_id]`, dan `master-data/{tugas-pokok,detil-tugas,uraian-tugas,sme-panel}/*`).
    Dropdown kosong di formulir edit lebih dari sekadar kosmetik: menyimpan form dengan pilihan
    yang hilang **menghapus relasi yang sudah ada**.
  - **Data pendukung yang murni melabeli (halaman daftar) → halaman tetap dirender**, dengan
    **penanda gagal yang terlihat**: komponen baru `GagalMuatSebagian`
    (`src/components/gagal-muat.tsx`) + helper `pendukungList`/`bagianGagal`
    (`src/lib/api/pendukung.ts`). Dipakai di `/time-study`, `/partisipan`,
    `/master-data/sme-panel`. Panel itu menyatakan eksplisit bahwa daftar yang tampak kosong
    **bukan** berarti datanya belum ada, dan menampilkan status + `X-Request-ID`.
  - **Kekosongan yang sah tetap tenang**: respons 200 dengan 0 item → state kosong biasa, tanpa
    error palsu. Dua pengecualian 404 yang dikunci backlog 026 (`GET /partisipan/saya` untuk admin
    non-partisipan; `GET .../seleksi` pada kunjungan pertama Tahap 1) **tidak diregresikan**.
  - **Jaring pengaman permanen**: `src/test/jaring-pengaman-jalur-baca.test.ts` memindai seluruh
    `src/` untuk **semua ejaan** pola telan-senyap sekaligus — `.data ?? []`, `.data ?? null`,
    `.data?.<apa pun> ?? …`, `.catch(() => set…)`, dan klien `api` telanjang. Pola ini terus
    kembali justru karena tiap pemberantasan hanya mengejar satu ejaan: grep backlog 026
    (`\.data \?\? \[\]`) tidak menangkap `\.data\?\.items \?\? \[\]`. Jaring ini langsung
    membuktikan dirinya dengan menangkap **ejaan keempat** yang lolos dari grep audit manual
    backlog 031 sendiri: `?? ([] as SekolahRead[])` di `partisipan/tambah/page.tsx`.
    Pengecualian hanya lewat daftar `PENGECUALIAN` yang eksplisit dan terlihat di review.
  - Jalur baca yang disentuh dimigrasikan dari `toApiError(null, reqId)` (membuang pesan backend
    **dan** status HTTP) ke `apiErrorDari(res)`.

### Ditambahkan

- **Form "Mulai Analisis Jabatan" (Task Inventory & OPM) kini sadar jumlah anggota SME panel**
  (backlog 030). Backend menolak keras (422) pembuatan sesi bila jumlah anggota SME panel
  melebihi `max_responden` — TI sejak backlog 028, OPM sejak lama — tetapi form tidak
  menampilkan jumlah anggota panel sama sekali: admin mengisi **Maks. Responden** (default 10)
  secara buta lalu ditolak, tanpa pernah tahu panelnya berisi 11 orang (kondisi produksi YPII:
  panel _Guru Kelas SD_ = 11 anggota).
  - Begitu **Jabatan** dipilih, form menampilkan jumlah anggota SME panel jabatan itu
    (`SmePanelInfo`, `src/components/sme-panel-info.tsx`) dan **mem-prefill Maks. Responden**
    sebesar jumlah itu — bukan validasi klien yang menolak submit (prefill tidak menambah
    gesekan; angkanya tetap bisa diubah admin).
  - Jabatan **tanpa** SME panel tetap sah (sesi dibuat kosong, responden ditambahkan manual):
    submit tidak diblokir, hanya ditampilkan "Jabatan ini belum punya SME panel".
  - Bila 422 tetap terjadi, pesan backend tampil **utuh** (menyebut kedua angka) lewat
    `notifyGagal` + `X-Request-ID` dan error inline — bukan pesan generik.
  - **Default `max_responden` sengaja TIDAK dinaikkan** — itu hanya menyembunyikan masalah;
    admin tetap tidak akan tahu berapa anggota panelnya.
  - Helper baru `src/lib/sme-panel.ts` (`petaJumlahAnggotaPanel`, `jumlahAnggotaPanel`) dipakai
    identik oleh kedua form. Test baru: `src/test/sme-panel.test.ts`,
    `src/test/ti-sesi-form.test.tsx`, `src/test/opm-sesi-form.test.tsx`.

### Diperbaiki

- **Halaman "Mulai Analisis Jabatan" TI & OPM tidak lagi menelan kegagalan fetch**
  (invariant backlog 026). `src/app/(auth)/opm/buat/page.tsx` memuat SME panel dan daftar sesi TI
  dengan `?? []` — kegagalan API-nya akan tampil sebagai dropdown jabatan kosong dan
  "Belum ada Analisis Jabatan TI yang dibekukan", dua-duanya informasi palsu. Ketiga fetch
  (jabatan, panel, sesi TI) kini `throw apiErrorDari(res)`. `src/app/(auth)/task-inventory/buat/page.tsx`
  ikut dipindahkan dari `toApiError(null, reqId)` ke `apiErrorDari(res)` (pesan backend + status
  HTTP ikut terbawa) saat fetch panel ditambahkan.

- **`AnggotaSection` SME panel: `GET /api/v1/partisipan` kini berautentikasi dan
  kegagalannya tidak lagi ditelan** (backlog 029). Satu-satunya panggilan API dari
  **browser** (`useEffect`) di seluruh app memakai klien `api` **telanjang** — tanpa
  Bearer token. Begitu backend memasang guard auth di endpoint baca (backlog 025 di
  `anjab-abk-backend`), panggilan itu dijawab **401**, dan komponen menelan kegagalannya
  **dua kali** (`data?.items ?? []` **dan** `.catch(() => setPartisipanList([]))`) →
  admin melihat **"Belum ada anggota"** pada SME panel yang sebenarnya berisi, tanpa
  pesan error apa pun. Kelas bug yang sama dengan backlog 017 (mutasi) & 026 (jalur baca
  Server Component); call site ini luput karena ia satu-satunya yang berjalan di klien.
  - `src/app/(auth)/master-data/sme-panel/[id]/anggota-form.tsx`: pemanggilan memakai
    `withServerAuth(accessToken)` — pola yang sudah dipakai tiga handler mutasi tetangganya
    di berkas yang sama (token sudah tersedia sebagai prop). Kegagalan **melempar**
    (`if (!res.data) throw apiErrorDari(res)`), lalu dilaporkan lewat **`notifyGagal`**
    (toast + `X-Request-ID`) — bukan `GagalMuat`, karena ini komponen klien.
  - **State _gagal-muat_ dipisah dari state _kosong_**: kegagalan merender panel merah
    "Gagal memuat data partisipan" (bukan daftar kosong, bukan form tambah anggota), jadi
    tidak bisa lagi disalahartikan sebagai panel yang memang belum punya anggota.
  - `src/lib/api/client.ts`: ekspor `api` (klien **tanpa** middleware Bearer) **dihapus** —
    setelah perbaikan di atas pemakaiannya nol, dan seluruh endpoint backend (termasuk
    endpoint baca) menuntut token. `withServerAuth(accessToken)` kini satu-satunya pintu
    ke backend, sehingga pola telanjang yang sama tidak bisa diperkenalkan lagi.
  - **Urutan rilis mengikat**: backend dengan guard 025 tidak boleh di-deploy tanpa
    perbaikan ini. Web app boleh lebih dulu (mengirim token ke endpoint yang belum
    menuntutnya tetap aman).

- **Jalur BACA Server Component tidak lagi menelan error API secara senyap**
  (backlog 026). Halaman Tahap 3 mengambil daftar task dengan
  `(ttRes.data ?? []) as TiTaskTerpilihRead[]` — respons gagal apa pun
  (401/403/422/500) menjadi array kosong, dan halaman merender
  **"Ditandai dikerjakan: 0 dari 0 task"** dengan formulir kosong, tanpa pesan
  error apa pun. Partisipan melihat formulir yang tampak sah tapi kosong; admin
  tidak punya petunjuk bahwa ada yang salah. Formulir kosong yang tampak sah
  adalah bentuk _notifikasi bohong_ — hal yang sudah diberantas di jalur mutasi
  pada backlog 017, tapi belum di jalur baca.
  - `src/lib/api/errors.ts`: `ApiError` mendapat field `status` (status HTTP);
    helper baru **`apiErrorDari(res)`** membangun `ApiError` lengkap (pesan
    backend + status + `X-Request-ID`) dari respons `openapi-fetch` yang gagal,
    dan **`isTidakBerhak(err)`** untuk 401/403/404. Call-site lama yang memakai
    `toApiError(null, reqId)` kehilangan pesan backend — kini tidak lagi.
  - **21 kemunculan `?? []` di jalur baca** (`src/app`) diaudit; seluruhnya
    ternyata data kritis dan diubah menjadi **melempar** saat gagal: Tahap 1
    (catalog), Tahap 3 (task terpilih + detail), Tahap 2 (catalog + daftar
    responden), `/kuesioner` (5 panggilan), halaman isi DCS/WCP/OPM (item
    kuesioner + jawaban tersimpan), log Time Study, serta daftar responden
    DCS/WCP/OPM/TI. Dua `?? null` sekelas ikut diperbaiki: review Tahap 2 (dulu
    403/422/500 tampil sebagai "tidak ada task partial") dan hasil sesi TI.
  - **Pengecualian yang disengaja** (tetap `?? null`/tidak melempar):
    `GET /partisipan/saya` 404 untuk admin yang bukan partisipan, dan
    `GET .../seleksi` 404 pada kunjungan pertama Tahap 1 (backend memang
    melempar `NotFound` bila responden belum pernah menyimpan pilihan) — dua
    kondisi SAH, bukan kegagalan. Hanya 404 yang ditoleransi di sana; 401/403/5xx
    tetap melempar.
  - Komponen baru `src/components/gagal-muat.tsx` (`GagalMuat`, `TidakBerhak`)
    dirender **di server**: Next.js menyensor `error.message` dari Server
    Component sebelum sampai ke `error.tsx`, jadi `X-Request-ID` mustahil
    ditampilkan lewat error boundary di produksi. Halaman Tahap 1 & Tahap 3
    menangkap `ApiError` dan merender panel ini (403 non-pemilik → halaman
    "tidak berhak" yang rapi, menggantikan digest React mentah); error tak
    dikenal tetap dilempar ke `error.tsx`.
  - `detail-form.tsx`: **0 task final** (sesi TAHAP3 tapi koordinator tidak
    menyetujui satu pun task partial) kini menampilkan pesan eksplisit dengan
    tombol "Kirim Detail" nonaktif — bukan formulir kosong dengan tombol yang
    menyesatkan.
  - `tahap3/[responden_id]/error.tsx`: label keliru "Gagal memuat Tahap 2."
    (salin-tempel) diperbaiki menjadi "Tahap 3".
  - `fetchPageData` Tahap 1 & Tahap 3 dipindah ke `data.ts` masing-masing agar
    bisa diuji langsung (berkas route Next.js tidak boleh mengekspor fungsi
    sembarang). Test baru: `src/test/tahap1-data.test.ts`,
    `src/test/tahap3-data.test.ts`, `src/test/detail-form-tanpa-task.test.tsx`.
  - **Catatan deploy**: halaman yang tadinya "berhasil dirender kosong" kini
    **gagal terlihat**. Itu disengaja — sesi produksi yang diam-diam bermasalah
    akan mulai menampilkan error setelah deploy. Itu perbaikan, bukan regresi.

## [4.1.1] - 2026-07-14

### Diperbaiki

- **Konfirmasi sebelum "Jalankan Analisis" DCS & WCP** (backlog 021). Tombol ini
  mengeksekusi aksi paling ireversibel di seluruh alur (instrumen
  `CLOSED → ANALYZED`, tidak bisa dibuka ulang lagi) tanpa dialog konfirmasi
  apa pun — berbeda dari "Tutup Pengisian" di komponen yang sama yang sudah
  memakai `confirm()`.
  - `dcs/aksi-instrumen.tsx` dan `wcp/aksi-instrumen.tsx`: guard
    `if (!confirm(...)) return;` ditambahkan sebagai baris pertama
    `doAnalisis()`, pola identik `doTutup()`. Tidak ada perubahan lain ke
    fungsi ini.
  - Test baru: `src/test/dcs-aksi-instrumen.test.tsx`,
    `src/test/wcp-aksi-instrumen.test.tsx`.

## [4.1.0] - 2026-07-14

### Ditambahkan

- **Notifikasi toast (`sonner`) di seluruh operasi simpan data** (backlog 017). Sebelumnya
  web app tidak punya mekanisme toast sama sekali — dari ~55 call site mutasi
  (POST/PATCH/PUT/DELETE), hanya 6 yang memberi konfirmasi sukses eksplisit; sisanya
  mengandalkan efek samping (`router.push`/`router.refresh()`) yang tidak terlihat bila
  tampilan tidak berubah.
  - `sonner` dipasang sebagai satu-satunya mekanisme toast; `<Toaster position="top-right"
richColors closeButton />` ditambahkan di `src/app/providers.tsx`.
  - Helper terpusat baru `src/lib/notify.ts`: `notifySukses(pesan)`, `notifyGagal(err)`,
    `pesanGagal(err)`. Komponen dilarang memanggil `toast.*` langsung — semua lewat helper
    ini. Toast error memakai `duration: Infinity` (harus ditutup manual oleh user) dan
    menampilkan `X-Request-ID` (lewat `ApiError.requestId`) di deskripsi bila tersedia.
  - Seluruh ~55 call site mutasi di 49 berkas (master-data, task-inventory, dcs/wcp, opm,
    time-study/partisipan) kini memanggil `notifySukses(...)` pada jalur sukses dan
    `notifyGagal(err)` pada jalur gagal, berdampingan dengan error inline yang sudah ada di
    form panjang (tidak diganti).

### Diperbaiki

- **5 bug notifikasi-bohong** ikut diperbaiki di item ini karena satu lingkup dengan
  perbaikan notifikasi di atas:
  1. `master-data/sme-panel/[id]/anggota-form.tsx` — set/unset koordinator menelan error
     API bulat-bulat (`router.refresh()` tetap jalan walau 403/409/500); kini memeriksa
     `error` dan melempar `toApiError`.
  2. `task-inventory/tahap2/[sesi_id]/review-form.tsx` — submit Tahap 2 sukses tanpa
     notifikasi apa pun (`router.refresh()` senyap); kini menampilkan jumlah keputusan
     tersimpan dan jumlah task yang belum diputuskan (tidak disertakan).
  3. `task-inventory/[sesi_id]/atur-koordinator.tsx` — banner sukses digate `!berubah`
     yang dihitung dari prop server basi, sehingga tidak pernah muncul tepat saat PATCH
     sukses; gate & state `sukses` dihapus, diganti toast.
  4. `opm/isi/[responden_id]/opm-form.tsx` — draft yang memfilter task belum lengkap 3
     dimensi tetap dilaporkan sebagai "Draft tersimpan." padahal task parsial itu tidak
     ikut tersimpan (endpoint `PUT` = replace penuh); pesan kini menyebut
     `{tersimpan} dari {total} task` saat ada yang dibuang.
  5. `master-data/task-inventory/utilitas/reset-katalog-panel.tsx` — pesan pemulihan
     "katalog sudah dikosongkan tapi reseed gagal" tidak pernah muncul karena membaca
     state `emptied` di dalam `catch` (stale closure); diganti variabel lokal
     `sudahDikosongkan`, state `emptied` (dead state) dihapus.
- **`alert()` browser dihapus total** (6 berkas: `anggota-form.tsx`,
  `task-inventory/[sesi_id]/hapus-responden.tsx`, `dcs/hapus-responden.tsx`,
  `wcp/hapus-responden.tsx`, `opm/[sesi_id]/hapus-responden.tsx`,
  `time-study/[penugasan_id]/hapus-penugasan.tsx`) — diganti `notifyGagal(err)` +
  `notifySukses(...)` pada jalur sukses.
- **Assign responden DCS & WCP tidak menampilkan responden yang di-skip** (backlog 019).
  Mengikuti perubahan backend (`POST /api/v1/dcs/responden` & `.../wcp/responden` kini
  mengembalikan `BulkAssignResult` `{created, skipped}`, bukan array datar — backlog 018),
  `dcs/assign-responden.tsx` & `wcp/assign-responden.tsx` sebelumnya membersihkan seluruh
  seleksi dan hanya menampilkan toast jumlah — memilih 10 partisipan lalu 7 di-skip
  terlihat identik dengan sukses penuh.
  - Panel ringkasan baru (meniru `opm/[sesi_id]/assign-responden-banyak.tsx`): jumlah
    `created` + daftar `skipped` dengan alasan Bahasa Indonesia lewat
    `formatAlasanSkip()` (helper yang sudah ada, tidak diduplikasi).
  - Hanya partisipan yang berhasil dibuat (`data.created`) yang di-uncheck setelah
    submit — partisipan yang di-skip **tetap tercentang** supaya bisa langsung
    di-retry tanpa memilih ulang.
  - `src/lib/api/schema.ts` diregenerasi dari `openapi.json` backend 018; convenience
    re-exports akhir file (termasuk alias baru `DcsRespondenBulkResult` &
    `WcpRespondenBulkResult` untuk `BulkAssignResult_DcsRespondenRead_` /
    `BulkAssignResult_WcpRespondenRead_`) di-append ulang setelah `gen:api`.

## [4.0.3] - 2026-07-13

### Diperbaiki

- **Formatting `CLAUDE.md` tidak lolos Prettier** — entri Revisi Desain yang ditambahkan di
  v4.0.2 memakai `*terlihat*` yang oleh Prettier dinormalisasi jadi `_terlihat_`; CI
  `Automated Test` gagal di step `prettier --check .` (tag `v4.0.2` sudah terlanjur dirilis
  dengan gate lint merah). Tidak ada perubahan kode aplikasi.

## [4.0.2] - 2026-07-13

### Diperbaiki

- **Editor item DCS & WCP tidak mereload data setelah simpan** (backlog 016).
  Tombol "Simpan" di `/master-data/dcs/{kode}` dan `/master-data/wcp/{kode}` berhasil
  mem-`PATCH` item ke backend, tapi hanya menambal salinan lokal `useState` — satu-satunya
  komponen mutasi di web app yang tidak memanggil `router.refresh()`. Akibatnya perubahan
  `urutan` tidak pernah terlihat: backend mengurutkan item berdasarkan kolom itu, tapi
  tabel tidak di-render ulang, jadi baris tampil dengan nomor urut baru di posisi lamanya
  sampai user menekan F5 manual.
  - `dcs-item-editor.tsx` dan `wcp-item-editor.tsx`: cermin state `rows` dibuang; tabel kini
    dirender langsung dari prop `items` (Server Component), dan `router.refresh()` dipanggil
    setelah PATCH sukses untuk memasok data segar.
  - `hapus-penugasan.tsx` (Time Study): ditambahkan `router.refresh()` setelah `router.push()`
    agar seragam dengan tombol hapus lain di Master Data (kosmetik, bukan bug — Router Cache
    sudah dimatikan lewat `staleTimes: 0`).
  - Test baru: `src/test/dcs-item-editor.test.tsx`, `src/test/wcp-item-editor.test.tsx`.

## [4.0.1] - 2026-07-13

### Diperbaiki

- **Counter "Belum diputuskan" di header Task Inventory Tahap 2 tidak reaktif** (backlog 011).
  Temuan simulasi end-to-end deployment YPII: counter di bagian atas halaman
  `/task-inventory/tahap2/[sesi_id]` dihitung dari `review.jumlah_belum_diputuskan` hasil fetch
  server sekali di awal (`page.tsx`), sehingga tidak berubah saat koordinator klik Ya/Tidak per
  baris — berbeda dengan counter di action bar (`review-form.tsx`) yang sudah reaktif memakai
  state client `keputusan`, membuat dua indikator untuk fakta yang sama menampilkan angka
  berbeda pada saat bersamaan.
  - `review-form.tsx`: blok "Belum diputuskan: N" dipindahkan ke bagian atas komponen ini,
    memakai `belumDiputuskan` (computed dari state `keputusan`) sebagai satu-satunya sumber
    kebenaran — sama seperti yang sudah dipakai action bar. Kondisi tampil tetap
    `!readOnly && belumDiputuskan > 0`.
  - `page.tsx`: span statis `Belum diputuskan: {review.jumlah_belum_diputuskan}` dihapus dari
    header server; "Total partial: {review.tasks.length}" tetap tampil di sana karena angka ini
    memang tidak berubah oleh interaksi Ya/Tidak.
  - Test baru di `src/test/review-form.test.tsx`: counter berkurang seketika saat satu task
    diputuskan (tanpa `router.refresh()`), dan hilang begitu semua task sudah diputuskan via
    klik (sebelum tombol Simpan ditekan).
- **Sisa terminologi "Sesi" pada teks yang dilihat pengguna TI/OPM** (backlog 004).
  Sebagian besar sudah diganti "Analisis Jabatan" di commit sebelumnya (item 003/007);
  sisa 5 occurrence dirapikan:
  - `opm/buat/opm-sesi-form.tsx`: pesan validasi Zod "Sesi Task Inventory wajib dipilih"
    → "Analisis Jabatan Task Inventory wajib dipilih".
  - `task-inventory/tahap1/[responden_id]/page.tsx` dan `tahap3/[responden_id]/page.tsx`:
    "Sesi tidak sedang dalam Tahap 1/3 (status: …)" → "Analisis jabatan ini tidak sedang
    dalam Tahap 1/3 (status: …)".
  - `task-inventory/tahap2/[sesi_id]/page.tsx`: "Sesi sudah melewati Tahap 2 …" →
    "Analisis jabatan ini sudah melewati Tahap 2 …".
  - `opm/[sesi_id]/page.tsx`: metadata title "Detail Sesi OPM — ANJAB-ABK" →
    "Detail Analisis Jabatan — OPM — ANJAB-ABK" (konsisten dengan pola
    `task-inventory/[sesi_id]/page.tsx`).
  - `docs-usage/ik/task-inventory.md`, `docs-usage/ik/opm.md`,
    `docs-usage/ik/login-navigasi.md`: sisa kata "sesi" pada prosa yang menjelaskan
    perilaku TI/OPM diselaraskan ke "analisis jabatan".
  - `sesi_id` di URL/route, nama variabel, dan tipe (`TiSesiRead`/`OpmSesiRead`) **tidak
    disentuh** — sesuai keputusan item 004 (kosmetik/terminologi saja).
- **Title halaman terduplikasi "— ANJAB-ABK — ANJAB-ABK" di 30 halaman** (backlog 012).
  Temuan simulasi end-to-end Task Inventory deployment YPII (panel Kepala Sekolah): title
  di hampir semua halaman grup `(auth)` menyertakan akhiran manual `" — ANJAB-ABK"`,
  padahal root layout (`src/app/layout.tsx`) sudah punya `title.template: "%s — ANJAB-ABK"`
  yang otomatis menambahkannya — hasilnya title dobel di tab browser. Akhiran `" — ANJAB-ABK"`
  dihapus dari 30 string `title` manual (DCS, WCP, OPM, Task Inventory, Time Study, Partisipan,
  Kuesioner Saya); sisa teks tidak diubah. Halaman `master-data/*` (sudah berakhiran
  `"— Master Data"`) dan root layout tidak disentuh.

## [4.0.0] - 2026-07-13

### Diperbaiki

- **Task Inventory — sisa migrasi alur 2 → 3 tahap di UI** (temuan simulasi end-to-end
  deployment YPII, 2026-07-13):
  - Halaman daftar `/task-inventory`: map label status (`STATUS_LABEL`, dipindah ke
    `src/lib/format/ti-status.ts` agar testable tanpa mengimpor Auth.js) sebelumnya
    tidak punya entri `TAHAP3` (tampil sebagai kode mentah `TAHAP3`) dan melabeli
    `TAHAP2` sebagai "Detailing" — padahal Tahap 2 = Review Koordinator, Tahap 3 =
    Detailing. Sekarang keenam status (`DRAFT`…`ANALYZED`) punya label yang benar.
  - Teks "alur 2 tahap" yang tersisa di subtitle `/task-inventory` dan kartu dashboard
    diganti "alur 3 tahap" (catatan historis di `CLAUDE.md`/`CHANGELOG.md` tidak disentuh).
  - Banner Tahap 3 (`detail-form.tsx`) tidak lagi menyuruh "biarkan tercentang" saat
    tidak ada satu pun task yang tercentang secara default — teks kini menjelaskan
    perilaku aktual (centang task yang dikerjakan; isian standar otomatis terisi saat
    dicentang). **Default checkbox tetap tidak tercentang** — tidak diubah, karena
    mencentang otomatis berisiko membuat partisipan tanpa sadar mengklaim mengerjakan
    task yang tidak ia kerjakan (merusak integritas data ABK).
- **BREAKING (perilaku, disengaja): semantik dialog konfirmasi transisi Task Inventory
  dibalik.** Pola lama `const paksa = !confirm(...)` membuat menekan **Cancel** justru
  **memaksa** transisi Tahap 2/Tahap 3 berjalan — berbahaya karena aksi ini tidak bisa
  dibatalkan. Sekarang: `confirm()` hanya menjawab lanjut/batal (Cancel = `return` tanpa
  efek samping, status sesi **tidak** berubah); mode paksa adalah kontrol checkbox
  eksplisit terpisah ("Lanjutkan walau … belum …") yang **hanya muncul** saat memang
  masih ada partisipan belum submit Tahap 1 (Mulai Tahap 2) atau task partial belum
  diputuskan koordinator (Mulai Tahap 3). Duplikasi try/catch Tahap 2 & Tahap 3 disatukan
  ke satu helper `post()` (`transisi-sesi.tsx`) yang menerima query opsional `paksa`.
  Admin yang terbiasa dengan kebiasaan lama "Cancel = paksa" perlu menyesuaikan.
- **PWA rusak total di setiap halaman** (temuan simulasi end-to-end deployment YPII,
  2026-07-13): `matcher` middleware Auth.js tidak mengecualikan aset publik, sehingga
  `GET /manifest.webmanifest` dan `GET /sw.js` di-redirect ke `/login` dan mengembalikan
  HTML alih-alih JSON/JS — browser melaporkan `Manifest: … Syntax error` di console pada
  tiap halaman dan aplikasi tidak bisa di-install sebagai PWA. Matcher kini mengecualikan
  `manifest.webmanifest`, `sw.js`, `favicon.svg`, `icon.svg` secara spesifik (bukan
  melonggarkan proteksi untuk semua path berekstensi) — lihat `src/middleware.ts`. Pola
  yang sama diduplikasi (bukan diimpor — Next.js mewajibkan `config.matcher` middleware
  berupa literal statis, lihat komentar di `src/middleware.ts`) di
  `src/lib/middleware/matcher.ts` khusus untuk unit test.
- **Link "Keluar" di-prefetch Next.js secara pasif, memicu GET ke route logout tanpa
  klik** (temuan sama). Gejala teramati: error CORS berulang ke endpoint `end-session`
  Authentik pada setiap page load, dipicu `GET /api/auth/logout?_rsc=…` — jelas sebuah
  prefetch RSC, bukan klik pengguna.
  - **Hasil investigasi (wajib dicatat, lihat Langkah 3 backlog 010):** `GET
/api/auth/logout` **punya efek samping destruktif** — ia menghapus seluruh cookie
    sesi Auth.js dan mengarahkan browser ke `end-session` Authentik (meng-invalidate
    sesi SSO). Karena itu, sekadar `prefetch={false}` pada `<Link>` **tidak cukup** — ia
    hanya menutup satu jalur pemicu (prefetch Next.js), bukan navigasi pasif lain
    (mis. crawler, bookmark, middleware/extension yang mem-fetch link di halaman).
  - **Perubahan**: route handler logout diubah dari `GET` menjadi **`POST`-only**
    (`src/app/api/auth/logout/route.ts`) — logika RP-initiated logout (hapus cookie +
    redirect 303 ke `end-session` Authentik) tidak berubah, hanya method yang diterima.
    Tombol "Keluar" di `src/components/shell/top-bar.tsx` diubah dari `<Link href=
"/api/auth/logout">` menjadi `<form action="/api/auth/logout" method="post">` dengan
    tombol submit bergaya link — navigasi pasif tidak bisa lagi memicu POST.
  - `e2e/auth.spec.ts` disesuaikan: assertion `getByRole("link", { name: "Keluar" })` →
    `getByRole("button", …)`, ditambah test baru yang memverifikasi tidak ada `GET
/api/auth/logout` selama page load/navigasi normal.

## [3.1.0] - 2026-07-13

### Ditambahkan

- **UI penugasan massal (bulk) untuk Time Study, Task Inventory, dan OPM.**
  Mengonsumsi endpoint bulk-assign idempoten baru di `anjab-abk-backend`
  (`{created, skipped}`). Form single yang sudah ada **tetap ada** —
  komponen bulk ditambahkan berdampingan, bukan menggantikan:
  - `/task-inventory/{sesi_id}`: bagian baru "Atau tugaskan banyak sekaligus"
    di bawah form **Tambah Responden**.
  - `/opm/{sesi_id}`: idem, di bawah form **Tambah Responden** OPM.
  - `/time-study/tugaskan-banyak`: halaman baru (link "+ Tugaskan Banyak
    Sekaligus" dari `/time-study`).
  - Setelah submit, UI menampilkan jumlah berhasil **dan** daftar yang
    dilewati beserta alasannya dalam Bahasa Indonesia (`sudah_terdaftar` →
    "Sudah terdaftar", dst. — lihat `src/lib/format/bulk-skip-alasan.ts`).

## [3.0.0] - 2026-07-13

### Diubah

- **BREAKING** (mengikuti refactor `anjab-abk-backend` terbaru — lihat entri
  `[2026-07-12]` di `CLAUDE.md` backend): DCS & WCP tidak lagi
  memakai entitas "sesi" — diganti pola instrumen singleton (satu baris
  instrumen tetap per alat ukur, status `OPEN → CLOSED → ANALYZED`). Alur
  admin turun dari 4 langkah (buat sesi → buka sesi → tambah responden satu
  per satu → jalankan analisis dari backend) menjadi 1 halaman: buka `/dcs`
  atau `/wcp`, pilih partisipan lewat form multi-select, tugaskan sekaligus,
  lalu kelola status & jalankan analisis dari UI.
- Route `/dcs/buat`, `/dcs/[sesi_id]`, `/wcp/buat`, `/wcp/[sesi_id]` **dihapus**.
  `/dcs` dan `/wcp` kini merender halaman instrumen tunggal (bukan listing
  sesi): kartu status, form `assign-responden.tsx` (multi-select bulk,
  menggantikan `tambah-responden.tsx`), `aksi-instrumen.tsx` (menggantikan
  `transisi-sesi.tsx`; juga menambahkan tombol "Jalankan Analisis" yang
  sebelumnya tidak ada sama sekali di DCS/WCP), dan `edit-instrumen.tsx`
  (ubah `min_responden`/`catatan`).
- Halaman hasil per-responden pindah dari `/dcs/[sesi_id]/hasil-responden/[id]`
  ke `/dcs/hasil-responden/[id]` (idem WCP).
- `src/app/(auth)/kuesioner/page.tsx`: kartu DCS & WCP memakai
  `instrumen_status`/`catatan` (field `sesi_*` sudah tidak ada di respons
  backend) — maksimal satu kartu per alat ukur (instrumen singleton).
- **Task Inventory & OPM — perubahan istilah kosmetik saja, bukan skema.**
  Label yang dilihat pengguna diganti dari "Sesi"/"sesi" menjadi
  "Analisis Jabatan"/"analisis" agar tidak lagi terbaca seperti sesi studi
  DCS/WCP/Time Study, padahal satu baris TI atau OPM merepresentasikan **satu
  analisis untuk satu jabatan**. Skema database, path endpoint, dan
  variabel/prop/route `sesi_id` (mis. `TiSesiRead`, `params.sesi_id`) **tidak
  disentuh**. Contoh perubahan: "Sesi Task Inventory"/"Sesi OPM" →
  "Analisis Jabatan — Task Inventory"/"Analisis Jabatan — OPM"; tombol
  "Buat Sesi" → "Mulai Analisis Jabatan"; "Tutup Sesi"/"Buka Sesi"/"Hapus Sesi"
  → "Tutup Analisis"/"Buka Analisis"/"Hapus Analisis". Transisi Tahap 1/2/3 TI
  tidak berubah (istilah domain yang benar). `docs-usage/ik/task-inventory.md`,
  `docs-usage/ik/opm.md`, dan SOP Persiapan/Pelaksanaan TI & OPM diperbarui
  agar konsisten dengan label baru. `e2e/opm.spec.ts`, `e2e/tahap1.spec.ts`,
  dan `e2e/hapus-sesi.spec.ts` disesuaikan ke label tombol baru.

### Ditambahkan

- **`/dcs/hasil`** — halaman hasil agregat DCS baru (sebelumnya tidak ada):
  K-Index psikososial + komponen WCP Risk, dan skor per sub-skala
  (mean/stdev/Cronbach alpha). Hanya dapat diakses saat status `ANALYZED`;
  selain itu redirect ke `/dcs`.
- **`/wcp/hasil`** — halaman hasil agregat WCP baru (sebelumnya tidak ada):
  skor per dimensi (mean/stdev/Cronbach alpha/interpretasi). Hanya dapat
  diakses saat status `ANALYZED`; selain itu redirect ke `/wcp`.
- Klien API bertipe (`schema.ts`) diregenerasi dari `openapi.json` backend
  terbaru untuk mendukung endpoint instrumen/responden/hasil DCS & WCP di atas.

### Dihapus

- `e2e/sesi.spec.ts` (menguji transisi sesi DCS/WCP yang sudah tidak ada).
  `e2e/hapus-sesi.spec.ts` dipertahankan tetapi retarget ke Task Inventory
  (pola hapus-sesi paksa masih berlaku di TI/OPM, tidak lagi di DCS/WCP).
  `e2e/kuesioner.spec.ts` (bagian DCS) ditulis ulang untuk alur assign
  langsung tanpa sesi. TI dan OPM tidak berubah.

### Diperbaiki

- `docs-usage/`: sisa referensi "sesi" yang menyesatkan untuk DCS/WCP di
  halaman lintas-alat-ukur (`sop/index.md`, `referensi/faq.md`,
  `ik/index.md`, `memulai/index.md`, `ik/partisipan.md`) diperbaiki agar
  konsisten dengan instrumen singleton di atas — termasuk koreksi jawaban
  FAQ "penutupan sesi tidak bisa dibatalkan" yang sudah tidak akurat untuk
  DCS/WCP (kini bisa **Buka Ulang** selama belum `ANALYZED`).
- `docs-usage/ik/time-study.md`, `sop/persiapan-time-study.md`,
  `sop/pelaksanaan-time-study.md`: ditulis ulang total — dokumen lama masih
  mendeskripsikan sesi Time Study (`Draft → Terbuka → Tertutup → Teranalisis`,
  form Jabatan/Periode, tombol "Jalankan Analisis") yang sudah dihapus sejak
  revisi `[2026-07-04]`. Sekarang mendeskripsikan alur nyata: penugasan
  langsung per partisipan (`+ Tugaskan Partisipan`), toggle Aktif/Nonaktif,
  tanpa sesi maupun tahap analisis. Referensi silang di `sop/index.md`,
  `referensi/faq.md`, `memulai/index.md`, `ik/login-navigasi.md` disesuaikan.

## [2.5.0] - 2026-07-12

### Ditambahkan

- **Halaman utilitas reset katalog Task Inventory** (admin) di
  `/master-data/task-inventory/utilitas` — tombol "Reset Katalog" memanggil
  purge lalu reseed katalog master (`ti_uraian_tugas`/`ti_tugas_pokok`/
  `ti_detil_tugas`) berurutan lewat endpoint admin baru
  `anjab-abk-backend` v0.28.0. Menangani kegagalan parsial secara eksplisit
  (purge sukses tapi reseed gagal → katalog kosong, pesan berbeda dari error
  generik). Tautan baru ditambahkan ke sidebar Master Data.
- Klien API bertipe (`schema.ts`) diregenerasi dari `openapi.json` terbaru
  untuk mendukung endpoint purge/reseed di atas.

## [2.4.0] - 2026-07-12

### Ditambahkan

- **Nilai standar CalHR di master data Uraian Tugas.** Form tambah/edit
  (`uraian-tugas-form.tsx`) punya bagian "Nilai Standar Tahap 3" (sumber
  bukti, kondisi, frekuensi, durasi, jam/minggu, peak4w, AI mode, VA type,
  flag DCS) — bila diisi, otomatis mem-prefill isian awal partisipan Tahap 3.
  Daftar Uraian Tugas menandai baris yang punya standar dengan badge
  "Standar".
- `detail-form.tsx` (Tahap 3): entri task otomatis ter-prefill dari nilai
  standar master (bila ada), partisipan tinggal menyatakan setuju atau
  mengubahnya (`setuju_standar`).

### Diubah

- **BREAKING** (mengikuti `anjab-abk-backend` v0.27.0): `std_durasi_per_kali`
  berubah tipe dari angka ke teks bebas (`"Bervariasi"`, `"<2 jam"`, dst) —
  input di form master data jadi `type="text"`. Di form isian Tahap 3, kolom
  ini **tidak lagi di-prefill** dari nilai standar (tidak ada angka menit
  untuk disalin) — nilainya ditampilkan sebagai petunjuk di samping input,
  partisipan tetap mengisi angkanya sendiri.
- `VA_TYPE` (`components/calhr.ts`) diperluas dari 3 jadi 5 nilai (tambah
  `Context-Dependent`, `Needs Validation`), mengikuti perluasan `VaType` di
  backend — dipakai bersama form master data & isian Tahap 3.
- `openapi/openapi.json` + `src/lib/api/schema.ts` di-generate ulang dari
  `anjab-abk-backend` v0.27.0.

## [2.3.0] - 2026-07-12

### Ditambahkan

- **Force-delete sesi (admin)** — `transisi-sesi.tsx` (DCS/WCP/OPM/Task
  Inventory) kini menampilkan tombol "Hapus paksa sesi ini" untuk sesi
  berstatus non-DRAFT, mengirim `paksa=true` ke backend dengan konfirmasi
  tegas (SELURUH responden & jawaban ikut terhapus permanen). Tombol "Hapus
  Sesi" biasa tetap hanya untuk DRAFT.
- E2E `hapus-sesi.spec.ts` — cakupan pertama untuk alur delete sesi (DRAFT
  langsung, non-DRAFT via force-delete).

### Diperbaiki

- **Error delete anggota SME panel yang ditelan diam-diam** —
  `HapusAnggotaButton` (`anggota-form.tsx`) tidak memeriksa `error` dari
  respons `DELETE`, sehingga kegagalan backend tidak pernah tampil ke user.

### Diubah

- `schema.ts` diregenerasi mengikuti `openapi.json` backend terbaru (query
  param `paksa` pada endpoint DELETE sesi).

## [2.2.0] - 2026-07-10

### Diubah

- **Shell gaya Gmail — sidebar kiri collapsible menggantikan top-nav horizontal.**
  Navigasi kini terdiri dari top bar (hamburger, logo, nama user, tema, Keluar)
  - sidebar kiri role-based: rail berisi ikon saja atau full ikon+label di
    desktop (pilihan dipersist ke `localStorage`), drawer overlay penuh di
    mobile. Menu **Master Data** menjadi grup collapsible bertingkat di sidebar
    (11 sub-item) — tab horizontal di halaman Master Data dihapus.
  - Komponen baru: `src/components/shell/{app-shell,top-bar,sidebar}.tsx`.
  - Dependency baru: `lucide-react` (ikon sidebar/top bar).
  - Sistem tema (`ThemeProvider`/`ThemeToggle` custom) tidak berubah.

## [2.1.0] - 2026-07-08

### Ditambahkan

- **Simpan draft & tombol atas+bawah — DCS, WCP, OPM, Task Inventory Tahap 1 & 3.**
  Sebelumnya jawaban hanya tersimpan lewat satu submit final; menutup tab atau
  koneksi terputus di tengah pengisian kuesioner panjang (DCS 42 item, WCP 72
  item, dst.) membuat semua jawaban hilang.
  - Tombol **Simpan** baru (memanggil `PUT` draft-save backend) berdampingan
    dengan tombol submit di kelima form; halaman `isi/[responden_id]` kini selalu
    memuat jawaban/seleksi/detail tersimpan (bukan hanya setelah submit final)
    untuk mengisi ulang draft saat partisipan kembali.
  - Tombol submit ("Kirim Jawaban"/"Kirim Seleksi"/"Kirim Detail") kini memanggil
    `PUT` (simpan state saat ini) lalu `POST .../submit` (finalisasi) berurutan,
    mengikuti kontrak backend v0.25.0.
  - Bar tombol submit/simpan ditambahkan di atas **dan** bawah konten form pada
    seluruh 8 form kuesioner (termasuk Task Inventory Tahap 2 dan Time Study yang
    tidak mendapat draft-save) agar partisipan tidak perlu scroll untuk
    menemukannya di form yang panjang.

### Diubah (Breaking, mengikuti backend v0.25.0)

- Konsumsi endpoint `POST .../jawaban`, `.../seleksi`, `.../detail` (submit
  sekali-jadi) diganti pasangan `PUT` (draft) + `POST .../submit` (finalisasi) —
  lihat backend `CHANGELOG.md` v0.25.0.

## [2.0.1] - 2026-07-04

### Diperbaiki

- **Tampilan tidak otomatis refresh setelah beberapa action (mis. assign partisipan)** —
  Service Worker PWA (`public/sw.js`) menyajikan RSC payload `router.refresh()` dari
  Cache Storage secara cache-first, sehingga hard reload manual diperlukan agar
  perubahan terlihat. Kini request RSC (header `RSC: 1` atau query `_rsc`) dan konten
  non-aset selalu lewat ke network; cache-first dibatasi hanya untuk aset statis
  ber-hash (`/_next/static/`, ikon, dsb). `CACHE_NAME` dinaikkan ke `anjab-abk-v2` agar
  cache lama yang menyimpan RSC basi terhapus saat Service Worker baru aktif.

## [2.0.0] - 2026-07-04

### Diubah

- **BREAKING: Time Study tanpa sesi — penugasan berbasis partisipan langsung.**
  - Rute admin `/time-study` menampilkan daftar penugasan (bukan sesi); `/time-study/buat`
    langsung memilih partisipan untuk ditugaskan (menggantikan alur buat-sesi lalu
    tambah-responden); `/time-study/{penugasan_id}` (dulu `{sesi_id}`) menampilkan info
    partisipan + toggle aktif/nonaktif (menggantikan transisi status sesi).
  - Rute partisipan `/time-study/isi/[responden_id]` menjadi `/time-study/isi/[penugasan_id]`;
    tombol tambah/edit log disembunyikan saat penugasan nonaktif.
  - `TsKuesionerItemRead` diringkas menjadi `{id, aktif, jumlah_log, created_at}` — halaman
    `/kuesioner` menampilkan status berdasarkan `aktif`, bukan `sesi_status === "OPEN"`.
  - `schema.ts` diregenerasi dari backend v0.23.0 (endpoint TS berubah total).

## [1.19.0] - 2026-07-02

### Ditambahkan

- **Atur koordinator SME panel dari detail sesi Task Inventory** — kartu "Koordinator
  SME Panel" di halaman `/task-inventory/[sesi_id]` memungkinkan admin menentukan/
  mengubah koordinator kapan saja (mis. ketika koordinator baru ditetapkan setelah sesi
  dimulai). Pilihan **dibatasi hanya ke anggota SME panel** jabatan sesi tersebut;
  tersedia opsi mengosongkan koordinator. Menyimpan lewat `PATCH` sesi TI (`koordinator_id`).

### Diperbaiki

- Format ulang (Prettier) beberapa berkas yang sebelumnya tidak sesuai gaya kode
  (`docs-usage/index.md`, `docs-usage/sop/persiapan-task-inventory.md`, workflow rilis &
  deploy-docs, `e2e/opm.spec.ts`) agar gate lint hijau. Tanpa perubahan logika.

## [1.18.2] - 2026-07-02

### Diperbaiki

- **Dokumentasi penggunaan Task Inventory diselaraskan dengan form buat sesi terbaru** —
  field **Unit / Jenjang** sudah dihapus dari form buat sesi TI, dan dropdown Jabatan
  hanya menampilkan nama jabatan (bukan "jumlah task per jabatan"). IK-04 §A dan
  SOP Persiapan TI §3 disesuaikan. Referensi "catalog unit × jabatan" (master data)
  tetap dipertahankan karena catalog masih berdimensi unit.

## [1.18.1] - 2026-07-02

### Diubah

- **Dokumentasi penggunaan (`docs-usage/`) diselaraskan dengan instrumen OPM** —
  halaman lintas-alat-ukur yang sebelumnya menyebut "empat alat ukur" kini mencakup
  OPM: Beranda (`index.md`, tabel + heading "Lima Alat Ukur"), Cara Memulai &
  IK-01 Login/Navigasi (daftar menu admin), IK-03 Partisipan (SME panel & daftar
  responden), serta FAQ (daftar alat ukur, pendaftaran responden, min. responden,
  syarat tombol Kirim, dan kebijakan ubah jawaban setelah kirim).

## [1.18.0] - 2026-07-02

### Ditambahkan

- **Instrumen OPM (Rating Tugas — Importance/Frequency/Criticality)** — halaman baru
  `/opm` untuk admin (daftar sesi, buat sesi dari sesi Task Inventory yang sudah
  dibekukan, detail sesi dengan transisi status, kelola responden, dan halaman hasil
  analisis per task) serta `/opm/isi/[responden_id]` untuk partisipan mengisi rating
  3 dimensi (Importance/Frequency/Criticality) per task dengan progres pengisian dan
  mode hanya-baca setelah submit.
- Menu OPM ditambahkan di navigasi admin, kartu dashboard admin, dan section OPM di
  halaman kuesioner partisipan.
- Refactor `e2e/kuesioner.spec.ts`: builder master data (`buatJenjang`, `buatSekolah`,
  `buatJabatan`, `buatPartisipan`) dipindah ke modul bersama `e2e/builders.ts`, dipakai
  ulang oleh `e2e/opm.spec.ts`.

## [1.17.3] - 2026-07-02

### Diperbaiki

- **Halaman "not found" setelah submit Tahap 3** — partisipan yang mengirim detail
  CalHR di Tahap 3 diarahkan ke `/task-inventory/{sesi_id}`, halaman yang hanya bisa
  diakses admin (`notFound()` untuk peran lain). Redirect sekarang mengarah ke
  `/kuesioner`, mengikuti pola yang sudah dipakai Tahap 1.
- **Breadcrumb admin-only di Tahap 1/2/3** — breadcrumb pada ketiga halaman tahap
  Task Inventory memuat tautan ke `/task-inventory` dan `/task-inventory/{sesi_id}`
  (keduanya admin-only) yang selalu 404 bila diklik partisipan atau koordinator
  non-admin. Tautan tersebut kini hanya dirender sebagai link untuk admin; peran
  lain melihatnya sebagai teks biasa.

## [1.17.2] - 2026-07-01

### Diperbaiki

- **Nama uraian tugas tidak muncul di Tahap 2** — halaman review Tahap 2 (koordinator
  maupun tampilan hanya-baca anggota panel) sebelumnya membangun peta kode→nama uraian
  tugas dari `GET /task-inventory/uraian-tugas?limit=500`, endpoint global tanpa filter
  jabatan. Karena total uraian tugas di database (2738 item) jauh melebihi batas 500,
  sesi dengan jabatan di luar 500 item pertama gagal me-resolve nama tugasnya dan
  menampilkan kode mentah (mis. `TI01e02d59`). Diganti ke `GET /task-inventory/catalog?jabatan_id=...`
  yang sudah di-scope ke jabatan sesi — pola yang sama dipakai di halaman Tahap 1.

## [1.17.1] - 2026-06-30

### Diperbaiki

- **Tombol "Lihat Tahap 2" di halaman Kuesioner Saya** — anggota panel yang bukan
  koordinator kini melihat tombol ungu "Lihat Tahap 2" saat status sesi adalah `TAHAP2`,
  bukan teks abu-abu "Menunggu review koordinator" yang tidak bisa diklik. Tombol
  mengarah ke halaman review Tahap 2 yang sudah mendukung mode hanya-baca sejak v1.17.0.

## [1.17.0] - 2026-06-30

### Ditambahkan

- **Akses hanya-baca Tahap 2 untuk anggota panel** — responden sesi (selain koordinator)
  kini dapat membuka halaman review Tahap 2 dalam mode hanya-baca. Sebelumnya mereka
  mendapat 404. Koordinator dan admin tetap dapat mengedit keputusan saat status `TAHAP2`;
  anggota panel melihat tabel dan keputusan tanpa tombol Ya/Tidak/Simpan, disertai banner
  biru informatif.
- **Kolom Task menampilkan nama uraian tugas** — tabel task di halaman review Tahap 2
  kini menampilkan nama uraian tugas (mis. _"Menyusun evaluasi karyawan"_) dengan kode
  task sebagai keterangan kecil di sampingnya. Sebelumnya hanya kode (mis. `TIf0b59714`)
  yang ditampilkan. Nama diambil dari `GET /api/v1/task-inventory/uraian-tugas` dan
  di-resolve di frontend; payload submit ke backend tetap menggunakan kode.
- **Unit test `ReviewForm`** — test baru di `src/test/review-form.test.tsx` mencakup:
  render nama uraian, fallback ke kode bila nama tidak ada, mode hanya-baca menyembunyikan
  kontrol edit, dan submit menggunakan kode (bukan nama).

## [1.16.8] - 2026-06-28

### Diperbaiki

- **Logout tidak menghapus cookie sesi yang ter-_chunk_** — Auth.js memecah cookie
  sesi besar menjadi `__Secure-authjs.session-token.0`, `.1`, dst. Route handler
  `/api/auth/logout` sebelumnya hanya menghapus nama statis tanpa suffix `.0`/`.1`,
  sehingga chunk tersebut lolos dan sesi lokal tetap hidup setelah logout. Sekarang
  handler meng-enumerasi cookie yang benar-benar dikirim browser dan meng-kadaluwarsa
  setiap cookie milik Auth.js (termasuk chunk dan prefix `__Secure-`/`__Host-`).

### Catatan

- Akar masalah "login berikutnya tetap user sebelumnya" ada di sisi Authentik:
  provider `anjab-abk-web` memakai invalidation flow tanpa stage `user_logout`,
  sehingga RP-initiated logout tidak mematikan sesi SSO. Diperbaiki di Authentik
  (provider diarahkan ke flow logout yang benar) — perubahan konfigurasi, bukan kode.

## [1.16.7] - 2026-06-26

### Diperbaiki

- **Logout tidak membersihkan sesi pada HTTPS** — route handler `/api/auth/logout`
  kini menyertakan atribut `Secure` saat menghapus cookie `__Secure-authjs.*` dan
  `__Host-authjs.*`. Tanpa atribut ini, browser menolak instruksi penghapusan cookie
  (RFC 6265bis §4.1.3) sehingga sesi lama tetap hidup dan pengguna otomatis masuk
  kembali sebagai user sebelumnya setelah logout.
- **Revert `prompt=login`** — parameter ini menyebabkan loop tak berujung di Authentik
  (reauthentication loop via `next` parameter) sehingga login tidak bisa diselesaikan.
  Penghapusan cookie yang benar (fix di atas) sudah cukup untuk menyelesaikan masalah.

## [1.16.6] - 2026-06-26

### Diperbaiki

- **Nama jabatan TI di halaman Kuesioner Saya** — kartu Task Inventory kini menampilkan
  nama jabatan yang terbaca manusia (mis. "Kepala Sekolah"), bukan kode ID jabatan
  (mis. `jbt_a1b2c3d4`). Frontend menggunakan field `sesi_jabatan_nama` yang baru
  dikirim backend, dengan fallback ke ID jika nama tidak tersedia.

## [1.16.5] - 2026-06-26

### Ditambahkan

- **Tombol "Review Koordinator" di halaman Kuesioner Saya** — kartu Task Inventory
  kini menampilkan tombol berwarna amber yang mengarah ke halaman review Tahap 2
  jika pengguna adalah koordinator SME panel (`is_koordinator=true`) dan sesi
  sedang di status TAHAP2. Sebelumnya koordinator hanya melihat label
  "Menunggu review koordinator" tanpa akses langsung.

## [1.16.4] - 2026-06-26

### Diperbaiki

- **Tahap 2 Task Inventory: koordinator masih mendapat 404** — halaman
  `/task-inventory/tahap2/{sesi_id}` membandingkan `session.user.id` (sub JWT = email)
  dengan `sesi.koordinator_id` (ID partisipan `par_*`), yang tidak pernah cocok.
  Kini halaman memanggil endpoint baru `GET /api/v1/partisipan/saya` untuk mendapatkan
  ID partisipan pengguna saat ini, lalu membandingkan `par.id` dengan `koordinator_id`.

## [1.16.3] - 2026-06-26

### Diperbaiki

- **Data list tidak otomatis refresh setelah tambah/ubah/hapus** — Client Router Cache
  Next.js menyajikan RSC payload lama saat navigasi kembali ke halaman list, sehingga
  pengguna harus refresh browser manual untuk melihat data terbaru. Ditambahkan konfigurasi
  `staleTimes: { dynamic: 0, static: 0 }` di `next.config.ts` agar cache router selalu
  kedaluwarsa dan setiap navigasi memuat data segar dari server.

## [1.16.2] - 2026-06-25

### Diperbaiki

- **Tahap 2 Task Inventory: halaman hanya bisa dibuka admin** — halaman
  `/task-inventory/tahap2/{sesi_id}` memblok semua non-admin dengan `notFound()`.
  Kini koordinator SME panel yang ditunjuk (`sesi.koordinator_id`) juga dapat
  membuka halaman ini. `session.user.id` (sub Authentik) di-ekspos lewat session
  callback untuk perbandingan dengan `koordinator_id`.

## [1.16.1] - 2026-06-25

### Diperbaiki

- **Tahap 1 Task Inventory: "Halaman Tidak Ditemukan" setelah klik "Kirim Seleksi"** —
  setelah submit berhasil (data sebenarnya tersimpan), formulir mengarahkan partisipan ke
  halaman detail sesi `/task-inventory/{sesi_id}` yang **khusus admin** (`notFound()` bagi
  non-admin), sehingga partisipan melihat halaman "Halaman Tidak Ditemukan". Redirect kini
  diarahkan ke `/kuesioner` (halaman milik partisipan). Prop `sesiId` pada `SeleksiForm`
  yang tak lagi dipakai turut dihapus.

## [1.16.0] - 2026-06-25

### Diubah

- **Halaman kuesioner partisipan (DCS & WCP): hilangkan nama jabatan** — kartu kuesioner di
  `/kuesioner` kini menggunakan `sesi_catatan` (fallback: `sesi_periode`) sebagai label, bukan
  lagi `jabatan_label` responden. Halaman isi kuesioner `/wcp/isi/{id}` dan `/dcs/isi/{id}`
  juga tidak lagi menampilkan `jabatan_label` di subtext header.

## [1.15.2] - 2026-06-25

### Diperbaiki

- **Semua error backend ditampilkan sebagai "Terjadi kesalahan tak terduga."** —
  `isErrorEnvelope` keliru mengecek `error` sebagai objek nested `{ code, message }`,
  padahal backend mengirim envelope datar `{ "error": "code_string", "message": "..." }`.
  Akibatnya `toApiError` selalu jatuh ke fallback dan pesan error asli tidak pernah
  terlihat di UI. Diperbaiki agar pesan error dari backend (mis. "Token tidak ada.",
  "Payload tidak valid.") kini tampil dengan benar.

## [1.15.1] - 2026-06-25

### Diperbaiki

- **Dropdown partisipan kosong saat SME panel belum dibuat** — menampilkan peringatan
  informatif yang mengarahkan admin ke halaman pembuatan SME panel, bukan menampilkan
  semua partisipan sebagai fallback (perilaku yang salah).

## [1.15.0] - 2026-06-25

### Ditambahkan

- **Halaman hasil DCS per responden** (`/dcs/{sesi_id}/hasil-responden/{responden_id}`) —
  admin dapat melihat skor per sub-skala (Demand, Control, Support) dan flag risiko
  individu setiap responden.
- **Halaman hasil WCP per responden** (`/wcp/{sesi_id}/hasil-responden/{responden_id}`) —
  admin dapat melihat skor dan interpretasi per dimensi (12 dimensi) setiap responden.
- **Tombol "Lihat Hasil" di baris responden** pada halaman detail sesi DCS dan WCP —
  tombol muncul untuk responden yang sudah submit, memudahkan akses langsung ke hasil individu.
- **Export type `DcsHasilRespondenRead`, `DcsHasilSubSkalaRespondenRead`, `WcpHasilRespondenRead`,
  `WcpHasilDimensiRespondenRead`** ditambahkan ke re-export `schema.ts`.

### Diperbaiki

- **Kanban tile master data Task Inventory** kini menampilkan nama jabatan (`jabatan_nama`)
  bukan kode jabatan (`jabatan_id`).

## [1.14.1] - 2026-06-25

### Diperbaiki

- **Dropdown partisipan di form Tambah Responden (Task Inventory)** kini hanya menampilkan
  anggota SME panel yang sesuai dengan jabatan sesi, bukan semua partisipan. Jika SME panel
  untuk jabatan tersebut belum dibuat, dropdown tampil kosong (konsisten dengan validasi backend).

## [1.14.0] - 2026-06-25

### Ditambahkan

- **Nama jabatan ditampilkan menggantikan kode jabatan** — tabel list sesi, breadcrumb, dan
  heading di halaman detail sesi, tahap1, tahap2, tahap3, dan kuesioner kini menampilkan
  `jabatan_nama` (fallback ke `jabatan_id` bila null).

### Diubah

- **Form buat sesi Task Inventory** tidak lagi memiliki dropdown unit — hanya pilih jabatan.
  Dropdown jabatan menampilkan nama lengkap jabatan (bukan kode), diurutkan alfabetis.
- **Halaman kuesioner** (TI): hapus referensi `sesi_unit` dari subtitle kartu kuesioner.
- `schema.ts` diregenerasi dari openapi.json backend v0.20.0.

## [1.13.0] - 2026-06-23

### Diubah

- **SOP Pelaksanaan dipecah per alat ukur** (Task Inventory, Time Study, DCS, WCP)
  menggantikan satu berkas gabungan `pelaksanaan-pengambilan-data.md`, karena pelaksanaan
  pengambilan data tiap alat ukur dapat berlangsung pada waktu berbeda. Tiap SOP
  Pelaksanaan kini menautkan ke IK terkait per langkah, dan nav, daftar SOP, serta
  tautan dari SOP Persiapan & IK diperbarui.

## [1.12.1] - 2026-06-23

### Diperbaiki

- **Workflow deploy docs Pages**: kondisi pemicu berbasis `github.event.base_ref` membuat
  deploy ter-_skip_ saat tag `v*` di-push (base_ref kerap kosong pada event tag push).
  Diganti menjadi `github.ref_type == 'tag'` ditambah langkah verifikasi tag berasal dari
  riwayat `master`, sehingga push tag `v*` kini memicu deploy secara andal.

## [1.12.0] - 2026-06-23

### Ditambahkan

- **Dokumentasi penggunaan (user guide)** berbasis Material for MkDocs di `docs-usage/`
  dengan konfigurasi terpisah `mkdocs-usage.yml` (tidak mengganggu dokumentasi teknis).
  Konten dibagi menjadi **SOP** dan **Instruksi Kerja (IK)**:
  - **SOP Persiapan** per alat ukur (Task Inventory, Time Study, DCS, WCP) dan
    **SOP Pelaksanaan Pengambilan Data** lintas alat ukur.
  - **IK** detail penginputan aplikasi: login & navigasi, master data, partisipan,
    serta keempat alat ukur (TI, TS, DCS, WCP).
  - Halaman Beranda, Memulai, dan FAQ.
- **Workflow GitHub Pages** `.github/workflows/deploy-docs-usage.yml` — mem-build &
  men-deploy dokumentasi penggunaan ke GitHub Pages saat tag `v*` di-push dari `master`
  (atau via `workflow_dispatch`). Disertai `requirements-docs.txt`.

## [1.11.0] - 2026-06-23

### Diubah

- **Tahap 1 Task Inventory kini bertingkat (cascade)** (`/task-inventory/tahap1/{responden_id}`):
  partisipan menyeleksi relevansi dalam tiga langkah berurutan — (1) **Tugas Pokok**,
  lalu (2) **Detil Tugas** yang ditampilkan hanya untuk tugas pokok yang dipilih relevan,
  lalu (3) **Uraian Tugas** yang ditampilkan hanya untuk detil tugas yang dipilih relevan.
  Uraian tugas terpilih (`task_kode`) yang disubmit — kontrak submit tidak berubah.
  Pengelompokan memakai `tugas_pokok_id`/`detil_tugas_id` (kunci stabil) dari catalog.
  Mengubah pilihan di langkah sebelumnya otomatis membuang pilihan turunannya yang
  tak lagi valid. Task tanpa detil tugas tampil sebagai "(Langsung di bawah tugas pokok)".
- **Schema API** (`openapi.json`, `schema.ts`) diregenerasi dari backend v0.18.0
  (`TiCatalogRead` menyertakan `tugas_pokok_id` & `detil_tugas_id`).

### Diperbaiki

- **Stack E2E**: service `backend` tidak punya `DATABASE_URL` sejak backend beralih ke
  persistensi PostgreSQL (v0.16.0+) sehingga gagal start (unhealthy). Ditambahkan service
  `backend-db` (PostgreSQL terpisah dari DB Authentik) dan `DATABASE_URL` agar stack E2E
  bisa naik kembali.

### Ditambahkan

- **Test**: unit test cascade Tahap 1 (`src/test/seleksi-form.test.tsx`) dan spesifikasi
  E2E alur partisipan (`e2e/tahap1.spec.ts`).

## [1.10.0] - 2026-06-23

### Diubah (Breaking)

- **Form TugasPokok** (`/master-data/tugas-pokok/tambah`): dropdown jabatan tunggal diganti
  checkboxes M2M — satu TugasPokok dapat terhubung ke beberapa Jabatan.
- **Form DetilTugas** (`/master-data/detil-tugas/tambah`): tambah checkboxes jabatan M2M;
  hanya jabatan dari TugasPokok terpilih yang ditampilkan (subset otomatis).
- **Form UraianTugas** (`/master-data/uraian-tugas/tambah`): dropdown jabatan kini wajib
  diisi eksplisit; pilihan jabatan difilter dari `jabatan_ids` DetilTugas terpilih.
- **Schema API** (`openapi.json`, `schema.ts`) diregenerasi dari backend v0.15.0;
  `TugasPokokCreate/Read` menggunakan `jabatan_ids` (list), `DetilTugasCreate/Read`
  menggunakan `jabatan_ids` (list), `UraianTugasCreate` memerlukan `jabatan_id` eksplisit.

### Diperbaiki

- **E2E `master-data.spec.ts`**: interaksi M2M diperbarui — checkbox dipakai untuk
  TugasPokok dan DetilTugas (menggantikan `selectOption`); helper `buatDetilTugas`
  ditambahkan untuk mendukung cascading dependency pada tes UraianTugas.

## [1.9.0] - 2026-06-22

### Diubah (Breaking)

- **Jabatan melekat pada TugasPokok, bukan TiSesi** — form buat TiSesi tidak lagi
  memilih jabatan; jabatan kini dipilih saat membuat TugasPokok.
- **Form TugasPokok** (`/master-data/tugas-pokok/tambah`): tambah dropdown `jabatan_id`
  (wajib); hapus dropdown `unit` dan `kategori_jabatan`.
- **Form TiSesi** (`/task-inventory/buat`): hapus dropdown `jabatan_id`; field `unit`
  kini opsional.
- **Form UraianTugas**: hapus field `jabatan_id` eksplisit (diwarisi dari TugasPokok).
- **Halaman catalog TI** (`/master-data/task-inventory`): dikelompokkan berdasarkan
  `jabatan_id` menggantikan `kategori_jabatan`.
- **Schema API** (`schema.ts`) diregenerasi dari backend v0.14.0; `TiCatalogRead`,
  `TiKombinasiRead`, dan `TiKuesionerItemRead` merefleksikan perubahan jabatan.

### Diperbaiki

- **E2E `kuesioner.spec.ts`**: tes idempoten untuk DCS yang sudah pernah disubmit pada
  run sebelumnya (`"Belum diisi"` → `"Sudah diisi"`); gunakan `.or()` untuk menerima
  kedua status, dan return early jika sudah diisi.
- **E2E `master-data.spec.ts`**: idempoten check uraian tugas gagal karena daftar UI
  dibatasi 500 item sedangkan item E2E berada di posisi >500 (sort by jabatan_id).
  Diganti dengan query langsung ke search API backend (`POST /uraian-tugas/search`).

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
