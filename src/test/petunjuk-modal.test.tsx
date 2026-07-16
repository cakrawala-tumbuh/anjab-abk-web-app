import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PetunjukModal } from "@/components/petunjuk-modal";

function renderModal(defaultOpen: boolean) {
  return render(
    <PetunjukModal title="Judul Uji" defaultOpen={defaultOpen}>
      <p>Isi petunjuk uji.</p>
    </PetunjukModal>,
  );
}

describe("PetunjukModal", () => {
  it("defaultOpen=false → dialog tidak ter-render saat mount", () => {
    renderModal(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("defaultOpen=true → dialog ter-render, title & children tampil", () => {
    renderModal(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Judul Uji")).toBeInTheDocument();
    expect(screen.getByText("Isi petunjuk uji.")).toBeInTheDocument();
  });

  it("klik tombol trigger → dialog muncul", () => {
    renderModal(false);
    fireEvent.click(screen.getByRole("button", { name: /Petunjuk Pengisian/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("klik X → dialog tertutup", () => {
    renderModal(true);
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("klik CTA → dialog tertutup", () => {
    renderModal(true);
    fireEvent.click(screen.getByRole("button", { name: /Saya Mengerti, Mulai Mengisi/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("klik backdrop → dialog tertutup", () => {
    renderModal(true);
    const backdrop = screen.getByRole("dialog").parentElement as HTMLElement;
    fireEvent.click(backdrop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("tekan Escape → dialog tertutup", () => {
    renderModal(true);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ctaLabel & triggerLabel dapat dikustom", () => {
    render(
      <PetunjukModal
        title="Judul Uji"
        defaultOpen={true}
        ctaLabel="Saya Mengerti"
        triggerLabel="Lihat Petunjuk"
      >
        <p>Isi.</p>
      </PetunjukModal>,
    );
    expect(screen.getByRole("button", { name: "Lihat Petunjuk" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saya Mengerti" })).toBeInTheDocument();
  });
});
