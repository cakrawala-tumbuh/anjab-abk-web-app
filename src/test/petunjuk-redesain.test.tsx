import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { PetunjukKonteks } from "@/app/(auth)/redesain/konteks/petunjuk-konteks";
import { PetunjukMasalah } from "@/app/(auth)/redesain/masalah/petunjuk-masalah";
import { PetunjukDetailMasalah } from "@/app/(auth)/redesain/masalah/[id]/petunjuk-detail-masalah";
import { PetunjukAgendaYayasan } from "@/app/(auth)/redesain/agenda-yayasan/petunjuk-agenda-yayasan";
import { PetunjukRingkasanYayasan } from "@/app/(auth)/redesain/yayasan/petunjuk-ringkasan-yayasan";
import { PetunjukKonfirmasi } from "@/app/(auth)/redesain-sekolah/konfirmasi/[id]/petunjuk-konfirmasi";

const TIM: Array<[string, ReactElement, string]> = [
  ["Konteks", <PetunjukKonteks key="k" />, "Petunjuk: Konteks Redesain"],
  ["Masalah", <PetunjukMasalah key="m" />, "Petunjuk: Masalah Redesain"],
  ["Detail Masalah", <PetunjukDetailMasalah key="d" />, "Petunjuk: Detail Masalah"],
  ["Agenda Yayasan", <PetunjukAgendaYayasan key="a" />, "Petunjuk: Agenda Yayasan"],
  ["Ringkasan Yayasan", <PetunjukRingkasanYayasan key="r" />, "Petunjuk: Ringkasan Yayasan"],
];

describe.each(TIM)("Petunjuk Tim Kajian: %s", (_nama, elemen, judul) => {
  it("tidak membuka dialog saat mount", () => {
    render(elemen);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("klik pemicu → dialog berjudul halaman tampil", () => {
    render(elemen);
    fireEvent.click(screen.getByRole("button", { name: /^Petunjuk$/ }));
    expect(screen.getByRole("dialog", { name: judul })).toBeInTheDocument();
  });

  it("menyebut IK-10 dan bukan IK-11", () => {
    render(elemen);
    fireEvent.click(screen.getByRole("button", { name: /^Petunjuk$/ }));
    const teks = screen.getByRole("dialog").textContent ?? "";
    expect(teks).toContain("IK-10 Redesain Pekerjaan");
    expect(teks).not.toContain("IK-11");
  });

  it("tombol Mengerti menutup dialog", () => {
    render(elemen);
    fireEvent.click(screen.getByRole("button", { name: /^Petunjuk$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Mengerti" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("PetunjukKonfirmasi (wizard sekolah)", () => {
  it("defaultOpen=true → dialog ada saat mount", () => {
    render(<PetunjukKonfirmasi defaultOpen={true} />);
    expect(
      screen.getByRole("dialog", { name: "Petunjuk: Konfirmasi Redesain" }),
    ).toBeInTheDocument();
  });

  it("defaultOpen=false (terkirim) → tidak ada dialog", () => {
    render(<PetunjukKonfirmasi defaultOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("klik pemicu → dialog tampil dan menyebut IK-11", () => {
    render(<PetunjukKonfirmasi defaultOpen={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Petunjuk Pengisian/ }));
    const teks = screen.getByRole("dialog").textContent ?? "";
    expect(teks).toContain("IK-11 Konfirmasi Redesain");
    expect(teks).not.toContain("IK-10");
  });
});
