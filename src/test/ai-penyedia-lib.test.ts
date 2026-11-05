import { describe, it, expect } from "vitest";
import {
  cliLanggananSiap,
  labelMode,
  perluPeringatanCli,
  teksStatusKunci,
} from "@/lib/ai-penyedia";

describe("labelMode", () => {
  it("memetakan ketiga mode ke label", () => {
    expect(labelMode("MATI")).toBe("Mati");
    expect(labelMode("API_ANTHROPIC")).toBe("Anthropic API");
    expect(labelMode("LANGGANAN_CLAUDE")).toBe("Langganan Anthropic (Pro/Max)");
  });
  it("mode tak dikenal dikembalikan apa adanya", () => {
    expect(labelMode("BARU")).toBe("BARU");
  });
});

describe("perluPeringatanCli / cliLanggananSiap", () => {
  const cli = (terpasang: boolean, masuk: boolean) => ({
    langganan_cli_terpasang: terpasang,
    langganan_cli_masuk: masuk,
  });
  it("siap hanya bila terpasang dan masuk", () => {
    expect(cliLanggananSiap(cli(true, true))).toBe(true);
    expect(cliLanggananSiap(cli(true, false))).toBe(false);
    expect(cliLanggananSiap(cli(false, true))).toBe(false);
  });
  it("peringatan hanya untuk mode langganan dengan CLI belum siap", () => {
    expect(perluPeringatanCli({ mode: "LANGGANAN_CLAUDE", ...cli(false, false) })).toBe(true);
    expect(perluPeringatanCli({ mode: "LANGGANAN_CLAUDE", ...cli(true, false) })).toBe(true);
    expect(perluPeringatanCli({ mode: "LANGGANAN_CLAUDE", ...cli(true, true) })).toBe(false);
    expect(perluPeringatanCli({ mode: "API_ANTHROPIC", ...cli(false, false) })).toBe(false);
    expect(perluPeringatanCli({ mode: "MATI", ...cli(false, false) })).toBe(false);
  });
});

describe("teksStatusKunci", () => {
  it("belum terpasang", () => {
    expect(teksStatusKunci({ kredensial_terpasang: false, kredensial_akhiran: null })).toBe(
      "Belum terpasang",
    );
  });
  it("terpasang menampilkan … + akhiran", () => {
    expect(teksStatusKunci({ kredensial_terpasang: true, kredensial_akhiran: "wxyz" })).toBe(
      "Terpasang …wxyz",
    );
  });
  it("terpasang tanpa akhiran tidak mengarang akhiran", () => {
    expect(teksStatusKunci({ kredensial_terpasang: true, kredensial_akhiran: null })).toBe(
      "Terpasang",
    );
  });
});
