import { describe, expect, it } from "vitest";

import type { Lancamento } from "@/dominio";

import { degrauDaBarra, faturamentoPorSemana, pctDaBarra, SEMANAS_NO_PAINEL } from "./porSemana";

const parcela = (valor: number, pagoEm?: string): Lancamento => ({
  id: `${pagoEm ?? "aberta"}-${valor}`,
  pacienteId: "a1",
  planoId: "pl1",
  valor,
  vencimento: "2026-09-01",
  ...(pagoEm ? { pagoEm, forma: "pix" as const } : {}),
});

describe("faturamentoPorSemana", () => {
  // 30/09/2026 é quarta-feira: a semana de hoje vai de 28/09 a 04/10.
  it("entrega as últimas semanas, de segunda a domingo, da mais antiga à mais recente, a última a de hoje", () => {
    const semanas = faturamentoPorSemana([], "2026-09-30", 3);

    expect(semanas.map((s) => [s.inicio, s.fim])).toEqual([
      ["2026-09-14", "2026-09-20"],
      ["2026-09-21", "2026-09-27"],
      ["2026-09-28", "2026-10-04"],
    ]);
  });

  it("mostra seis semanas por padrão", () => {
    const semanas = faturamentoPorSemana([], "2026-09-30");

    expect(SEMANAS_NO_PAINEL).toBe(6);
    expect(semanas).toHaveLength(6);
    expect(semanas[0].inicio).toBe("2026-08-24");
    expect(semanas[5].inicio).toBe("2026-09-28");
  });

  it("soma o pago em cada semana, segunda e domingo inclusive, e deixa de fora o que é de fora da janela ou está em aberto", () => {
    const semanas = faturamentoPorSemana(
      [
        parcela(1000, "2026-09-14"), // segunda, primeiro dia da janela
        parcela(2000, "2026-09-20"), // domingo da primeira semana
        parcela(4000, "2026-09-21"), // segunda da segunda
        parcela(8000, "2026-10-04"), // domingo da semana de hoje, já no mês seguinte
        parcela(16000, "2026-09-13"), // antes da janela
        parcela(32000, "2026-10-05"), // depois da janela
        parcela(64000), // em aberto
      ],
      "2026-09-30",
      3,
    );

    expect(semanas.map((s) => s.valor)).toEqual([3000, 4000, 8000]);
  });

  it("o domingo fecha a semana: hoje sendo domingo, a semana de hoje é a que termina nele", () => {
    const semanas = faturamentoPorSemana([], "2026-10-04", 2);

    expect(semanas.map((s) => s.inicio)).toEqual(["2026-09-21", "2026-09-28"]);
  });

  it("atravessa a virada do ano", () => {
    const semanas = faturamentoPorSemana([parcela(500, "2026-12-31"), parcela(700, "2027-01-01")], "2027-01-06", 2);

    expect(semanas.map((s) => [s.inicio, s.fim, s.valor])).toEqual([
      ["2026-12-28", "2027-01-03", 1200],
      ["2027-01-04", "2027-01-10", 0],
    ]);
  });
});

describe("pctDaBarra", () => {
  it("é o valor da semana sobre o da maior", () => {
    expect(pctDaBarra(25, 100)).toBe(25);
    expect(pctDaBarra(100, 100)).toBe(100);
    expect(pctDaBarra(0, 100)).toBe(0);
  });

  it("sem nenhum valor na janela não divide por zero", () => {
    expect(pctDaBarra(0, 0)).toBe(0);
  });
});

describe("degrauDaBarra", () => {
  it("vai de 0 (primary-500) a 3 (primary-800), de 25 em 25 por cento", () => {
    expect([0, 24.9, 25, 49.9, 50, 74.9, 75, 100].map(degrauDaBarra)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
});
