import { describe, expect, it } from "vitest";

import { faixaEtaria, idade, type FaixaEtaria } from "./idade";

describe("idade", () => {
  it.each([
    ["1990-05-15", "2026-05-14", 35], // aniversário amanhã: ainda não fez o ano
    ["1990-05-15", "2026-05-15", 36], // no dia do aniversário o ano já conta
    ["1990-05-15", "2026-05-16", 36],
    ["1990-10-05", "2026-09-30", 35], // dia maior, mas o mês do aniversário ainda não chegou
    ["1990-05-15", "2026-01-01", 35],
    ["1990-05-15", "2026-12-31", 36],
    ["2026-09-30", "2026-09-30", 0], // nasceu hoje
    ["2026-01-01", "2026-09-30", 0], // menos de um ano
  ])("nascimento %s, hoje %s: %i anos", (nascimento, hoje, esperado) => {
    expect(idade(nascimento, hoje)).toBe(esperado);
  });

  it.each([
    ["2001-02-28", 0], // ano não bissexto: 29/02 não existe, ainda não fez o ano
    ["2001-03-01", 1], // e completa em 1º/03
    ["2004-02-28", 3],
    ["2004-02-29", 4], // ano bissexto: completa no próprio 29/02
    ["2005-02-28", 4],
    ["2005-03-01", 5],
  ])("nascido em 29/02/2000, hoje %s: %i anos", (hoje, esperado) => {
    expect(idade("2000-02-29", hoje)).toBe(esperado);
  });

  it("hoje 29/02 e aniversário em 1º/03: ainda não fez o ano", () => {
    expect(idade("2000-03-01", "2024-02-29")).toBe(23);
  });

  it("nascimento depois de hoje dá número negativo", () => {
    expect(idade("2027-01-01", "2026-09-30")).toBeLessThan(0);
  });

  it.each(["", "15/05/1990", "1990-5-15", "1990-05-15T10:00"])("recusa a data fora do formato %j", (invalida) => {
    expect(() => idade(invalida, "2026-09-30")).toThrow(RangeError);
    expect(() => idade("1990-05-15", invalida)).toThrow(RangeError);
  });
});

describe("faixaEtaria", () => {
  it.each<[number, FaixaEtaria]>([
    [0, "crianca"],
    [11, "crianca"],
    [12, "adolescente"],
    [17, "adolescente"],
    [18, "adulto"],
    [59, "adulto"],
    [60, "idoso"],
    [100, "idoso"],
  ])("%i anos: %s", (anos, esperada) => {
    expect(faixaEtaria(anos)).toBe(esperada);
  });

  it.each<[string, FaixaEtaria]>([
    ["2014-10-01", "crianca"], // faz 12 anos amanhã
    ["2014-09-30", "adolescente"], // fez 12 hoje
    ["2008-10-01", "adolescente"], // faz 18 amanhã
    ["2008-09-30", "adulto"], // fez 18 hoje
    ["1966-10-01", "adulto"], // faz 60 amanhã
    ["1966-09-30", "idoso"], // fez 60 hoje
  ])("nascido em %s, em 30/09/2026: %s", (nascimento, esperada) => {
    expect(faixaEtaria(idade(nascimento, "2026-09-30"))).toBe(esperada);
  });
});
