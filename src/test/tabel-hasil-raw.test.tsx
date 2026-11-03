import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TabelHasilRaw, kelompokkanItem } from "@/components/tabel-hasil-raw";
import type { HasilRawItemRead } from "@/lib/api/schema";

function item(over: Partial<HasilRawItemRead>): HasilRawItemRead {
  return {
    item_id: "D1a",
    kelompok_kode: "DEMAND",
    urutan: 1,
    n: 7,
    n_kosong: 0,
    frekuensi: { "1": 0, "2": 1, "3": 2, "4": 3, "5": 1 },
    mean_raw: 3.57,
    sd_raw: 0.98,
    ...over,
  };
}

describe("TabelHasilRaw", () => {
  it("dua item dari dua kelompok → dua grup; frekuensi dan mean tampil", () => {
    render(
      <TabelHasilRaw
        items={[item({}), item({ item_id: "C1a", kelompok_kode: "CONTROL", mean_raw: 2.5 })]}
      />,
    );
    expect(screen.getAllByRole("table")).toHaveLength(2);
    const demand = screen.getByRole("region", { name: "Kelompok DEMAND" });
    const baris = within(demand).getByText("D1a").closest("tr")!;
    expect(within(baris).getByText("3.57")).toBeInTheDocument();
    expect(within(baris).getByText("0.98")).toBeInTheDocument();
    expect(within(baris).getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Kelompok CONTROL" })).toBeInTheDocument();
  });

  it("mean_raw dan sd_raw null → '—', bukan 0", () => {
    render(<TabelHasilRaw items={[item({ n: 0, mean_raw: null, sd_raw: null })]} />);
    const baris = screen.getByText("D1a").closest("tr")!;
    expect(within(baris).getAllByText("—")).toHaveLength(2);
    expect(within(baris).queryByText("0.00")).toBeNull();
  });

  it("kelompokkanItem mempertahankan urutan kemunculan kelompok", () => {
    const g = kelompokkanItem([
      item({ item_id: "a", kelompok_kode: "B" }),
      item({ item_id: "b", kelompok_kode: "A" }),
      item({ item_id: "c", kelompok_kode: "B" }),
    ]);
    expect(g.map(([k, v]) => [k, v.length])).toEqual([
      ["B", 2],
      ["A", 1],
    ]);
  });
});
