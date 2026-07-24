/**
 * `DaftarPilihTerpaginasi` — daftar kandidat multi-select yang dipaginasi
 * sendiri, terpisah dari paginasi URL tabel lain di halaman yang sama.
 *
 * Yang dijaga di sini: pemotongan halaman benar, centangan bertahan lintas
 * halaman (state pilihan milik pemanggil), ketiga tombol pilih mengirim
 * himpunan id yang tepat, dan kasus batas (muat satu halaman, kosong, `items`
 * menyusut saat berada di halaman terakhir).
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { DaftarPilihTerpaginasi, type ItemPilih } from "@/components/daftar-pilih-terpaginasi";

function buatItems(n: number): ItemPilih[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p-${i + 1}`,
    label: `Partisipan ${i + 1}`,
    keterangan: "Guru Kelas",
  }));
}

/** Pembungkus stateful: meniru form pemanggil yang memegang `terpilih`. */
function Harness({ items }: { items: ItemPilih[] }) {
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());
  return (
    <DaftarPilihTerpaginasi
      items={items}
      terpilih={terpilih}
      onToggle={(id) =>
        setTerpilih((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        })
      }
      onPilihSemua={(ids) => setTerpilih((prev) => new Set([...prev, ...ids]))}
      onBatalkan={() => setTerpilih(new Set())}
    />
  );
}

const noop = () => {};

describe("DaftarPilihTerpaginasi", () => {
  it("45 item → 20 baris + teks rentang; Berikutnya menampilkan baris 21–40", () => {
    render(
      <DaftarPilihTerpaginasi
        items={buatItems(45)}
        terpilih={new Set()}
        onToggle={noop}
        onPilihSemua={noop}
        onBatalkan={noop}
      />,
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(20);
    expect(screen.getByText("Menampilkan 1–20 dari 45")).toBeInTheDocument();
    expect(screen.getByText("Partisipan 1")).toBeInTheDocument();
    expect(screen.queryByText("Partisipan 21")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Berikutnya/ }));

    expect(screen.getByText("Menampilkan 21–40 dari 45")).toBeInTheDocument();
    expect(screen.getByText("Partisipan 21")).toBeInTheDocument();
    expect(screen.getByText("Partisipan 40")).toBeInTheDocument();
    expect(screen.queryByText("Partisipan 1")).not.toBeInTheDocument();
  });

  it("halaman terakhir memotong sisa item dan menonaktifkan Berikutnya", () => {
    render(
      <DaftarPilihTerpaginasi
        items={buatItems(45)}
        terpilih={new Set()}
        onToggle={noop}
        onPilihSemua={noop}
        onBatalkan={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Berikutnya/ }));
    fireEvent.click(screen.getByRole("button", { name: /Berikutnya/ }));

    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
    expect(screen.getByText("Menampilkan 41–45 dari 45")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Berikutnya/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Sebelumnya/ })).toBeEnabled();
  });

  it("centangan halaman 1 masih ada setelah pindah halaman lalu kembali", () => {
    render(<Harness items={buatItems(45)} />);
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: /Berikutnya/ }));
    expect(screen.getAllByRole("checkbox")[0]).not.toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: /Sebelumnya/ }));
    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
  });

  it("'Pilih semua (halaman ini)' hanya mengirim id halaman aktif", () => {
    const onPilihSemua = vi.fn();
    render(
      <DaftarPilihTerpaginasi
        items={buatItems(45)}
        terpilih={new Set()}
        onToggle={noop}
        onPilihSemua={onPilihSemua}
        onBatalkan={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Berikutnya/ }));
    fireEvent.click(screen.getByRole("button", { name: "Pilih semua (halaman ini)" }));

    expect(onPilihSemua).toHaveBeenCalledTimes(1);
    const ids = onPilihSemua.mock.calls[0][0] as string[];
    expect(ids).toHaveLength(20);
    expect(ids[0]).toBe("p-21");
    expect(ids[19]).toBe("p-40");
  });

  it("'Pilih semua (45)' mengirim seluruh 45 id", () => {
    const onPilihSemua = vi.fn();
    render(
      <DaftarPilihTerpaginasi
        items={buatItems(45)}
        terpilih={new Set()}
        onToggle={noop}
        onPilihSemua={onPilihSemua}
        onBatalkan={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Pilih semua (45)" }));

    const ids = onPilihSemua.mock.calls[0][0] as string[];
    expect(ids).toHaveLength(45);
    expect(ids[44]).toBe("p-45");
  });

  it("'Batalkan pilihan' mengosongkan seluruh centangan lintas halaman", () => {
    render(<Harness items={buatItems(45)} />);
    fireEvent.click(screen.getByRole("button", { name: "Pilih semua (45)" }));
    expect(screen.getAllByRole("checkbox").every((c) => (c as HTMLInputElement).checked)).toBe(
      true,
    );

    fireEvent.click(screen.getByRole("button", { name: "Batalkan pilihan" }));
    expect(screen.getAllByRole("checkbox").some((c) => (c as HTMLInputElement).checked)).toBe(
      false,
    );
  });

  it("items muat satu halaman → kontrol halaman tidak dirender", () => {
    render(
      <DaftarPilihTerpaginasi
        items={buatItems(20)}
        terpilih={new Set()}
        onToggle={noop}
        onPilihSemua={noop}
        onBatalkan={noop}
      />,
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(20);
    expect(screen.queryByRole("navigation", { name: "Navigasi halaman kandidat" })).toBeNull();
    expect(screen.queryByText(/Menampilkan/)).toBeNull();
  });

  it("items kosong → tidak crash, tanpa baris & tanpa kontrol halaman", () => {
    render(
      <DaftarPilihTerpaginasi
        items={[]}
        terpilih={new Set()}
        onToggle={noop}
        onPilihSemua={noop}
        onBatalkan={noop}
      />,
    );
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.queryByRole("navigation", { name: "Navigasi halaman kandidat" })).toBeNull();
    expect(screen.getByRole("button", { name: "Pilih semua (0)" })).toBeInTheDocument();
  });

  it("berada di halaman terakhir lalu items menyusut → halaman di-clamp, baris tetap tampil", () => {
    const { rerender } = render(
      <DaftarPilihTerpaginasi
        items={buatItems(45)}
        terpilih={new Set()}
        onToggle={noop}
        onPilihSemua={noop}
        onBatalkan={noop}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Berikutnya/ }));
    fireEvent.click(screen.getByRole("button", { name: /Berikutnya/ }));
    expect(screen.getByText("Menampilkan 41–45 dari 45")).toBeInTheDocument();

    // Setelah submit + router.refresh(), kandidat tersisa 25 → halaman 3 tidak ada lagi.
    rerender(
      <DaftarPilihTerpaginasi
        items={buatItems(25)}
        terpilih={new Set()}
        onToggle={noop}
        onPilihSemua={noop}
        onBatalkan={noop}
      />,
    );
    expect(screen.getByText("Menampilkan 21–25 dari 25")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(5);
    expect(screen.getByText("Partisipan 21")).toBeInTheDocument();
  });
});
