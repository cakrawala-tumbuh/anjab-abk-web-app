import { test, expect, type Page } from "@playwright/test";
import { loginViaAuthentik } from "./helpers";
import {
  buatJenjang,
  buatSekolah,
  buatJabatan,
  buatPartisipan,
  PARTISIPAN_NAMA,
} from "./builders";

// ─── Konstanta data uji ──────────────────────────────────────────────────────
// PERIODE_TI: sesi Task Inventory sumber snapshot OPM (tidak bentrok "2031-03" milik tahap1.spec).
// PERIODE_OPM: periode sesi OPM (metadata; sesi OPM unik per jabatan, bukan per periode).
const PERIODE_TI = "2031-05";
const PERIODE_OPM = "2031-06";

// ─── Helper: jabatan ber-catalog (seed) ──────────────────────────────────────

/** Baca nama jabatan opsi pertama (index 1) di dropdown form buat sesi TI. */
async function tentukanJabatanKatalog(page: Page): Promise<string> {
  await page.goto("/task-inventory/buat");
  await page.waitForLoadState("networkidle");
  const select = page.locator("#jabatan_id");
  await expect(select.locator("option").nth(1)).toBeAttached({ timeout: 10_000 });
  const label = await select.locator("option").nth(1).textContent();
  return (label ?? "").trim();
}

/** Pastikan SME panel untuk `jabatanNama` ada dan ber-anggota PARTISIPAN_NAMA (idempoten). */
async function pastikanSMEPanel(page: Page, jabatanNama: string): Promise<void> {
  await page.goto("/master-data/sme-panel");
  await page.waitForLoadState("networkidle");

  const row = page.locator("tbody tr").filter({ hasText: jabatanNama });
  if (
    await row
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false)
  ) {
    await row
      .first()
      .getByRole("link", { name: /Kelola anggota/ })
      .click();
  } else {
    await page.goto("/master-data/sme-panel/tambah");
    await page.waitForLoadState("networkidle");
    const select = page.locator("#jabatan_id");
    await expect(select.locator("option").nth(1)).toBeAttached({ timeout: 10_000 });
    const optValue = await select
      .locator("option")
      .filter({ hasText: jabatanNama })
      .first()
      .getAttribute("value");
    await select.selectOption(optValue!);
    await page.getByRole("button", { name: "Tambah SME Panel" }).click();
    await page.waitForURL(/\/master-data\/sme-panel$/, { timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    const rowBaru = page.locator("tbody tr").filter({ hasText: jabatanNama });
    await rowBaru
      .first()
      .getByRole("link", { name: /Kelola anggota/ })
      .click();
  }
  await page.waitForURL(/\/master-data\/sme-panel\//, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");

  // AnggotaSection memuat partisipan via fetch client-side — tunggu selesai.
  await expect(page.getByText("Memuat data partisipan")).not.toBeVisible({ timeout: 10_000 });

  const sudahAnggota =
    (await page.getByRole("row").filter({ hasText: PARTISIPAN_NAMA }).count()) > 0;
  if (!sudahAnggota) {
    const select = page.getByLabel("Tambah Anggota");
    await expect(select).toBeVisible({ timeout: 10_000 });
    // Cari <option> berdasarkan teks yang MENGANDUNG nama partisipan, bukan exact-label
    // match — lebih toleran terhadap format label opsi (separator/urutan bisa berubah).
    const opsi = select.locator("option").filter({ hasText: PARTISIPAN_NAMA });
    await expect(opsi.first()).toBeAttached({ timeout: 10_000 });
    const optValue = await opsi.first().getAttribute("value");
    await select.selectOption(optValue!);
    await page.getByRole("button", { name: "Tambah", exact: true }).click();
    await expect(page.locator("table").getByText(PARTISIPAN_NAMA)).toBeVisible({
      timeout: 10_000,
    });
  }
}

/** Buat (atau reuse) sesi Task Inventory PERIODE_TI untuk `jabatanNama`; kembalikan sesi_id. */
async function bukaAtauBuatTiSesi(page: Page, jabatanNama: string): Promise<string> {
  await page.goto("/task-inventory");
  await page.waitForLoadState("networkidle");

  const row = page.getByRole("row").filter({ hasText: PERIODE_TI });
  if (
    await row
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false)
  ) {
    await row.first().getByRole("link").first().click();
    await page.waitForURL(/\/task-inventory\/tises_/, { timeout: 15_000 });
  } else {
    await page.goto("/task-inventory/buat");
    await page.waitForLoadState("networkidle");
    const select = page.locator("#jabatan_id");
    await expect(select.locator("option").nth(1)).toBeAttached({ timeout: 10_000 });
    const optValue = await select
      .locator("option")
      .filter({ hasText: jabatanNama })
      .first()
      .getAttribute("value");
    await select.selectOption(optValue!);
    await page.getByLabel("Periode").fill(PERIODE_TI);
    await page.getByRole("button", { name: "Buat Sesi" }).click();
    await page.waitForURL(/\/task-inventory\/tises_/, { timeout: 15_000 });
  }
  await page.waitForLoadState("networkidle");
  return page.url().split("/task-inventory/")[1];
}

/** Daftarkan responden TI ter-tautkan PARTISIPAN_NAMA (idempoten). */
async function daftarkanRespondenPartisipan(page: Page, sesiId: string): Promise<void> {
  await page.goto(`/task-inventory/${sesiId}`);
  await page.waitForLoadState("networkidle");
  const respRow = page.locator("tbody tr").filter({ hasText: PARTISIPAN_NAMA }).first();
  if (await respRow.isVisible({ timeout: 2_000 }).catch(() => false)) return;

  const tambahResp = page.waitForResponse(
    (r) => r.url().endsWith("/responden") && r.request().method() === "POST",
    { timeout: 15_000 },
  );
  await page.locator("#partisipan_select").selectOption({ label: PARTISIPAN_NAMA });
  await page.getByRole("button", { name: "+ Daftarkan" }).click();
  await tambahResp;
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(respRow).toBeVisible({ timeout: 10_000 });
}

/** Jalankan cascade Tahap 1 untuk responden PARTISIPAN_NAMA lalu bekukan hingga Tahap 3. */
async function bekukanTiSampaiTahap3(page: Page, sesiId: string): Promise<void> {
  await page.goto(`/task-inventory/${sesiId}`);
  await page.waitForLoadState("networkidle");

  // Mulai Tahap 1 bila masih DRAFT.
  const mulai1 = page.getByRole("button", { name: "Mulai Tahap 1" });
  if (await mulai1.isVisible({ timeout: 2_000 }).catch(() => false)) {
    const transisi = page.waitForResponse(
      (r) => r.url().includes("/mulai-tahap1") && r.request().method() === "POST",
      { timeout: 15_000 },
    );
    await mulai1.click();
    await transisi;
    await page.reload();
    await page.waitForLoadState("networkidle");
  }

  // Isi cascade Tahap 1 bila belum submit.
  const respRow = page.locator("tbody tr").filter({ hasText: PARTISIPAN_NAMA }).first();
  const isiLink = respRow.getByRole("link", { name: "Isi Tahap 1" });
  if (await isiLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await isiLink.click();
    await page.waitForURL(/\/task-inventory\/tahap1\//, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Lanjut ke Detil Tugas" }).click();

    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Lanjut ke Uraian Tugas" }).click();

    await page.getByRole("checkbox").first().check();

    const seleksiResp = page.waitForResponse(
      (r) => r.url().includes("/seleksi") && r.request().method() === "POST",
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: "Kirim Seleksi" }).click();
    const resp = await seleksiResp;
    expect(resp.status()).toBe(201);

    await page.waitForURL(/\/task-inventory\/tises_/, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");
  }

  // Mulai Tahap 2 bila masih TAHAP1. Dialog window.confirm di-dismiss (paksa=true) —
  // aman karena dengan 1 responden seleksi selalu unanimous (tidak ada task partial).
  const mulai2 = page.getByRole("button", { name: "Mulai Tahap 2 — Review Koordinator" });
  if (await mulai2.isVisible({ timeout: 2_000 }).catch(() => false)) {
    page.once("dialog", (d) => d.dismiss());
    const transisi = page.waitForResponse(
      (r) => r.url().includes("/mulai-tahap2") && r.request().method() === "POST",
      { timeout: 15_000 },
    );
    await mulai2.click();
    await transisi;
    await page.reload();
    await page.waitForLoadState("networkidle");
  }

  // Mulai Tahap 3 bila masih TAHAP2 — membekukan task_terpilih (unanimous ∪ disetujui koordinator).
  const mulai3 = page.getByRole("button", { name: "Mulai Tahap 3 — Bekukan Task Relevan" });
  if (await mulai3.isVisible({ timeout: 2_000 }).catch(() => false)) {
    page.once("dialog", (d) => d.dismiss());
    const transisi = page.waitForResponse(
      (r) => r.url().includes("/mulai-tahap3") && r.request().method() === "POST",
      { timeout: 15_000 },
    );
    await mulai3.click();
    await transisi;
    await page.reload();
    await page.waitForLoadState("networkidle");
  }
}

/** Buat (atau reuse) sesi OPM untuk `jabatanNama`; kembalikan sesi_id dari URL. */
async function bukaAtauBuatOpmSesi(page: Page, jabatanNama: string): Promise<string> {
  await page.goto("/opm");
  await page.waitForLoadState("networkidle");

  const row = page.locator("tbody tr").filter({ hasText: jabatanNama });
  if (
    await row
      .first()
      .isVisible({ timeout: 2_000 })
      .catch(() => false)
  ) {
    await row.first().getByRole("link").first().click();
    await page.waitForURL(/\/opm\/opses_/, { timeout: 15_000 });
  } else {
    await page.goto("/opm/buat");
    await page.waitForLoadState("networkidle");

    const jabatanSelect = page.locator("#jabatan_id");
    await expect(jabatanSelect.locator("option").nth(1)).toBeAttached({ timeout: 10_000 });
    await jabatanSelect.selectOption({ label: jabatanNama });

    const tiSelect = page.locator("#ti_sesi_id");
    await expect(tiSelect.locator("option").nth(1)).toBeAttached({ timeout: 10_000 });
    const tiValue = await tiSelect
      .locator("option")
      .filter({ hasText: PERIODE_TI })
      .first()
      .getAttribute("value");
    await tiSelect.selectOption(tiValue!);

    await page.getByLabel("Periode").fill(PERIODE_OPM);
    await page.getByLabel("Min. Responden").fill("1");
    await page.getByLabel("Maks. Responden").fill("10");

    await page.getByRole("button", { name: "Buat Sesi" }).click();
    await page.waitForURL(/\/opm\/opses_/, { timeout: 15_000 });
  }
  await page.waitForLoadState("networkidle");
  return page.url().split("/opm/")[1];
}

// ─── OPM — Rating Tugas ───────────────────────────────────────────────────────

test.describe.serial("OPM — Rating Tugas", () => {
  test("admin: siapkan prasyarat (master data, SME panel, TI frozen)", async ({ page }) => {
    test.setTimeout(240_000);
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    // Master data + partisipan (idempoten) — partisipan ini yang akan jadi
    // anggota SME panel jabatan ber-catalog dan mengisi kuesioner OPM.
    await buatJenjang(page);
    await buatSekolah(page);
    await buatJabatan(page);
    await buatPartisipan(page);

    // Jabatan ber-catalog hasil seed (dibutuhkan agar Task Inventory punya task).
    const jabatanNama = await tentukanJabatanKatalog(page);
    expect(jabatanNama.length).toBeGreaterThan(0);

    // SME panel jabatan tsb, beranggotakan PARTISIPAN_NAMA.
    await pastikanSMEPanel(page, jabatanNama);

    // Sesi Task Inventory PERIODE_TI → daftarkan responden bertaut partisipan →
    // bekukan hingga Tahap 3 (task_frozen=True).
    const tiSesiId = await bukaAtauBuatTiSesi(page, jabatanNama);
    await daftarkanRespondenPartisipan(page, tiSesiId);
    await bekukanTiSampaiTahap3(page, tiSesiId);

    await page.goto(`/task-inventory/${tiSesiId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Tahap 3 — Detailing")).toBeVisible();
  });

  test("admin: buat sesi OPM, buka, dan verifikasi task+responden", async ({ page }) => {
    test.setTimeout(60_000);
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    const jabatanNama = await tentukanJabatanKatalog(page);
    const opmSesiId = await bukaAtauBuatOpmSesi(page, jabatanNama);
    expect(opmSesiId).toMatch(/^opses_/);

    // Tabel task terisi (snapshot dari TI).
    const taskHeading = page.getByRole("heading", { name: /Task yang Dinilai/ });
    await expect(taskHeading).toBeVisible();
    await expect(taskHeading).toContainText(/Task yang Dinilai \((?!0\))/);

    // Responden otomatis memuat nama partisipan.
    await expect(page.locator("tbody").getByText(PARTISIPAN_NAMA)).toBeVisible();

    // Buka sesi bila masih DRAFT.
    const bukaBtn = page.getByRole("button", { name: "Buka Sesi" });
    if (await bukaBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const resp = page.waitForResponse((r) => r.url().includes("/buka") && r.status() === 200, {
        timeout: 10_000,
      });
      await bukaBtn.click();
      await resp;
      await page.reload();
      await page.waitForLoadState("networkidle");
    }
    await expect(page.getByText("Terbuka", { exact: true })).toBeVisible();
  });

  test("partisipan mengisi dan mengirim rating OPM", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/kuesioner");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "OPM — Rating Tugas" })).toBeVisible();

    // Idempoten — jika sudah diisi sebelumnya (run ulang), lewati.
    const opmSection = page.locator("section").filter({ hasText: "OPM — Rating Tugas" });
    if (
      await opmSection
        .getByText("Sudah diisi")
        .isVisible()
        .catch(() => false)
    )
      return;

    await opmSection.getByRole("link", { name: "Isi Sekarang" }).click();
    await page.waitForURL(/\/opm\/isi\//, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    // Set importance=4, frequency=3, criticality=5 untuk setiap task.
    const impRadios = page.locator('input[type="radio"][name$="-importance"][value="4"]');
    const freqRadios = page.locator('input[type="radio"][name$="-frequency"][value="3"]');
    const critRadios = page.locator('input[type="radio"][name$="-criticality"][value="5"]');
    const total = await impRadios.count();
    expect(total).toBeGreaterThan(0);
    expect(await freqRadios.count()).toBe(total);
    expect(await critRadios.count()).toBe(total);

    for (let i = 0; i < total; i++) {
      await impRadios.nth(i).evaluate((el) => (el as HTMLInputElement).click());
      await freqRadios.nth(i).evaluate((el) => (el as HTMLInputElement).click());
      await critRadios.nth(i).evaluate((el) => (el as HTMLInputElement).click());
    }

    await expect(page.getByText(`${total} / ${total} tugas lengkap`)).toBeVisible();

    await page.getByRole("button", { name: "Kirim Jawaban" }).click();
    await expect(page.getByText("Jawaban berhasil dikirim!")).toBeVisible({ timeout: 15_000 });
  });

  test("partisipan: status 'Sudah diisi' + halaman read-only", async ({ page }) => {
    await loginViaAuthentik(page, "part-e2e", "PartE2e123!");
    await page.goto("/kuesioner");
    await page.waitForLoadState("networkidle");

    const opmSection = page.locator("section").filter({ hasText: "OPM — Rating Tugas" });
    await expect(opmSection.getByText("Sudah diisi")).toBeVisible();
    await expect(opmSection.getByRole("link", { name: "Lihat Jawaban" })).toBeVisible();
    await expect(opmSection.getByRole("link", { name: "Isi Sekarang" })).not.toBeVisible();

    await opmSection.getByRole("link", { name: "Lihat Jawaban" }).click();
    await page.waitForURL(/\/opm\/isi\//, { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Kuesioner sudah diisi pada/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Kirim Jawaban" })).not.toBeVisible();

    // Setiap task punya 3 radio checked (importance, frequency, criticality).
    const checkedRadios = page.locator('input[type="radio"]:checked');
    expect(await checkedRadios.count()).toBeGreaterThanOrEqual(3);
  });

  test("admin: tutup sesi, jalankan analisis, verifikasi hasil", async ({ page }) => {
    test.setTimeout(60_000);
    await loginViaAuthentik(page, "admin-e2e", "AdminE2e123!");

    const jabatanNama = await tentukanJabatanKatalog(page);
    const opmSesiId = await bukaAtauBuatOpmSesi(page, jabatanNama);

    await page.goto(`/opm/${opmSesiId}`);
    await page.waitForLoadState("networkidle");

    // Idempoten: bila sudah ANALYZED, langsung ke hasil.
    if (
      !(await page
        .getByText("Teranalisis", { exact: true })
        .isVisible()
        .catch(() => false))
    ) {
      const tutupBtn = page.getByRole("button", { name: "Tutup Sesi" });
      if (await tutupBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const resp = page.waitForResponse((r) => r.url().includes("/tutup") && r.status() === 200, {
          timeout: 10_000,
        });
        await tutupBtn.click();
        await resp;
        await page.reload();
        await page.waitForLoadState("networkidle");
      }

      const analisisBtn = page.getByRole("button", { name: "Jalankan Analisis" });
      if (await analisisBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const resp = page.waitForResponse(
          (r) => r.url().includes("/analisis") && r.status() === 200,
          { timeout: 10_000 },
        );
        await analisisBtn.click();
        await resp;
      }
    }

    await page.goto(`/opm/${opmSesiId}/hasil`);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Hasil OPM/ })).toBeVisible();
    // Rating seragam importance=4, frequency=3, criticality=5 untuk semua task.
    await expect(page.locator("tbody tr").first()).toContainText("4.00");
    await expect(page.locator("tbody tr").first()).toContainText("3.00");
    await expect(page.locator("tbody tr").first()).toContainText("5.00");
    // Criticality 5 → Selection & Workload Essential keduanya YA.
    await expect(
      page.locator("tbody tr").first().getByText("Selection Essential: Ya"),
    ).toBeVisible();
    await expect(
      page.locator("tbody tr").first().getByText("Workload Essential: Ya"),
    ).toBeVisible();
  });
});
