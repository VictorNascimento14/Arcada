import { describe, expect, it } from "vitest";

import { formatarReais, paraCentavos, somarCentavos } from "./dinheiro";

// O Intl separa o "R$" do número com espaço NÃO separável (U+00A0), não com o espaço comum.
const NBSP = "\u00a0";

describe("formatarReais", () => {
  it.each([
    [0, `R$${NBSP}0,00`],
    [1, `R$${NBSP}0,01`],
    [100, `R$${NBSP}1,00`],
    [123456, `R$${NBSP}1.234,56`],
    [100000000, `R$${NBSP}1.000.000,00`],
  ])("%i centavos viram %s", (centavos, esperado) => {
    expect(formatarReais(centavos)).toBe(esperado);
  });

  it("separa o R$ do número com espaço não separável, não com o comum", () => {
    expect(formatarReais(300)).not.toBe("R$ 3,00");
    expect(formatarReais(300).charCodeAt(2)).toBe(0xa0);
  });
});

describe("paraCentavos", () => {
  it.each([
    ["1.234,56", 123456],
    ["1234,56", 123456],
    ["1.234.567,89", 123456789],
    ["12", 1200],
    ["12,5", 1250],
    ["12,50", 1250],
    ["0,05", 5],
    ["0", 0],
    ["R$ 3,00", 300],
    ["R$3,00", 300],
    [`R$${NBSP}3,00`, 300],
    ["  12,00  ", 1200],
  ])("lê %j como %i centavos", (texto, esperado) => {
    expect(paraCentavos(texto)).toBe(esperado);
  });

  it.each([
    "",
    "   ",
    "abc",
    "R$",
    "12,",
    "12.",
    ",50",
    "12,345",
    "1,2,3",
    "12.50",
    "0.500",
    "010.000",
    "1.23",
    "1.2345,00",
    "1..234",
    "1 234,56",
    "-5",
    "R$ -5,00",
    "12 reais",
    "1e3",
    "NaN",
  ])("recusa %j", (texto) => {
    expect(paraCentavos(texto)).toBeNull();
  });

  it("recusa o valor que passa do maior inteiro exato", () => {
    // 9.007.199.254.740.991 centavos (2^53 - 1) é o último valor que o number guarda sem arredondar.
    expect(paraCentavos("90.071.992.547.409,91")).toBe(Number.MAX_SAFE_INTEGER);
    expect(paraCentavos("90.071.992.547.409,92")).toBeNull();
  });

  it("lê de volta o que formatarReais escreve", () => {
    for (const centavos of [0, 1, 99, 100, 123456, 100000000]) {
      expect(paraCentavos(formatarReais(centavos))).toBe(centavos);
    }
  });
});

describe("somarCentavos", () => {
  it("soma inteiros, e sem argumentos dá zero", () => {
    expect(somarCentavos(1000, 250, 5)).toBe(1255);
    expect(somarCentavos()).toBe(0);
  });

  it("não erra o centavo que a soma de reais em float erra", () => {
    expect(0.1 + 0.2).not.toBe(0.3); // o exemplo do ADR-005
    expect(somarCentavos(10, 20)).toBe(30);
    expect(formatarReais(somarCentavos(10, 20))).toBe(`R$${NBSP}0,30`);
  });
});
