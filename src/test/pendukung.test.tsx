/**
 * Data PENDUKUNG (pengisi dropdown / pelabel ID) — backlog 031.
 *
 * Inti yang diuji: kegagalan fetch data pendukung TIDAK BOLEH tampil sama dengan
 * "memang belum ada data". Dua kondisi ini harus terbedakan di layar:
 *   - 401/403/5xx  → penanda gagal TERLIHAT (<GagalMuatSebagian>)
 *   - 200, 0 item  → state kosong yang tenang, TANPA error palsu
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { bagianGagal, pendukungList } from "@/lib/api/pendukung";
import { GagalMuatSebagian } from "@/components/gagal-muat";

interface Jabatan {
  id: string;
  nama: string;
}

/** Tiruan respons gagal `openapi-fetch` (tanpa `data`). */
function resGagal(status: number, requestId = "req-401") {
  return {
    error: { error: "unauthorized", message: "Token tidak valid atau kedaluwarsa." },
    response: new Response(null, { status, headers: { "x-request-id": requestId } }),
  };
}

/** Tiruan respons sukses `openapi-fetch`. */
function resSukses(items: Jabatan[]) {
  return { data: { items }, response: new Response(null, { status: 200 }) };
}

describe("pendukungList", () => {
  it("fetch daftar jabatan gagal (401) → kegagalan DIPERTAHANKAN, bukan ditelan jadi []", () => {
    const hasil = pendukungList<Jabatan>("Daftar jabatan", resGagal(401));

    expect(hasil.data).toEqual([]);
    expect(hasil.gagal).not.toBeNull();
    expect(hasil.gagal?.nama).toBe("Daftar jabatan");
    expect(hasil.gagal?.err.status).toBe(401);
    expect(hasil.gagal?.err.message).toBe("Token tidak valid atau kedaluwarsa.");
    expect(hasil.gagal?.err.requestId).toBe("req-401");
  });

  it("fetch sukses 200 dengan 0 item → kekosongan SAH, tanpa penanda gagal", () => {
    const hasil = pendukungList<Jabatan>("Daftar jabatan", resSukses([]));

    expect(hasil.data).toEqual([]);
    expect(hasil.gagal).toBeNull();
  });

  it("fetch sukses dengan isi → data diteruskan apa adanya", () => {
    const hasil = pendukungList<Jabatan>("Daftar jabatan", resSukses([{ id: "j1", nama: "Guru" }]));

    expect(hasil.data).toEqual([{ id: "j1", nama: "Guru" }]);
    expect(hasil.gagal).toBeNull();
  });

  it("bagianGagal hanya mengumpulkan yang benar-benar gagal", () => {
    const jabatan = pendukungList<Jabatan>("Daftar jabatan", resGagal(500, "req-500"));
    const sekolah = pendukungList<Jabatan>("Daftar sekolah", resSukses([]));

    const bagian = bagianGagal(jabatan, sekolah);
    expect(bagian).toHaveLength(1);
    expect(bagian[0].nama).toBe("Daftar jabatan");
  });
});

describe("GagalMuatSebagian", () => {
  it("merender penanda gagal TERLIHAT saat data pendukung gagal (401)", () => {
    const jabatan = pendukungList<Jabatan>("Daftar jabatan", resGagal(401));
    render(<GagalMuatSebagian bagian={bagianGagal(jabatan)} />);

    const panel = screen.getByRole("alert");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveTextContent("Sebagian data pendukung gagal dimuat");
    expect(panel).toHaveTextContent("Daftar jabatan");
    expect(panel).toHaveTextContent("status 401");
    // X-Request-ID wajib terlihat supaya user bisa menyebutkannya saat melapor.
    expect(panel).toHaveTextContent("req-401");
    // Dan user harus tahu bahwa "kosong" di sini BUKAN berarti datanya belum ada.
    expect(panel).toHaveTextContent(/bukan/i);
  });

  it("TIDAK merender apa pun saat semua data pendukung sukses (tanpa error palsu)", () => {
    const jabatan = pendukungList<Jabatan>("Daftar jabatan", resSukses([]));
    const { container } = render(<GagalMuatSebagian bagian={bagianGagal(jabatan)} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
