import { describe, expect, it } from "vitest";

import type { ItemPlano } from "@/dominio";

import { detalheDoItem, rotuloItens } from "./exibicao";

const base: ItemPlano = { id: "i1", procedimentoId: "p1", preco: 1_000 };

describe("detalheDoItem", () => {
  it.each<[string, ItemPlano, string]>([
    ["sem dente", base, ""],
    ["dente sem face", { ...base, dente: 46 }, "Dente 46 · primeiro molar inferior direito"],
    ["uma face", { ...base, dente: 16, faces: ["O"] }, "Dente 16 · primeiro molar superior direito · face oclusal"],
    ["duas faces", { ...base, dente: 16, faces: ["M", "O"] }, "Dente 16 · primeiro molar superior direito · faces mesial, oclusal"],
    ["dente que a FDI não tem: só o número, sem quebrar", { ...base, dente: 99 }, "Dente 99"],
  ])("%s", (_caso, item, esperado) => {
    expect(detalheDoItem(item)).toBe(esperado);
  });
});

describe("rotuloItens", () => {
  it("põe no singular só o um", () => {
    expect([0, 1, 2].map(rotuloItens)).toEqual(["0 itens", "1 item", "2 itens"]);
  });
});
