import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Pagination, UKURAN_HALAMAN, nomorHalaman, offsetHalaman } from "@/components/pagination";

describe("Pagination — teks rentang & href navigasi", () => {
  it("total=137, offset=20 → teks 'Menampilkan 21–40 dari 137' dan href Berikutnya berisi hlm=3 + query lain dipertahankan", () => {
    render(
      <Pagination
        total={137}
        offset={20}
        pageSize={20}
        paramKey="hlm"
        basePath="/master-data/jabatan"
        searchParams={{ hlm: "2", q: "guru" }}
      />,
    );

    expect(screen.getByText("Menampilkan 21–40 dari 137")).toBeInTheDocument();

    const next = screen.getByRole("link", { name: /Berikutnya/ });
    const href = next.getAttribute("href") ?? "";
    expect(href).toContain("hlm=3");
    expect(href).toContain("q=guru");

    // Halaman 2 → Sebelumnya aktif menuju halaman 1.
    const prev = screen.getByRole("link", { name: /Sebelumnya/ });
    expect(prev.getAttribute("href") ?? "").toContain("hlm=1");
  });

  it("paramKey per tabel: href hanya mengubah hlm_responden, hlm_task dipertahankan", () => {
    render(
      <Pagination
        total={100}
        offset={0}
        pageSize={20}
        paramKey="hlm_responden"
        basePath="/opm/1"
        searchParams={{ hlm_task: "2", hlm_responden: "1" }}
      />,
    );

    const next = screen.getByRole("link", { name: /Berikutnya/ });
    const href = next.getAttribute("href") ?? "";
    expect(href).toContain("hlm_responden=2");
    expect(href).toContain("hlm_task=2");
  });
});

describe("Pagination — kasus tepi", () => {
  it("total <= pageSize → tidak merender kontrol apa pun", () => {
    const { container } = render(
      <Pagination
        total={20}
        offset={0}
        pageSize={20}
        paramKey="hlm"
        basePath="/x"
        searchParams={{}}
      />,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("halaman 1 → tidak ada tautan 'Sebelumnya' yang aktif", () => {
    render(
      <Pagination
        total={100}
        offset={0}
        pageSize={20}
        paramKey="hlm"
        basePath="/x"
        searchParams={{}}
      />,
    );
    expect(screen.queryByRole("link", { name: /Sebelumnya/ })).toBeNull();
    // Berikutnya tetap aktif di halaman 1.
    expect(screen.getByRole("link", { name: /Berikutnya/ })).toBeInTheDocument();
  });

  it("halaman terakhir → tidak ada tautan 'Berikutnya' yang aktif", () => {
    render(
      <Pagination
        total={100}
        offset={80}
        pageSize={20}
        paramKey="hlm"
        basePath="/x"
        searchParams={{}}
      />,
    );
    expect(screen.queryByRole("link", { name: /Berikutnya/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Sebelumnya/ })).toBeInTheDocument();
    expect(screen.getByText("Menampilkan 81–100 dari 100")).toBeInTheDocument();
  });
});

describe("nomorHalaman & offsetHalaman", () => {
  it("nilai kosong/tak-valid/<1 jatuh ke halaman 1", () => {
    expect(nomorHalaman(undefined)).toBe(1);
    expect(nomorHalaman("")).toBe(1);
    expect(nomorHalaman("0")).toBe(1);
    expect(nomorHalaman("-3")).toBe(1);
    expect(nomorHalaman("abc")).toBe(1);
    expect(nomorHalaman("3")).toBe(3);
    expect(nomorHalaman(["4", "9"])).toBe(4);
  });

  it("offsetHalaman = (halaman - 1) * UKURAN_HALAMAN", () => {
    expect(offsetHalaman({ hlm: "1" }, "hlm")).toBe(0);
    expect(offsetHalaman({ hlm: "3" }, "hlm")).toBe(2 * UKURAN_HALAMAN);
    expect(offsetHalaman({}, "hlm")).toBe(0);
  });
});
