import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PetunjukTs } from "@/app/(auth)/time-study/isi/[penugasan_id]/petunjuk-ts";

describe("PetunjukTs", () => {
  it("defaultOpen=true → dialog, definisi/contoh kategori, kriteria Kategori Hari, dan contoh pengisian", () => {
    render(<PetunjukTs defaultOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Keenam label kategori, identik dengan KATEGORI di ts-log-form.tsx.
    // getAllByText karena tiap label muncul dua kali (definisi & kartu contoh).
    expect(screen.getAllByText("Pekerjaan Inti").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Asesmen Karakter").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pengembangan Diri").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pekerjaan Strategis").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Administrasi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Istirahat Terstruktur").length).toBeGreaterThan(0);

    // Contoh aktivitas per kategori (bukan hanya nama kategori).
    expect(screen.getByText(/mengajar di kelas/)).toBeInTheDocument();
    expect(screen.getByText(/KKG\/MGMP/)).toBeInTheDocument();

    // Kriteria Kategori Hari, bukan sekadar nama.
    expect(screen.getAllByText(/Hari Puncak/).length).toBeGreaterThan(0);
    expect(screen.getByText(/pekan ujian, akreditasi, PPDB/)).toBeInTheDocument();

    // Blok "Contoh Pengisian (ilustrasi)".
    expect(screen.getByText(/Contoh Pengisian/)).toBeInTheDocument();
    expect(screen.getByText(/07\.00/)).toBeInTheDocument();
  });

  it("defaultOpen=false → dialog tidak ter-render", () => {
    render(<PetunjukTs defaultOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
