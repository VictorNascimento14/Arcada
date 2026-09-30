import { describe, expect, it } from "vitest";

import type { ItemPlano, PlanoTratamento } from "@/dominio";

import { progressoDoPlano } from "./progresso";

const item = (id: string, feito: boolean): ItemPlano => ({ id, procedimentoId: "p1", preco: 10_000, ...(feito ? { realizadoEm: "2026-09-30" } : {}) });
const plano = (...itens: ItemPlano[]): PlanoTratamento => ({ id: "pl1", pacienteId: "pac1", itens, desconto: 0, situacao: "em-andamento" });

describe("progressoDoPlano", () => {
  it("conta os itens realizados sobre o total", () => {
    expect(progressoDoPlano(plano(item("a", true), item("b", false)))).toEqual({ feitos: 1, total: 2, pct: 50 });
  });

  it.each([
    [1, 3, 33],
    [2, 3, 67],
    [1, 8, 13], // 12,5 sobe: o meio vai para cima
    [0, 5, 0],
    [5, 5, 100],
  ])("%i de %i itens feitos é %i%%", (feitos, total, pct) => {
    const itens = Array.from({ length: total }, (_, i) => item(`i${i}`, i < feitos));
    expect(progressoDoPlano(plano(...itens))).toEqual({ feitos, total, pct });
  });

  it("plano sem itens tem tudo zerado, sem dividir por zero", () => {
    expect(progressoDoPlano(plano())).toEqual({ feitos: 0, total: 0, pct: 0 });
  });

  it("o valor do item não pesa: conta item, não dinheiro", () => {
    const barato: ItemPlano = { ...item("a", true), preco: 100 };
    const caro: ItemPlano = { ...item("b", false), preco: 900_000 };
    expect(progressoDoPlano(plano(barato, caro)).pct).toBe(50);
  });
});
