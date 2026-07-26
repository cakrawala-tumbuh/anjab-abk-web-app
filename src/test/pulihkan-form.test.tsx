import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PulihkanForm } from "@/app/(auth)/backup/pulihkan-form";

beforeEach(() => {
  vi.unstubAllGlobals();
});

function isiForm(berkasNama = "backup.dump", konfirmasi = "anjab_abk") {
  const fileInput = screen.getByLabelText(/Berkas cadangan/) as HTMLInputElement;
  const file = new File(["dump"], berkasNama, { type: "application/octet-stream" });
  fireEvent.change(fileInput, { target: { files: [file] } });

  const konfirmasiInput = screen.getByLabelText(/Ketik nama basis data/) as HTMLInputElement;
  fireEvent.change(konfirmasiInput, { target: { value: konfirmasi } });
}

describe("PulihkanForm", () => {
  it("tombol nonaktif saat berkas dan konfirmasi masih kosong", () => {
    render(<PulihkanForm />);
    expect(screen.getByRole("button", { name: /Pulihkan Basis Data/ })).toBeDisabled();
  });

  it("tombol nonaktif bila hanya salah satu dari berkas/konfirmasi terisi", () => {
    render(<PulihkanForm />);
    const konfirmasiInput = screen.getByLabelText(/Ketik nama basis data/);
    fireEvent.change(konfirmasiInput, { target: { value: "anjab_abk" } });
    expect(screen.getByRole("button", { name: /Pulihkan Basis Data/ })).toBeDisabled();
  });

  it("tombol aktif setelah berkas dan konfirmasi terisi, lalu terkunci selama proses berjalan", async () => {
    let resolveFetch: (value: Response) => void = () => {};
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    const fetchSpy = vi.fn().mockReturnValue(fetchPromise);
    vi.stubGlobal("fetch", fetchSpy);

    render(<PulihkanForm />);
    isiForm();

    const button = screen.getByRole("button", { name: /Pulihkan Basis Data/ });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    expect(screen.getByRole("button", { name: /Memulihkan…/ })).toBeInTheDocument();

    await act(async () => {
      resolveFetch(
        new Response(JSON.stringify({ status: "ok", peringatan: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
      await fetchPromise;
    });

    expect(await screen.findByText(/Pemulihan berhasil/)).toBeInTheDocument();
  });

  it("meneruskan FormData berkas + konfirmasi ke /api/backup/pulihkan", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", peringatan: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    render(<PulihkanForm />);
    isiForm("cadangan.dump", "anjab_abk_db");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Pulihkan Basis Data/ }));
    });

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/backup/pulihkan");
    const fd = init.body as FormData;
    expect(fd.get("konfirmasi")).toBe("anjab_abk_db");
    expect((fd.get("berkas") as File).name).toBe("cadangan.dump");
  });

  it("menampilkan isi peringatan RestoreResult bila ada", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "ok",
          revisi_alembic: "fd3dd550aa99",
          peringatan: ["Skema tidak sinkron dengan head aplikasi."],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchSpy);

    render(<PulihkanForm />);
    isiForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Pulihkan Basis Data/ }));
    });

    expect(
      await screen.findByText("Skema tidak sinkron dengan head aplikasi."),
    ).toBeInTheDocument();
  });

  it.each([
    [422, "confirmation_mismatch", "Konfirmasi tidak cocok dengan nama basis data."],
    [413, "payload_too_large", "Berkas melebihi batas ukuran unggahan restore."],
    [403, "forbidden", "Bukan admin."],
  ])(
    "status %i dari backend menampilkan pesan spesifik yang berbeda",
    async (status, kode, pesan) => {
      const fetchSpy = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: kode, message: pesan }), {
          status,
          headers: { "content-type": "application/json" },
        }),
      );
      vi.stubGlobal("fetch", fetchSpy);

      render(<PulihkanForm />);
      isiForm();

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Pulihkan Basis Data/ }));
      });

      expect(await screen.findByText(pesan)).toBeInTheDocument();
    },
  );
});
