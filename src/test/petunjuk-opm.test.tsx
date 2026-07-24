import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PetunjukOpm } from "@/app/(auth)/opm/isi/[responden_id]/petunjuk-opm";

describe("PetunjukOpm", () => {
  it("defaultOpen=true → dialog + frasa kunci Criticality", () => {
    render(<PetunjukOpm defaultOpen={true} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getAllByText(/Criticality/).length).toBeGreaterThan(0);
  });

  it("defaultOpen=false → dialog tidak ter-render", () => {
    render(<PetunjukOpm defaultOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("merender makna nilai 2-4 (bukan hanya anchor 1 & 5) dan kedua contoh kontras", () => {
    render(<PetunjukOpm defaultOpen={true} />);
    expect(screen.getAllByText(/Bulanan/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dampak sedang/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Beberapa kali dalam setahun/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Contoh A\./).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Contoh B\./).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mendampingi lomba tingkat kecamatan/).length).toBeGreaterThan(0);
  });
});
