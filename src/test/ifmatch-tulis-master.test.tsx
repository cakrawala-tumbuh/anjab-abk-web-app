import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";

const get = vi.fn();
const patch = vi.fn();
const del = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ GET: get, PATCH: patch, DELETE: del, POST: vi.fn() }),
}));
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

import { EditPartisipanForm } from "@/app/(auth)/partisipan/[id]/edit-partisipan-form";
import { TambahTugasPokokForm } from "@/app/(auth)/master-data/tugas-pokok/tambah/tugas-pokok-form";
import { TambahDetilTugasForm } from "@/app/(auth)/master-data/detil-tugas/tambah/detil-tugas-form";
import { TambahUraianTugasForm } from "@/app/(auth)/master-data/uraian-tugas/tambah/uraian-tugas-form";
import { SetKoordinatorButton } from "@/app/(auth)/master-data/sme-panel/[id]/anggota-form";
import { HapusResponden as HapusWcp } from "@/app/(auth)/wcp/hapus-responden";
import { HapusResponden as HapusDcs } from "@/app/(auth)/dcs/hapus-responden";
import { HapusResponden as HapusOpm } from "@/app/(auth)/opm/[sesi_id]/hapus-responden";
import { HapusResponden as HapusTi } from "@/app/(auth)/task-inventory/[sesi_id]/hapus-responden";
import { TransisiSesi as TransisiOpm } from "@/app/(auth)/opm/[sesi_id]/transisi-sesi";
import { TransisiSesi as TransisiTi } from "@/app/(auth)/task-inventory/[sesi_id]/transisi-sesi";
import { PESAN_DATA_BERUBAH } from "@/lib/konkurensi";
import { PESAN_DATA_SUDAH_HILANG } from "@/lib/hapus-ber-etag";

/** Respons sukses dengan header ETag. */
const ok = (data: unknown, etag: string | null = '"v1"') => ({
  data,
  error: undefined,
  response: {
    status: 200,
    headers: { get: (n: string) => (n.toLowerCase() === "etag" ? etag : "req-1") },
  },
});
const hapusOk = () => ({
  error: undefined,
  response: { status: 204, headers: { get: () => "req-1" } },
});
const gagal = (status: number, code = "x") => ({
  data: undefined,
  error: { error: code, message: "ditolak" },
  response: { status, headers: { get: () => "req-1" } },
});

const toastError = vi.mocked(toast.error);
const toastSukses = vi.mocked(toast.success);

beforeEach(() => {
  for (const m of [get, patch, del, push, refresh]) m.mockReset();
  toastError.mockClear();
  toastSukses.mockClear();
  patch.mockResolvedValue(ok({}, '"v2"'));
  del.mockResolvedValue(hapusOk());
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("Formulir ubah master data & partisipan: If-Match dari GET detail", () => {
  it("edit-partisipan-form: PATCH mengirim ETag GET; simpan berikutnya memakai ETag respons", async () => {
    const rec = {
      id: "par_1",
      nama: "Budi",
      email: "budi@example.org",
      sekolah_id: "s1",
      jabatan_utama_id: "j1",
      jabatan_tambahan_ids: [],
      masa_kerja_tahun: 3,
      masa_kerja_bulan: 0,
      mata_pelajaran_utama_id: null,
      aktif: true,
    };
    get.mockResolvedValue(ok(rec));
    render(
      <EditPartisipanForm
        partisipan={rec as never}
        sekolah={[{ id: "s1", nama: "SD" }] as never}
        jabatan={[{ id: "j1", nama: "Guru" }] as never}
        mataPelajaran={[]}
        accessToken="tok"
      />,
    );
    const nama = await screen.findByLabelText(/Nama Lengkap/);
    fireEvent.change(nama, { target: { value: "Budi S" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"v1"' });
    expect(get).toHaveBeenCalledWith("/api/v1/partisipan/{partisipan_id}", {
      params: { path: { partisipan_id: "par_1" } },
    });

    fireEvent.change(screen.getByLabelText(/Nama Lengkap/), { target: { value: "Budi T" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(2));
    expect(patch.mock.calls[1][1].headers).toEqual({ "If-Match": '"v2"' });
  });

  it("edit-partisipan-form: 412 -> pesan baku; GET gagal -> tanpa tombol simpan", async () => {
    const rec = {
      id: "par_1",
      nama: "Budi",
      email: "budi@example.org",
      sekolah_id: "s1",
      jabatan_utama_id: "j1",
      jabatan_tambahan_ids: [],
      masa_kerja_tahun: 3,
      masa_kerja_bulan: 0,
      aktif: true,
    };
    get.mockResolvedValue(ok(rec));
    patch.mockResolvedValue(gagal(412, "precondition_failed"));
    const { unmount } = render(
      <EditPartisipanForm
        partisipan={rec as never}
        sekolah={[{ id: "s1", nama: "SD" }] as never}
        jabatan={[{ id: "j1", nama: "Guru" }] as never}
        mataPelajaran={[]}
        accessToken="tok"
      />,
    );
    fireEvent.change(await screen.findByLabelText(/Nama Lengkap/), { target: { value: "X" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));
    });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(PESAN_DATA_BERUBAH));
    expect(screen.getByLabelText(/Nama Lengkap/)).toHaveValue("X");
    unmount();

    get.mockResolvedValue(gagal(403, "forbidden"));
    render(
      <EditPartisipanForm
        partisipan={rec as never}
        sekolah={[]}
        jabatan={[]}
        mataPelajaran={[]}
        accessToken="tok"
      />,
    );
    expect(await screen.findByText(/Gagal memuat data/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Simpan Perubahan" })).toBeNull();
  });

  it("tugas-pokok-form mode ubah: PATCH ber-If-Match dari GET; mode tambah tanpa GET", async () => {
    get.mockResolvedValue(ok({ id: "tp1", nama: "Lama", jabatan_ids: ["j1"] }));
    render(
      <TambahTugasPokokForm
        accessToken="tok"
        editId="tp1"
        jabatanList={[{ id: "j1", nama: "Guru", kode: "G" }] as never}
      />,
    );
    const nama = await screen.findByLabelText(/Nama Tugas Pokok/);
    expect(nama).toHaveValue("Lama");
    fireEvent.change(nama, { target: { value: "Baru" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"v1"' });
    expect(patch.mock.calls[0][1].body).toEqual({ jabatan_ids: ["j1"], nama: "Baru" });
  });

  it("detil-tugas-form mode ubah: PATCH ber-If-Match dari GET", async () => {
    get.mockResolvedValue(
      ok({ id: "dt1", nama: "Lama", tugas_pokok_id: "tp1", jabatan_ids: ["j1"] }),
    );
    render(
      <TambahDetilTugasForm
        tugasPokok={[{ id: "tp1", nama: "TP", jabatan_ids: ["j1"] }] as never}
        jabatanList={[{ id: "j1", nama: "Guru", kode: "G" }] as never}
        accessToken="tok"
        editId="dt1"
      />,
    );
    const nama = await screen.findByLabelText(/Nama Detil Tugas/);
    fireEvent.change(nama, { target: { value: "Baru" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Simpan Perubahan/ }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"v1"' });
  });

  it("uraian-tugas-form mode ubah: PATCH ber-If-Match dari GET; 412 -> pesan baku", async () => {
    get.mockResolvedValue(
      ok({
        id: "ut1",
        kode: "K1",
        uraian: "Lama",
        unit: "TK",
        urutan: 1,
        tugas_pokok_id: "tp1",
        detil_tugas_id: "dt1",
        jabatan_id: "j1",
        std_sumber_bukti: "Formal",
        std_kondisi: "Baseline",
        std_va_type: "VA-Core",
      }),
    );
    patch.mockResolvedValueOnce(gagal(412, "precondition_failed"));
    render(
      <TambahUraianTugasForm
        tugasPokok={[{ id: "tp1", nama: "TP", jabatan_ids: ["j1"] }] as never}
        detilTugas={
          [{ id: "dt1", nama: "DT", tugas_pokok_id: "tp1", jabatan_ids: ["j1"] }] as never
        }
        jabatanList={[{ id: "j1", nama: "Guru", kode: "G" }] as never}
        accessToken="tok"
        editId="ut1"
      />,
    );
    const uraian = await screen.findByDisplayValue("Lama");
    fireEvent.change(uraian, { target: { value: "Baru" } });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Simpan Perubahan/ }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"v1"' });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(PESAN_DATA_BERUBAH));
  });

  it("SetKoordinatorButton: PATCH memakai etag dari halaman sebagai If-Match", async () => {
    render(
      <SetKoordinatorButton
        panelId="pnl_1"
        partisipanId="par_a"
        isKoordinator={false}
        etag={'"p1"'}
        accessToken="tok"
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Jadikan Koordinator" }));
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][1].headers).toEqual({ "If-Match": '"p1"' });
  });
});

describe("Dialog hapus responden: GET -> konfirmasi -> DELETE ber-If-Match", () => {
  const kasus = [
    ["WCP", HapusWcp, "/api/v1/wcp/responden/{responden_id}"],
    ["DCS", HapusDcs, "/api/v1/dcs/responden/{responden_id}"],
    ["OPM", HapusOpm, "/api/v1/opm/sesi/responden/{responden_id}"],
    ["TI", HapusTi, "/api/v1/task-inventory/sesi/responden/{responden_id}"],
  ] as const;

  for (const [nama, Komponen, path] of kasus) {
    it(`${nama}: DELETE mengirim ETag dari GET dialog`, async () => {
      get.mockResolvedValue(ok({ id: "r1" }, '"e1"'));
      render(<Komponen respondenId="r1" nama="Budi" accessToken="tok" />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Hapus responden Budi/ }));
      });
      await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
      expect(get).toHaveBeenCalledWith(path, { params: { path: { responden_id: "r1" } } });
      expect(del).toHaveBeenCalledWith(path, {
        params: { path: { responden_id: "r1" } },
        headers: { "If-Match": '"e1"' },
      });
      expect(toastSukses).toHaveBeenCalledWith("Responden berhasil dihapus.");
      expect(refresh).toHaveBeenCalled();
    });
  }

  it("WCP: 412 -> pesan baku, tidak ada toast sukses", async () => {
    get.mockResolvedValue(ok({ id: "r1" }));
    del.mockResolvedValue(gagal(412, "precondition_failed"));
    render(<HapusWcp respondenId="r1" nama="Budi" accessToken="tok" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Hapus responden Budi/ }));
    });
    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(toastError.mock.calls.at(-1)?.[0]).toBe(PESAN_DATA_BERUBAH);
    expect(toastSukses).not.toHaveBeenCalled();
    // tombol tetap bisa dipakai lagi
    expect(screen.getByRole("button", { name: /Hapus responden Budi/ })).toBeEnabled();
  });

  it("WCP: GET 404 -> pesan 'sudah tidak ada' + muat ulang, DELETE tidak dipanggil", async () => {
    get.mockResolvedValue(gagal(404, "not_found"));
    render(<HapusWcp respondenId="r1" nama="Budi" accessToken="tok" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Hapus responden Budi/ }));
    });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(del).not.toHaveBeenCalled();
    expect(toastError.mock.calls.at(-1)?.[0]).toBe(PESAN_DATA_SUDAH_HILANG);
  });

  it("WCP: Batal pada konfirmasi -> DELETE tidak dipanggil", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    get.mockResolvedValue(ok({ id: "r1" }));
    render(<HapusWcp respondenId="r1" nama="Budi" accessToken="tok" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Hapus responden Budi/ }));
    });
    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(del).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("OPM transisi-sesi: DELETE sesi mengirim If-Match dari GET sesi", async () => {
    get.mockResolvedValue(ok({ id: "s1" }, '"o1"'));
    render(<TransisiOpm sesi={{ id: "s1", status: "DRAFT" } as never} accessToken="tok" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Hapus Analisis" }));
    });
    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(get).toHaveBeenCalledWith("/api/v1/opm/sesi/{sesi_id}", {
      params: { path: { sesi_id: "s1" } },
    });
    expect(del).toHaveBeenCalledWith("/api/v1/opm/sesi/{sesi_id}", {
      params: { path: { sesi_id: "s1" }, query: { paksa: false } },
      headers: { "If-Match": '"o1"' },
    });
    expect(push).toHaveBeenCalledWith("/opm");
  });

  it("TI transisi-sesi: DELETE sesi mengirim If-Match; 412 -> pesan baku tanpa pindah halaman", async () => {
    get.mockResolvedValue(ok({ id: "s1" }, '"t1"'));
    del.mockResolvedValue(gagal(412, "precondition_failed"));
    render(<TransisiTi sesi={{ id: "s1", status: "DRAFT" } as never} accessToken="tok" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Hapus Analisis" }));
    });
    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(del.mock.calls[0][1].headers).toEqual({ "If-Match": '"t1"' });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(PESAN_DATA_BERUBAH));
    expect(push).not.toHaveBeenCalled();
  });
});

describe("Pemindaian: operasi ber-If-Match yang dipanggil web wajib memakai headerIfMatch", () => {
  const akar = join(__dirname, "..");

  function berkasKode(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) return berkasKode(p);
      return /\.tsx?$/.test(n) ? [p] : [];
    });
  }

  /** Pasangan "metode path" yang menurut schema.ts mewajibkan header If-Match. */
  function operasiIfMatch(): Set<string> {
    const schema = readFileSync(join(akar, "lib/api/schema.ts"), "utf8");
    const iOps = schema.indexOf("export interface operations");
    const bagianOps = schema.slice(iOps);
    const perOp = bagianOps.split(/\n {4}([a-z0-9_]+): \{\n/);
    const idIfMatch = new Set<string>();
    for (let i = 1; i < perOp.length; i += 2) {
      if (/"If-Match"\??:/.test(perOp[i + 1])) idIfMatch.add(perOp[i]);
    }
    const bagianPaths = schema.slice(0, iOps);
    const hasil = new Set<string>();
    let pathSaatIni = "";
    for (const baris of bagianPaths.split("\n")) {
      const mPath = /^ {4}"(\/api\/[^"]+)": \{/.exec(baris);
      if (mPath) pathSaatIni = mPath[1];
      const mOp = /^ {8}(get|put|post|delete|patch): operations\["([^"]+)"\];/.exec(baris);
      if (mOp && idIfMatch.has(mOp[2])) hasil.add(`${mOp[1].toUpperCase()} ${pathSaatIni}`);
    }
    return hasil;
  }

  it("setiap pemanggilan PUT/PATCH/DELETE ke operasi ber-If-Match ada di berkas yang memakai headerIfMatch", () => {
    const wajib = operasiIfMatch();
    expect(wajib.size).toBeGreaterThan(30);
    const pelanggar: string[] = [];
    let ditemukan = 0;
    for (const berkas of berkasKode(join(akar, "app"))) {
      const isi = readFileSync(berkas, "utf8");
      for (const m of isi.matchAll(/\.(PUT|PATCH|DELETE)\(\s*"(\/api\/[^"]+)"/g)) {
        if (!wajib.has(`${m[1]} ${m[2]}`)) continue;
        ditemukan++;
        if (!/headerIfMatch|hapusBerEtag/.test(isi)) pelanggar.push(`${berkas}: ${m[1]} ${m[2]}`);
      }
    }
    expect(ditemukan).toBeGreaterThan(30);
    expect(pelanggar).toEqual([]);
  });
});
