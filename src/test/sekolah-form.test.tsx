import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import type { JenjangPendidikanRead } from "@/lib/api/schema";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const post = vi.fn();
vi.mock("@/lib/api/client", () => ({
  withServerAuth: () => ({ POST: post }),
}));

import { TambahSekolahForm } from "@/app/(auth)/master-data/sekolah/tambah/sekolah-form";

function jp(id: string, kode: string, nama: string): JenjangPendidikanRead {
  return { id, kode, nama } as unknown as JenjangPendidikanRead;
}

const jenjang = [jp("jp_sd", "SD", "Sekolah Dasar")];

const OK = {
  error: null,
  response: { headers: { get: () => "req-1" } },
};

function isiWajib() {
  fireEvent.change(screen.getByLabelText(/^Nama Sekolah/), {
    target: { value: "SD Negeri 1 Bandung" },
  });
  fireEvent.change(screen.getByLabelText(/^Jenjang Pendidikan/), {
    target: { value: "jp_sd" },
  });
}

function pilihCabang(nilai: string) {
  fireEvent.change(screen.getByLabelText(/^Cabang/), { target: { value: nilai } });
}

beforeEach(() => {
  push.mockReset();
  refresh.mockReset();
  post.mockReset();
  post.mockResolvedValue(OK);
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
});

describe("TambahSekolahForm — dropdown Cabang", () => {
  it("merender dua opsi (Bandung, Semarang) plus opsi belum ditentukan", () => {
    render(<TambahSekolahForm jenjang={jenjang} accessToken="tok" />);
    const select = screen.getByLabelText(/^Cabang/) as HTMLSelectElement;
    const opsi = Array.from(select.options).map((o) => o.value);
    expect(opsi).toEqual(["", "Bandung", "Semarang"]);
  });

  it("Cabang bersifat opsional — submit tanpa memilih cabang tetap berhasil dan tidak mengirim kunci cabang", async () => {
    render(<TambahSekolahForm jenjang={jenjang} accessToken="tok" />);

    await act(async () => {
      isiWajib();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tambah Sekolah/ }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const body = post.mock.calls[0][1].body;
    // `cabang: undefined` — konsisten dengan npsn/kota/provinsi opsional lain di form
    // ini; JSON.stringify (dipakai openapi-fetch) menghilangkan kunci bernilai
    // undefined, jadi payload jaringan memang tidak membawa "cabang" sama sekali.
    expect(body.cabang).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain('"cabang"');
    expect(vi.mocked(toast.success)).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/master-data/sekolah");
  });

  it("memilih cabang mengirim nilainya ke backend", async () => {
    render(<TambahSekolahForm jenjang={jenjang} accessToken="tok" />);

    await act(async () => {
      isiWajib();
      pilihCabang("Bandung");
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Tambah Sekolah/ }));
    });

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const body = post.mock.calls[0][1].body;
    expect(body).toMatchObject({ cabang: "Bandung" });
  });
});
