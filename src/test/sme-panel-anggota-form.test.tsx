import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";

// ── Mock router & API client ────────────────────────────────────────────────
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const patch = vi.fn();
const del = vi.fn();
const get = vi.fn();
const post = vi.fn();
/** Token yang diterima `withServerAuth` tiap kali klien dibangun — bukti Bearer terkirim. */
const tokenDipakai: (string | undefined)[] = [];
vi.mock("@/lib/api/client", () => ({
  withServerAuth: (token: string | undefined) => {
    tokenDipakai.push(token);
    return { GET: get, POST: post, PATCH: patch, DELETE: del };
  },
}));

import {
  SetKoordinatorButton,
  HapusAnggotaButton,
  AnggotaSection,
} from "@/app/(auth)/master-data/sme-panel/[id]/anggota-form";

const toastSukses = vi.mocked(toast.success);
const toastError = vi.mocked(toast.error);

const okResponse = { headers: { get: () => "req-1" } };
const forbidden = {
  error: { error: "forbidden", message: "Akses ditolak." },
  response: okResponse,
};

const alertSpy = vi.fn();

beforeEach(() => {
  refresh.mockReset();
  patch.mockReset();
  del.mockReset();
  get.mockReset();
  post.mockReset();
  tokenDipakai.length = 0;
  toastSukses.mockReset();
  toastError.mockReset();
  alertSpy.mockReset();
  vi.stubGlobal("confirm", () => true);
  vi.stubGlobal("alert", alertSpy);
});

function renderSetKoordinator(isKoordinator: boolean) {
  return render(
    <SetKoordinatorButton
      panelId="pnl_1"
      partisipanId="par_a"
      isKoordinator={isKoordinator}
      accessToken="tok"
    />,
  );
}

async function klik(nama: string) {
  await act(async () => {
    screen.getByRole("button", { name: nama }).click();
  });
}

describe("SetKoordinatorButton — regresi: error PATCH tidak boleh ditelan", () => {
  it("PATCH gagal (403): toast.error dipanggil DAN router.refresh TIDAK dipanggil", async () => {
    patch.mockResolvedValue(forbidden);
    renderSetKoordinator(false);

    await klik("Jadikan Koordinator");

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("Akses ditolak.", expect.anything());
    // Inti regresi: dulu refresh() tetap jalan walau backend menolak.
    expect(refresh).not.toHaveBeenCalled();
    expect(toastSukses).not.toHaveBeenCalled();
  });

  it("PATCH sukses: toast.success + router.refresh dipanggil", async () => {
    patch.mockResolvedValue({ error: null, data: {}, response: okResponse });
    renderSetKoordinator(false);

    await klik("Jadikan Koordinator");

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith(
      "/api/v1/sme-panel/{panel_id}",
      expect.objectContaining({
        params: { path: { panel_id: "pnl_1" } },
        body: { koordinator_id: "par_a" },
      }),
    );
    expect(toastSukses).toHaveBeenCalledWith("Koordinator panel diperbarui.");
    expect(refresh).toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("isKoordinator=true: mengirim koordinator_id null dan memberi tahu dikosongkan", async () => {
    patch.mockResolvedValue({ error: null, data: {}, response: okResponse });
    renderSetKoordinator(true);

    await klik("Batalkan Koordinator");

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith(
      "/api/v1/sme-panel/{panel_id}",
      expect.objectContaining({ body: { koordinator_id: null } }),
    );
    expect(toastSukses).toHaveBeenCalledWith("Koordinator panel dikosongkan.");
    expect(refresh).toHaveBeenCalled();
  });
});

describe("HapusAnggotaButton — regresi: notifikasi lewat toast, bukan alert()", () => {
  function renderHapus() {
    return render(<HapusAnggotaButton panelId="pnl_1" partisipanId="par_a" accessToken="tok" />);
  }

  it("DELETE gagal: toast.error dipanggil, alert() TIDAK dipanggil", async () => {
    del.mockResolvedValue(forbidden);
    renderHapus();

    await klik("Hapus");

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("Akses ditolak.", expect.anything());
    expect(alertSpy).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("DELETE sukses: toast.success + router.refresh, tanpa alert()", async () => {
    del.mockResolvedValue({ error: null, data: {}, response: okResponse });
    renderHapus();

    await klik("Hapus");

    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(del).toHaveBeenCalledWith(
      "/api/v1/sme-panel/{panel_id}/anggota/{partisipan_id}",
      expect.objectContaining({
        params: { path: { panel_id: "pnl_1", partisipan_id: "par_a" } },
      }),
    );
    expect(toastSukses).toHaveBeenCalledWith("Anggota berhasil dikeluarkan dari panel.");
    expect(refresh).toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("confirm dibatalkan: tidak ada panggilan DELETE sama sekali", async () => {
    vi.stubGlobal("confirm", () => false);
    renderHapus();

    await klik("Hapus");

    expect(del).not.toHaveBeenCalled();
    expect(toastSukses).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });
});

// ── AnggotaSection — regresi backlog 029 ─────────────────────────────────────
// Dulu: GET /partisipan dipanggil dengan klien `api` TELANJANG (tanpa Bearer) dan
// kegagalannya ditelan dua kali (`data?.items ?? []` + `.catch(() => setPartisipanList([]))`),
// sehingga 401 dari backend ber-guard tampil sebagai "Belum ada anggota" — panel yang
// sebenarnya berisi terlihat kosong, tanpa pesan error apa pun.

describe("AnggotaSection — regresi: GET /partisipan wajib berautentikasi & tidak boleh ditelan", () => {
  function renderSection(partisipanIds: string[] = ["par_a"]) {
    return render(
      <AnggotaSection
        panelId="pnl_1"
        partisipanIds={partisipanIds}
        koordinatorId={null}
        jabatanMap={{ jbt_1: { nama: "Guru Kelas" } }}
        accessToken="tok"
      />,
    );
  }

  const unauthorized = {
    data: undefined,
    error: { error: "unauthorized", message: "Token tidak valid." },
    response: { status: 401, headers: { get: () => "req-401" } },
  };

  function sukses(items: unknown[]) {
    return {
      data: { items, total: items.length },
      error: undefined,
      response: { status: 200, headers: { get: () => "req-1" } },
    };
  }

  it("memanggil GET lewat klien BERAUTENTIKASI (token diteruskan ke withServerAuth)", async () => {
    get.mockResolvedValue(sukses([]));
    await act(async () => {
      renderSection([]);
    });

    expect(tokenDipakai).toContain("tok");
    expect(get).toHaveBeenCalledWith(
      "/api/v1/partisipan",
      expect.objectContaining({ params: { query: { limit: 100 } } }),
    );
  });

  it("GET gagal (401): toast.error muncul DAN 'Belum ada anggota' TIDAK dirender", async () => {
    get.mockResolvedValue(unauthorized);
    await act(async () => {
      renderSection(["par_a"]);
    });

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError).toHaveBeenCalledWith("Token tidak valid.", expect.anything());
    // Inti regresi: kegagalan tidak boleh menyaru sebagai panel kosong.
    expect(screen.queryByText(/Belum ada anggota/i)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/Gagal memuat data partisipan/i);
  });

  it("GET gagal: state gagal-muat berbeda dari state kosong (tidak ada form tambah anggota)", async () => {
    get.mockResolvedValue(unauthorized);
    await act(async () => {
      renderSection(["par_a"]);
    });

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Tambah" })).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Semua partisipan sudah menjadi anggota panel ini/i),
    ).not.toBeInTheDocument();
  });

  it("GET sukses tapi 0 partisipan: state kosong yang SAH, tanpa toast error", async () => {
    get.mockResolvedValue(sukses([]));
    await act(async () => {
      renderSection([]);
    });

    await waitFor(() => expect(screen.getByText(/Belum ada anggota/i)).toBeInTheDocument());
    expect(toastError).not.toHaveBeenCalled();
    expect(screen.queryByText(/Gagal memuat data partisipan/i)).not.toBeInTheDocument();
  });

  it("GET sukses dengan anggota: tabel anggota dirender", async () => {
    get.mockResolvedValue(
      sukses([
        { id: "par_a", nama: "Ani", email: "ani@ypii.id", jabatan_utama_id: "jbt_1" },
        { id: "par_b", nama: "Budi", email: "budi@ypii.id", jabatan_utama_id: "jbt_1" },
      ]),
    );
    await act(async () => {
      renderSection(["par_a"]);
    });

    await waitFor(() => expect(screen.getByText("Ani")).toBeInTheDocument());
    expect(screen.queryByText(/Belum ada anggota/i)).not.toBeInTheDocument();
    expect(screen.getByText("Guru Kelas")).toBeInTheDocument();
    expect(toastError).not.toHaveBeenCalled();
  });
});
