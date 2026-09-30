import { describe, expect, it } from "vitest";

import type { ItemPlano, PlanoTratamento } from "@/dominio";

import { itensRealizados, subtotal, total } from "./plano";

const item = (id: string, preco: number, resto: Partial<ItemPlano> = {}): ItemPlano => ({
  id,
  procedimentoId: "proc-restauracao",
  preco,
  ...resto,
});

const plano = (itens: ItemPlano[], desconto = 0): PlanoTratamento => ({
  id: "plano-1",
  pacienteId: "paciente-1",
  itens,
  desconto,
  situacao: "proposto",
});

describe("subtotal", () => {
  it("soma os preços dos itens, em centavos", () => {
    expect(subtotal(plano([item("a", 12000), item("b", 8550), item("c", 30050)]))).toBe(50600);
  });

  it("conta cada item uma vez, mesmo com o mesmo procedimento em dentes diferentes", () => {
    const itens = [item("a", 9000, { dente: 16, faces: ["O", "M"] }), item("b", 9000, { dente: 26, faces: ["O"] })];
    expect(subtotal(plano(itens))).toBe(18000);
  });

  it("não desconta nada: o desconto entra só no total", () => {
    expect(subtotal(plano([item("a", 10000)], 2500))).toBe(10000);
  });

  it("plano sem itens dá zero", () => {
    expect(subtotal(plano([]))).toBe(0);
  });
});

describe("total", () => {
  it("é o subtotal menos o desconto", () => {
    expect(total(plano([item("a", 30000), item("b", 20600)], 600))).toBe(50000);
  });

  it("sem desconto, é o subtotal", () => {
    expect(total(plano([item("a", 30000), item("b", 20600)]))).toBe(50600);
  });

  it("desconto igual ao subtotal zera o total", () => {
    expect(total(plano([item("a", 10000)], 10000))).toBe(0);
  });

  it("desconto maior que o subtotal não deixa o total negativo", () => {
    // Sobrou de um item que saiu do plano depois de o desconto ser dado.
    expect(total(plano([item("a", 4000)], 10000))).toBe(0);
  });
});

describe("itensRealizados", () => {
  it("devolve só os itens com dia de realização, na ordem do plano", () => {
    const feito1 = item("a", 5000, { realizadoEm: "2026-09-01" });
    const aFazer = item("b", 7000);
    const feito2 = item("c", 3000, { realizadoEm: "2026-09-15" });
    expect(itensRealizados(plano([feito1, aFazer, feito2]))).toEqual([feito1, feito2]);
  });

  it("nenhum feito, ou plano sem itens, dá lista vazia", () => {
    expect(itensRealizados(plano([item("a", 5000), item("b", 7000)]))).toEqual([]);
    expect(itensRealizados(plano([]))).toEqual([]);
  });

  it("plano concluído devolve todos os itens", () => {
    const itens = [item("a", 5000, { realizadoEm: "2026-09-01" }), item("b", 7000, { realizadoEm: "2026-09-02" })];
    expect(itensRealizados(plano(itens))).toHaveLength(itens.length);
  });
});
