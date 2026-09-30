import { describe, expect, it } from "vitest";

import { parcelar } from "./parcelas";

const valores = (total: number, n: number) => parcelar(total, n, "2026-10-15").map((p) => p.valor);
const vencimentos = (inicio: string, n: number) => parcelar(1000, n, inicio).map((p) => p.vencimento);

describe("parcelar: valores", () => {
  it.each([
    [10000, 3, [3334, 3333, 3333]], // o exemplo do ADR-005
    [10001, 3, [3334, 3334, 3333]], // o resto de 2 centavos vai para as duas primeiras
    [10000, 4, [2500, 2500, 2500, 2500]], // divisão exata
    [10000, 1, [10000]],
    [2, 3, [1, 1, 0]], // total menor que n: as últimas saem zeradas
    [0, 2, [0, 0]],
  ])("%i centavos em %i parcelas: %j", (total, n, esperado) => {
    expect(valores(total, n)).toEqual(esperado);
  });

  it("a soma fecha exatamente o total, e nenhuma parcela passa de outra por mais de 1 centavo", () => {
    const totais = [...Array.from({ length: 300 }, (_, i) => i + 1), 123456789, Number.MAX_SAFE_INTEGER];
    for (const total of totais) {
      for (let n = 1; n <= 24; n++) {
        const v = valores(total, n);
        expect(v).toHaveLength(n);
        expect(v.reduce((soma, x) => soma + x, 0)).toBe(total);
        expect(v.every((x) => Number.isInteger(x) && x >= 0)).toBe(true);
        expect(v[0] - v[n - 1]).toBeLessThanOrEqual(1);
        expect([...v].sort((a, b) => b - a)).toEqual(v); // o centavo a mais fica nas primeiras
      }
    }
  });
});

describe("parcelar: vencimentos", () => {
  it("a primeira parcela vence na data dada e as outras a cada mês", () => {
    expect(vencimentos("2026-10-15", 4)).toEqual(["2026-10-15", "2026-11-15", "2026-12-15", "2027-01-15"]);
  });

  it("dia 31 cai no último dia dos meses curtos e volta ao 31, sem se arrastar", () => {
    expect(vencimentos("2026-01-31", 5)).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30", "2026-05-31"]);
  });

  it("dias 29 e 30 também recuam em fevereiro e voltam nos meses que os têm", () => {
    expect(vencimentos("2026-01-30", 3)).toEqual(["2026-01-30", "2026-02-28", "2026-03-30"]);
    expect(vencimentos("2026-01-29", 3)).toEqual(["2026-01-29", "2026-02-28", "2026-03-29"]);
  });

  it("fevereiro de ano bissexto tem 29 dias; o de 2100 (século não bissexto) tem 28", () => {
    expect(vencimentos("2028-01-31", 2)[1]).toBe("2028-02-29");
    expect(vencimentos("2000-01-31", 2)[1]).toBe("2000-02-29"); // múltiplo de 400: bissexto
    expect(vencimentos("2100-01-31", 2)[1]).toBe("2100-02-28");
  });

  it("vira o ano, e passa de um ano para o outro em parcelamentos longos", () => {
    expect(vencimentos("2026-11-30", 4)).toEqual(["2026-11-30", "2026-12-30", "2027-01-30", "2027-02-28"]);
    const longo = vencimentos("2026-01-31", 25);
    expect(longo[12]).toBe("2027-01-31");
    expect(longo[13]).toBe("2027-02-28");
    expect(longo[24]).toBe("2028-01-31");
  });

  it("uma parcela só vence na data dada", () => {
    expect(vencimentos("2026-10-15", 1)).toEqual(["2026-10-15"]);
  });

  it("cada parcela leva o valor e o vencimento juntos", () => {
    expect(parcelar(10001, 3, "2026-01-31")).toEqual([
      { valor: 3334, vencimento: "2026-01-31" },
      { valor: 3334, vencimento: "2026-02-28" },
      { valor: 3333, vencimento: "2026-03-31" },
    ]);
  });
});

describe("parcelar: entrada inválida", () => {
  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("recusa %s parcelas", (n) => {
    expect(() => parcelar(10000, n, "2026-10-15")).toThrow(RangeError);
  });

  it.each([-1, 10.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])("recusa o total %s", (total) => {
    expect(() => parcelar(total, 3, "2026-10-15")).toThrow(RangeError);
  });

  it.each([
    "",
    "2026-1-5",
    "15/10/2026",
    "2026-10-15T10:00",
    "2026-13-01", // mês que não existe
    "2026-00-10",
    "2026-10-00",
    "2026-02-30", // dia que o mês não tem
    "2026-04-31",
    "2027-02-29", // 29/02 em ano não bissexto
  ])("recusa o vencimento %j", (data) => {
    expect(() => parcelar(10000, 3, data)).toThrow(RangeError);
  });
});
