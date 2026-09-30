import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { consultas, lancamentos } from "@/dados/colecoes";
import { formatarReais, type Consulta, type Lancamento, type SituacaoConsulta } from "@/dominio";

import IndicadoresDoMes from "./IndicadoresDoMes";

const consulta = (id: string, inicio: string, situacao: SituacaoConsulta): Consulta => ({
  id,
  pacienteId: "a1",
  profissionalId: "p1",
  cadeiraId: "c1",
  inicio,
  duracaoMin: 30,
  situacao,
});

const parcela = (id: string, valor: number, vencimento: string, pagoEm?: string): Lancamento => ({
  id,
  pacienteId: "a1",
  planoId: "pl1",
  valor,
  vencimento,
  ...(pagoEm ? { pagoEm, forma: "pix" as const } : {}),
});

/** O valor final de cada cartão: o texto `sr-only` que o `AnimatedNumber` deixa ao lado do número que anima. */
const valores = () => screen.getAllByRole("listitem").map((li) => li.querySelector(".sr-only")?.textContent);

beforeEach(() => {
  lancamentos.substituirTudo([
    parcela("l1", 15000, "2026-09-05", "2026-09-05"),
    parcela("l2", 9050, "2026-08-15", "2026-09-30"), // paga em atraso, dentro do mês
    parcela("l3", 20000, "2026-08-31", "2026-08-31"), // mês anterior
    parcela("l4", 30000, "2026-09-10"), // em aberto
  ]);
  consultas.substituirTudo([
    consulta("k1", "2026-09-02T09:00", "concluida"),
    consulta("k2", "2026-09-09T09:00", "concluida"),
    consulta("k3", "2026-09-16T09:00", "faltou"),
    consulta("k4", "2026-09-20T09:00", "cancelada"),
    consulta("k5", "2026-09-30T15:00", "agendada"),
    consulta("k6", "2026-10-01T09:00", "agendada"), // outro mês
    consulta("k7", "2026-08-31T09:00", "faltou"), // outro mês
  ]);
});

afterEach(() => {
  lancamentos.substituirTudo([]);
  consultas.substituirTudo([]);
});

describe("painel: indicadores do mês", () => {
  it("mostra o recebido, as consultas e a taxa de faltas do mês, com o mês no título", () => {
    render(<IndicadoresDoMes hoje="2026-09-30" />);

    expect(screen.getByRole("heading", { name: "Indicadores do mês" })).toBeTruthy();
    expect(screen.getByText("setembro de 2026")).toBeTruthy();
    for (const rotulo of ["Faturamento recebido", "Consultas no mês", "Taxa de faltas"]) expect(screen.getByText(rotulo)).toBeTruthy();
    expect(valores()).toEqual([
      formatarReais(24050), // 15000 + 9050: a paga em atraso conta, a do mês anterior e a em aberto não
      "4", // k1, k2, k3 e k5: sem a cancelada nem as de outro mês
      "33,3%", // 1 falta em 3 consultas encerradas
    ]);
  });

  it("vira o mês com o dia: em outubro só entra o que é de outubro", () => {
    render(<IndicadoresDoMes hoje="2026-10-01" />);

    expect(valores()).toEqual([formatarReais(0), "1", "Sem dados"]); // só a k6, agendada: sem base para a taxa
  });

  it("sem nada no mês, mostra zero e explica por que não há taxa", () => {
    lancamentos.substituirTudo([]);
    consultas.substituirTudo([]);
    render(<IndicadoresDoMes hoje="2026-09-30" />);

    expect(valores()).toEqual([formatarReais(0), "0", "Sem dados"]);
    expect(screen.getByText("Nenhuma consulta concluída ou com falta no mês")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
  });
});
