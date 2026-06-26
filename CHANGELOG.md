# Changelog

Semua perubahan penting pada proyek ini didokumentasikan di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

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
