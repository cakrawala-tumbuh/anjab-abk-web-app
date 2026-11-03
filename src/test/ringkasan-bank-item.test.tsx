import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RingkasanBankItem } from "@/components/ringkasan-bank-item";
import { LencanaItemPaket } from "@/components/lencana-item-paket";
import { petakanGuard409 } from "@/lib/pesan-guard-409";
import { ApiError } from "@/lib/api/errors";

describe("RingkasanBankItem", () => {
  it("menampilkan 12 karakter pertama hash dan tiga angka", () => {
    render(
      <RingkasanBankItem
        itemBankHash={"abcdef0123456789".repeat(4)}
        jumlahItem={42}
        jumlahRedaksiBeda={3}
        jumlahTidakDiPaket={1}
      />,
    );
    expect(screen.getByText("abcdef012345")).toBeInTheDocument();
    expect(screen.queryByText(/abcdef0123456/)).toBeNull();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

describe("LencanaItemPaket", () => {
  it("SAMA tanpa kembar tidak merender apa pun", () => {
    const { container } = render(<LencanaItemPaket statusPaket="SAMA" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("petakanGuard409", () => {
  it("kode tak dikenal dan non-ApiError dikembalikan apa adanya", () => {
    const e = new ApiError({ code: "lain", message: "x" }, null, 409);
    expect(petakanGuard409(e)).toBe(e);
    const biasa = new Error("y");
    expect(petakanGuard409(biasa)).toBe(biasa);
  });

  it("kode dikenal: pesan diganti, requestId dipertahankan", () => {
    const e = new ApiError({ code: "catalog_in_use", message: "x" }, "rid", 409);
    const hasil = petakanGuard409(e) as ApiError;
    expect(hasil.message).toBe("Katalog masih dipakai sesi TI atau OPM — purge ditolak.");
    expect(hasil.requestId).toBe("rid");
  });
});
