import { describe, expect, it } from "vitest";
import type { PartisipanRead, TiRespondenRead } from "@/lib/api/schema";
import { kandidatResponden } from "@/lib/task-inventory-kandidat";

function partisipan(id: string, nama: string): PartisipanRead {
  return { id, nama } as unknown as PartisipanRead;
}

function responden(id: string, partisipanId: string | null): TiRespondenRead {
  return { id, sesi_id: "tises_1", partisipan_id: partisipanId } as unknown as TiRespondenRead;
}

describe("kandidatResponden", () => {
  it("mengurangkan partisipan yang sudah jadi responden dari daftar kandidat", () => {
    const par = [partisipan("par_1", "A"), partisipan("par_2", "B"), partisipan("par_3", "C")];
    const resp = [responden("trsp_1", "par_2")];
    expect(kandidatResponden(par, resp)).toEqual([
      partisipan("par_1", "A"),
      partisipan("par_3", "C"),
    ]);
  });

  it("daftar responden kosong → hasil sama persis dengan daftar partisipan masukan", () => {
    const par = [partisipan("par_1", "A"), partisipan("par_2", "B")];
    expect(kandidatResponden(par, [])).toEqual(par);
  });

  it("responden ber-partisipan_id null (responden manual) tidak menggugurkan partisipan mana pun", () => {
    const par = [partisipan("par_1", "A"), partisipan("par_2", "B")];
    const resp = [responden("trsp_1", null), responden("trsp_2", null)];
    expect(kandidatResponden(par, resp)).toEqual(par);
  });

  it("seluruh partisipan sudah jadi responden → hasil array kosong", () => {
    const par = [partisipan("par_1", "A"), partisipan("par_2", "B")];
    const resp = [responden("trsp_1", "par_1"), responden("trsp_2", "par_2")];
    expect(kandidatResponden(par, resp)).toEqual([]);
  });
});
