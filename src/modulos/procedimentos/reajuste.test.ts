import { beforeEach, describe, expect, it } from "vitest";

import { procedimentos } from "@/dados/colecoes";
import type { Procedimento } from "@/dominio";

import { aplicarReajuste, lerPercentual, reajustarPreco } from "./reajuste";

const proc = (id: string, preco: number): Procedimento => ({
  id,
  nome: `Procedimento ${id}`,
  especialidade: "Dentística",
  preco,
  duracaoMin: 30,
  exigeDente: false,
  exigeFace: false,
  ativo: true,
});

describe("lerPercentual", () => {
  it("lê inteiro, decimal com vírgula ou ponto, e o sinal", () => {
    expect(lerPercentual("5")).toBe(5);
    expect(lerPercentual("-10")).toBe(-10);
    expect(lerPercentual("+7,5")).toBe(7.5);
    expect(lerPercentual("12.25")).toBe(12.25);
    expect(lerPercentual("  -0,5 ")).toBe(-0.5);
    expect(lerPercentual("0")).toBe(0);
  });

  it("recusa vazio, texto solto, três casas, sinal duplo e o que passa dos limites", () => {
    for (const ruim of ["", " ", "abc", "5%", "1,234", "--5", "- 5", "5,", ",5", "1e2", "-100,01", "1.000"]) {
      expect(lerPercentual(ruim), `"${ruim}"`).toBeNull();
    }
    expect(lerPercentual("-100")).toBe(-100); // o preço zera, mas não fica negativo
    expect(lerPercentual("999,99")).toBe(999.99);
  });
});

describe("reajustarPreco", () => {
  it("aumenta e reduz pelo percentual, em centavos inteiros", () => {
    expect(reajustarPreco(18000, 10)).toBe(19800);
    expect(reajustarPreco(18000, -10)).toBe(16200);
    expect(reajustarPreco(18000, 0)).toBe(18000);
    expect(reajustarPreco(18000, -100)).toBe(0);
    expect(Number.isInteger(reajustarPreco(12345, 7.77))).toBe(true);
  });

  it("arredonda para o centavo mais próximo: 0,4 desce e 0,6 sobe", () => {
    expect(reajustarPreco(1004, 1)).toBe(1014); // 1014,04
    expect(reajustarPreco(1006, 1)).toBe(1016); // 1016,06
    expect(reajustarPreco(1006, -1)).toBe(996); // 995,94
    expect(reajustarPreco(1004, -1)).toBe(994); // 993,96
  });

  it("o meio centavo sobe, sem o erro do ponto flutuante, no aumento e na redução", () => {
    expect(reajustarPreco(5700, 0.5)).toBe(5729); // 5728,5 — em ponto flutuante, 5700 * 1,005 dá 5728,4999… e desceria
    expect(reajustarPreco(5700, -0.5)).toBe(5672); // 5671,5
    expect(reajustarPreco(4250, -6.2)).toBe(3987); // 3986,5 — em ponto flutuante, 3986,4999…
  });

  it("arredonda para duas casas o percentual que traz mais", () => {
    expect(reajustarPreco(10000, 2.499)).toBe(10250); // 2,5%
  });
});

describe("aplicarReajuste", () => {
  beforeEach(() => {
    localStorage.clear();
    procedimentos.substituirTudo([proc("a", 18000), proc("b", 5700), proc("c", 4500)]);
  });

  it("reajusta só os escolhidos, mexe só no preço e devolve quantos mudaram", () => {
    const antes = procedimentos.obter("a")!;

    expect(aplicarReajuste(["a", "b"], 10)).toBe(2);

    expect(procedimentos.obter("a")).toEqual({ ...antes, preco: 19800 });
    expect(procedimentos.obter("b")!.preco).toBe(6270);
    expect(procedimentos.obter("c")!.preco).toBe(4500); // fora da escolha
    expect(procedimentos.listar().map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("não conta o que o arredondamento deixa como está, e ignora id que não existe", () => {
    procedimentos.substituirTudo([proc("a", 18000), proc("b", 10)]);

    expect(aplicarReajuste(["a", "b", "fantasma"], 1)).toBe(1); // 10 centavos com 1% continuam 10
    expect(procedimentos.obter("b")!.preco).toBe(10);
    expect(aplicarReajuste(["a"], 0)).toBe(0);
    expect(procedimentos.obter("a")!.preco).toBe(18180);
  });

  it("percentual fora de -100 a 1000, ou que não é número, lança e não grava nada", () => {
    for (const ruim of [-100.01, 1000.01, NaN, Infinity]) {
      expect(() => aplicarReajuste(["a"], ruim), String(ruim)).toThrow(RangeError);
    }
    expect(procedimentos.listar().map((p) => p.preco)).toEqual([18000, 5700, 4500]);
  });
});
