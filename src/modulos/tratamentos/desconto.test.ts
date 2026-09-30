import { describe, expect, it } from "vitest";

import type { PlanoTratamento } from "@/dominio";

import { aplicarDesconto, lerDesconto, type Desconto } from "./desconto";
import { total } from "./plano";

// Um plano com um item só, de `preco` centavos: o subtotal é o próprio preço.
const plano = (preco: number, desconto = 0): PlanoTratamento => ({
  id: "plano-1",
  pacienteId: "paciente-1",
  itens: preco > 0 ? [{ id: "item-1", procedimentoId: "proc-restauracao", dente: 16, faces: ["O"], preco }] : [],
  desconto,
  situacao: "proposto",
});

const percentual = (p: number): Desconto => ({ tipo: "percentual", percentual: p });
const valor = (v: number): Desconto => ({ tipo: "valor", valor: v });
const descontoDe = (preco: number, d: Desconto) => aplicarDesconto(plano(preco), d).desconto;

describe("aplicarDesconto: percentual", () => {
  it.each([
    [10000, 10, 1000], // R$ 100,00 a 10%: R$ 10,00
    [10000, 33.33, 3333],
    [12345, 12.5, 1543], // 1543,125: desce
    [3333, 10, 333], // 333,3: desce
    [3339, 10, 334], // 333,9: sobe
    [3335, 10, 334], // 333,5: o meio centavo sobe
    [1, 50, 1], // 0,5
    [1, 49, 0], // 0,49
    [10000, 0, 0],
    [10000, 100, 10000],
  ])("%i centavos a %f%%: %i", (preco, p, esperado) => {
    expect(descontoDe(preco, percentual(p))).toBe(esperado);
  });

  it.each([
    [5000, 0.57, 29], // 28,5 exato; em ponto flutuante 5000 * 0,57 dá 2849,9999… e o meio centavo desceria
    [11000, 0.35, 39], // 38,5
    [12500, 0.58, 73], // 72,5
    [5000, 1.13, 57], // 56,5
  ])("o meio centavo sobe também com percentual que o ponto flutuante não guarda: %i a %f%%", (preco, p, esperado) => {
    expect(descontoDe(preco, percentual(p))).toBe(esperado);
  });

  it("acima de 100% vira o subtotal", () => {
    expect(descontoDe(10000, percentual(250))).toBe(10000);
    expect(descontoDe(10000, percentual(Number.POSITIVE_INFINITY))).toBe(10000);
  });

  it("negativo, ou o que não é número, vale zero", () => {
    expect(descontoDe(10000, percentual(-5))).toBe(0);
    expect(descontoDe(10000, percentual(Number.NaN))).toBe(0);
  });
});

describe("aplicarDesconto: valor", () => {
  it.each([
    [10000, 1500, 1500],
    [10000, 0, 0],
    [10000, 10000, 10000], // igual ao subtotal zera o total
    [10000, 15000, 10000], // maior que o subtotal: limitado a ele
    [10000, -100, 0],
    [10000, Number.NaN, 0],
  ])("%i centavos, desconto de %i: %i", (preco, v, esperado) => {
    expect(descontoDe(preco, valor(v))).toBe(esperado);
  });
});

describe("aplicarDesconto: no plano", () => {
  it("guarda o desconto em centavos e o total sai do plano", () => {
    const comDesconto = aplicarDesconto(plano(10000), percentual(10));
    expect(comDesconto.desconto).toBe(1000);
    expect(total(comDesconto)).toBe(9000);
  });

  it("substitui o desconto que o plano já tinha, em vez de somar", () => {
    expect(aplicarDesconto(plano(10000, 500), valor(200)).desconto).toBe(200);
    const uma = aplicarDesconto(plano(10000), percentual(10));
    expect(aplicarDesconto(uma, percentual(10)).desconto).toBe(uma.desconto);
  });

  it("parte do subtotal com todos os itens, sem mexer no plano original", () => {
    const original: PlanoTratamento = {
      ...plano(0),
      itens: [
        { id: "a", procedimentoId: "proc-a", preco: 6000 },
        { id: "b", procedimentoId: "proc-b", preco: 4000 },
      ],
    };
    expect(aplicarDesconto(original, percentual(10)).desconto).toBe(1000);
    expect(original.desconto).toBe(0);
  });

  it("plano sem itens fica sem desconto", () => {
    expect(descontoDe(0, percentual(10))).toBe(0);
    expect(descontoDe(0, valor(500))).toBe(0);
  });

  it("o desconto é sempre um inteiro entre zero e o subtotal", () => {
    for (let preco = 1; preco <= 500; preco++) {
      for (const p of [0.01, 0.5, 1, 7.5, 12.5, 33.33, 50, 99.99, 100]) {
        const d = descontoDe(preco, percentual(p));
        expect(Number.isInteger(d) && d >= 0 && d <= preco).toBe(true);
      }
    }
  });
});

describe("lerDesconto", () => {
  it.each([
    ["percentual", "10", { tipo: "percentual", percentual: 10 }],
    ["percentual", " 12,5 ", { tipo: "percentual", percentual: 12.5 }],
    ["percentual", "12.5", { tipo: "percentual", percentual: 12.5 }],
    ["percentual", "0", { tipo: "percentual", percentual: 0 }],
    ["valor", "50,00", { tipo: "valor", valor: 5000 }],
    ["valor", "1.234,5", { tipo: "valor", valor: 123_450 }],
    ["valor", "0", { tipo: "valor", valor: 0 }],
  ] as const)("%s %j vira o desconto pedido", (tipo, texto, esperado) => {
    expect(lerDesconto(tipo, texto)).toEqual(esperado);
  });

  it.each([
    ["percentual", ""],
    ["percentual", "-5"],
    ["percentual", "10%"],
    ["percentual", "abc"],
    ["percentual", "1,234"],
    ["valor", ""],
    ["valor", "-5"],
    ["valor", "12,345"],
  ] as const)("%s %j não é desconto: devolve null", (tipo, texto) => {
    expect(lerDesconto(tipo, texto)).toBeNull();
  });
});
