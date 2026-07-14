import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { notifySukses, notifyGagal, pesanGagal } from "@/lib/notify";

const toastSuccess = vi.mocked(toast.success);
const toastError = vi.mocked(toast.error);

beforeEach(() => {
  toastSuccess.mockReset();
  toastError.mockReset();
});

describe("notifySukses", () => {
  it("meneruskan pesan apa adanya ke toast.success", () => {
    notifySukses("Sekolah berhasil ditambahkan.");
    expect(toastSuccess).toHaveBeenCalledWith("Sekolah berhasil ditambahkan.");
  });
});

describe("pesanGagal", () => {
  it("memakai message dari Error", () => {
    expect(pesanGagal(new Error("boom"))).toBe("boom");
  });

  it("memakai message dari ApiError", () => {
    const err = new ApiError({ code: "conflict", message: "Nama sudah dipakai." }, "req-1");
    expect(pesanGagal(err)).toBe("Nama sudah dipakai.");
  });

  it("fallback untuk nilai yang bukan Error", () => {
    expect(pesanGagal("bukan error")).toBe("Terjadi kesalahan.");
    expect(pesanGagal(null)).toBe("Terjadi kesalahan.");
    expect(pesanGagal(undefined)).toBe("Terjadi kesalahan.");
  });
});

describe("notifyGagal", () => {
  it("ApiError: menampilkan message + request id sebagai deskripsi", () => {
    notifyGagal(new ApiError({ code: "forbidden", message: "Akses ditolak." }, "req-123"));
    expect(toastError).toHaveBeenCalledWith(
      "Akses ditolak.",
      expect.objectContaining({ description: "ID permintaan: req-123" }),
    );
  });

  it("ApiError tanpa request id: tanpa deskripsi", () => {
    notifyGagal(new ApiError({ code: "forbidden", message: "Akses ditolak." }, null));
    expect(toastError).toHaveBeenCalledWith(
      "Akses ditolak.",
      expect.objectContaining({ description: undefined }),
    );
  });

  it("Error biasa: tanpa deskripsi", () => {
    notifyGagal(new Error("boom"));
    expect(toastError).toHaveBeenCalledWith(
      "boom",
      expect.objectContaining({ description: undefined }),
    );
  });

  it("nilai non-Error: memakai pesan fallback", () => {
    notifyGagal("bukan error");
    expect(toastError).toHaveBeenCalledWith("Terjadi kesalahan.", expect.anything());
  });

  it("toast error tidak hilang sendiri (duration: Infinity)", () => {
    notifyGagal(new Error("boom"));
    expect(toastError).toHaveBeenCalledWith(
      "boom",
      expect.objectContaining({ duration: Infinity }),
    );
  });
});
