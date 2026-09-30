import { describe, expect, it } from "vitest";

import type { Consulta, Lancamento, SituacaoConsulta } from "@/dominio";

import { consultasDoMes, faturamentoRecebido, mesDe, taxaDeFaltas } from "./indicadores";

const consulta = (inicio: string, situacao: SituacaoConsulta): Consulta => ({
  id: `${inicio}-${situacao}`,
  pacienteId: "a1",
  profissionalId: "p1",
  cadeiraId: "c1",
  inicio,
  duracaoMin: 30,
  situacao,
});

const parcela = (valor: number, vencimento: string, pagoEm?: string): Lancamento => ({
  id: `${vencimento}-${valor}`,
  pacienteId: "a1",
  planoId: "pl1",
  valor,
  vencimento,
  ...(pagoEm ? { pagoEm, forma: "pix" as const } : {}),
});

describe("mesDe", () => {
  it("tira o mês de um dia e de um horário", () => {
    expect(mesDe("2026-09-30")).toBe("2026-09");
    expect(mesDe("2026-09-30T14:00")).toBe("2026-09");
  });
});

describe("faturamentoRecebido", () => {
  it("soma as parcelas pagas no mês, seja qual for o vencimento, em centavos", () => {
    const todas = [
      parcela(15000, "2026-09-05", "2026-09-05"), // paga no dia
      parcela(9050, "2026-08-15", "2026-09-30"), // paga em atraso: conta no mês em que entrou
      parcela(20000, "2026-10-10", "2026-09-01"), // paga adiantada, no primeiro dia do mês
    ];
    expect(faturamentoRecebido(todas, "2026-09")).toBe(44050);
  });

  it("não conta a parcela em aberto nem a paga em outro mês (inclusive o último dia do mês anterior)", () => {
    const todas = [
      parcela(30000, "2026-09-10"), // em aberto, mesmo vencida
      parcela(20000, "2026-08-31", "2026-08-31"),
      parcela(10000, "2026-10-01", "2026-10-01"),
    ];
    expect(faturamentoRecebido(todas, "2026-09")).toBe(0);
  });

  it("sem lançamento, zero", () => {
    expect(faturamentoRecebido([], "2026-09")).toBe(0);
  });
});

describe("consultasDoMes", () => {
  it("conta as do mês, as que ainda vão acontecer inclusive, sem as canceladas nem as de outro mês", () => {
    const todas = [
      consulta("2026-09-01T08:00", "concluida"),
      consulta("2026-09-16T09:00", "faltou"),
      consulta("2026-09-20T09:00", "cancelada"),
      consulta("2026-09-30T15:00", "agendada"),
      consulta("2026-08-31T15:00", "concluida"),
      consulta("2026-10-01T08:00", "agendada"),
    ];
    expect(consultasDoMes(todas, "2026-09")).toBe(3);
  });

  it("mês sem consulta dá zero", () => {
    expect(consultasDoMes([], "2026-09")).toBe(0);
  });
});

describe("taxaDeFaltas", () => {
  it("é faltou ÷ (concluída + faltou)", () => {
    const todas = [
      consulta("2026-09-02T09:00", "concluida"),
      consulta("2026-09-09T09:00", "concluida"),
      consulta("2026-09-16T09:00", "faltou"),
    ];
    expect(taxaDeFaltas(todas, "2026-09")).toBeCloseTo(1 / 3, 10);
  });

  it("só conta quem já terminou: agendada, confirmada, em atendimento e cancelada ficam fora da base", () => {
    const todas = [
      consulta("2026-09-02T09:00", "faltou"),
      consulta("2026-09-09T09:00", "concluida"),
      consulta("2026-09-10T09:00", "agendada"),
      consulta("2026-09-11T09:00", "confirmada"),
      consulta("2026-09-12T09:00", "em-atendimento"),
      consulta("2026-09-13T09:00", "cancelada"),
      consulta("2026-08-30T09:00", "faltou"), // de outro mês
    ];
    expect(taxaDeFaltas(todas, "2026-09")).toBe(0.5);
  });

  it("sem falta é 0; só faltas é 1", () => {
    expect(taxaDeFaltas([consulta("2026-09-02T09:00", "concluida")], "2026-09")).toBe(0);
    expect(taxaDeFaltas([consulta("2026-09-02T09:00", "faltou")], "2026-09")).toBe(1);
  });

  it("sem concluída nem faltou não há base: null, e não 0%", () => {
    expect(taxaDeFaltas([], "2026-09")).toBeNull();
    expect(taxaDeFaltas([consulta("2026-09-30T15:00", "agendada")], "2026-09")).toBeNull();
  });
});
