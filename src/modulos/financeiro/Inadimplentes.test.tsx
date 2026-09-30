import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { lancamentos, pacientes } from "@/dados/colecoes";
import { formatarReais, type Lancamento, type Paciente } from "@/dominio";

import Inadimplentes from "./Inadimplentes";

// O `getByText` normaliza o espaço não separável que o Intl põe depois do `R$`; o texto esperado precisa do mesmo tratamento.
const reais = (centavos: number) => formatarReais(centavos).replace(/\s/g, " ");
const paciente = (id: string, nome: string): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "" });
const parcela = (id: string, pacienteId: string, valor: number, vencimento: string, extra: Partial<Lancamento> = {}): Lancamento => ({
  id,
  pacienteId,
  planoId: "pl1",
  valor,
  vencimento,
  ...extra,
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 15, 12));
  pacientes.substituirTudo([paciente("ana", "Ana Exemplo"), paciente("bruno", "Bruno Exemplo"), paciente("carla", "Carla Exemplo")]);
  lancamentos.substituirTudo([]);
});
afterEach(() => vi.useRealTimers());

describe("inadimplência", () => {
  it("lista quem tem parcela vencida, do atraso mais antigo ao mais recente, com as parcelas, os dias e o total vencido", () => {
    lancamentos.substituirTudo([
      parcela("b1", "bruno", 1_500, "2026-10-14"),
      parcela("a1", "ana", 3_000, "2026-09-15"),
      parcela("a2", "ana", 2_000, "2026-10-10"),
      parcela("a3", "ana", 9_000, "2026-11-15"), // a vencer: não entra na conta
      parcela("b2", "bruno", 8_000, "2026-08-01", { pagoEm: "2026-08-01", forma: "pix" }), // paga: não entra
      parcela("c1", "carla", 4_000, "2026-10-15"), // vence hoje: ainda não é atraso
    ]);
    render(<Inadimplentes />);

    const linhas = screen.getAllByRole("listitem");
    const esperado = [
      ["Ana Exemplo", "2 parcelas vencidas · 30 dias de atraso", reais(5_000)],
      ["Bruno Exemplo", "1 parcela vencida · 1 dia de atraso", reais(1_500)],
    ];
    expect(linhas).toHaveLength(esperado.length);
    linhas.forEach((linha, i) => {
      for (const texto of esperado[i]) expect(within(linha).getByText(texto)).toBeTruthy();
    });
    expect(screen.queryByText("Carla Exemplo")).toBeNull();
    expect(screen.getByText(`2 pacientes inadimplentes, com ${reais(6_500)} vencidos`)).toBeTruthy();
  });

  it("no singular quando é um paciente só; o que não existe mais aparece com o aviso", () => {
    lancamentos.substituirTudo([parcela("s1", "sumiu", 1_000, "2026-10-01")]);
    render(<Inadimplentes />);

    expect(screen.getByText(`1 paciente inadimplente, com ${reais(1_000)} vencidos`)).toBeTruthy();
    expect(screen.getByText("Paciente não encontrado")).toBeTruthy();
  });

  it("sem parcela vencida, diz que não há paciente inadimplente", () => {
    lancamentos.substituirTudo([parcela("f", "ana", 3_000, "2026-11-15"), parcela("p", "bruno", 2_000, "2026-09-01", { pagoEm: "2026-09-01", forma: "pix" })]);
    render(<Inadimplentes />);

    expect(screen.getByText("Nenhum paciente inadimplente.")).toBeTruthy();
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});
