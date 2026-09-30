import { describe, expect, it } from "vitest";

import { valorPorExtenso } from "./extenso";

const reais = (n: number) => n * 100;

describe("valorPorExtenso", () => {
  it.each([
    [12050, "cento e vinte reais e cinquenta centavos"],
    [reais(1), "um real"],
    [reais(1001), "mil e um reais"],
    [reais(1_000_000), "um milhão de reais"],
  ])("os exemplos do recibo: %i centavos → %s", (centavos, esperado) => {
    expect(valorPorExtenso(centavos)).toBe(esperado);
  });

  it.each([
    [0, "zero real"],
    [1, "um centavo"],
    [2, "dois centavos"],
    [10, "dez centavos"],
    [21, "vinte e um centavos"],
    [50, "cinquenta centavos"],
    [99, "noventa e nove centavos"],
    [101, "um real e um centavo"],
    [reais(2) + 2, "dois reais e dois centavos"],
    [reais(999) + 99, "novecentos e noventa e nove reais e noventa e nove centavos"],
  ])("centavos e zero: %i → %s", (centavos, esperado) => {
    expect(valorPorExtenso(centavos)).toBe(esperado);
  });

  it.each([
    [2, "dois reais"],
    [10, "dez reais"],
    [19, "dezenove reais"],
    [20, "vinte reais"],
    [21, "vinte e um reais"],
    [100, "cem reais"],
    [101, "cento e um reais"],
    [110, "cento e dez reais"],
    [120, "cento e vinte reais"],
    [200, "duzentos reais"],
    [999, "novecentos e noventa e nove reais"],
  ])("até 999: R$ %i → %s", (valor, esperado) => {
    expect(valorPorExtenso(reais(valor))).toBe(esperado);
  });

  it.each([
    [1000, "mil reais"],
    [1001, "mil e um reais"],
    [1020, "mil e vinte reais"],
    [1100, "mil e cem reais"],
    [1200, "mil e duzentos reais"],
    [1101, "mil cento e um reais"],
    [1234, "mil duzentos e trinta e quatro reais"],
    [2500, "dois mil e quinhentos reais"],
    [2501, "dois mil quinhentos e um reais"],
    [21_000, "vinte e um mil reais"],
    [100_000, "cem mil reais"],
    [100_100, "cem mil e cem reais"],
    [100_500, "cem mil e quinhentos reais"],
    [101_000, "cento e um mil reais"],
    [101_101, "cento e um mil cento e um reais"],
  ])("milhares: o \"e\" só antes do último grupo se ele for < 100 ou redondo — R$ %i → %s", (valor, esperado) => {
    expect(valorPorExtenso(reais(valor))).toBe(esperado);
  });

  it.each([
    [1_000_000, "um milhão de reais"],
    [2_000_000, "dois milhões de reais"],
    [1_000_001, "um milhão e um reais"],
    [1_001_000, "um milhão e mil reais"],
    [1_100_000, "um milhão e cem mil reais"],
    [1_500_000, "um milhão e quinhentos mil reais"],
    [1_234_567, "um milhão duzentos e trinta e quatro mil quinhentos e sessenta e sete reais"],
    [1_000_000_000, "um bilhão de reais"],
    [2_000_000_000, "dois bilhões de reais"],
    [3_001_000_000, "três bilhões e um milhão de reais"],
    [1_000_000_000_000, "um trilhão de reais"],
  ])("milhão em diante: R$ %i → %s", (valor, esperado) => {
    expect(valorPorExtenso(reais(valor))).toBe(esperado);
  });

  it("põe o \"de\" só quando o valor termina em milhão redondo, também com centavos", () => {
    expect(valorPorExtenso(reais(1_000_000) + 50)).toBe("um milhão de reais e cinquenta centavos");
    expect(valorPorExtenso(reais(1_000_001) + 50)).toBe("um milhão e um reais e cinquenta centavos");
  });

  it("escreve o maior inteiro seguro em centavos (R$ 90 trilhões)", () => {
    expect(valorPorExtenso(Number.MAX_SAFE_INTEGER)).toBe(
      "noventa trilhões setenta e um bilhões novecentos e noventa e dois milhões quinhentos e quarenta e sete mil quatrocentos e nove reais e noventa e um centavos",
    );
  });

  it.each([-1, 1.5, 120.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "recusa %s, que não é um valor em centavos",
    (centavos) => {
      expect(() => valorPorExtenso(centavos)).toThrow(RangeError);
    },
  );
});
