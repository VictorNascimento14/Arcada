import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { lancamentos } from "@/dados/colecoes";
import { formatarReais, type Lancamento } from "@/dominio";

import AbaFinanceiro from "./AbaFinanceiro";

// O `getByText` normaliza o espaço não separável que o Intl põe depois do `R$`; o texto esperado precisa do mesmo tratamento.
const reais = (centavos: number) => formatarReais(centavos).replace(/\s/g, " ");
const lancamento = (id: string, pacienteId: string, valor: number, vencimento: string, extra: Partial<Lancamento> = {}): Lancamento => ({
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
  lancamentos.substituirTudo([]);
});
afterEach(() => vi.useRealTimers());

function abrir() {
  const rotas = [
    { path: "/", element: <AbaFinanceiro pacienteId="pac1" /> },
    { path: "/financeiro", element: <p>Tela do financeiro</p> },
  ];
  render(<RouterProvider router={createMemoryRouter(rotas)} />);
}

describe("aba Financeiro da ficha", () => {
  it("sem lançamento, diz onde as parcelas nascem e leva ao financeiro", () => {
    lancamentos.substituirTudo([lancamento("x", "pac2", 5_000, "2026-10-15")]);
    abrir();

    expect(screen.getByText(/Nenhum lançamento ainda/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Financeiro" }).getAttribute("href")).toBe("/financeiro");
  });

  it("lista só os lançamentos do paciente, por vencimento, cada um com a situação de hoje", () => {
    lancamentos.substituirTudo([
      lancamento("b", "pac1", 3_333, "2026-11-15"),
      lancamento("x", "pac2", 99_000, "2026-10-01"),
      lancamento("a", "pac1", 3_334, "2026-10-15", { pagoEm: "2026-10-14", forma: "pix" }),
      lancamento("c", "pac1", 3_333, "2026-10-15"),
      lancamento("d", "pac1", 3_333, "2026-09-15"),
    ]);
    abrir();

    const linhas = screen.getAllByRole("listitem");
    const esperado = [
      ["Vencimento em 15/09/2026", "Vencida", reais(3_333)],
      ["Vencimento em 15/10/2026", "Paga", "Pago em 14/10/2026 · Pix", reais(3_334)],
      ["Vencimento em 15/10/2026", "Vence hoje", reais(3_333)],
      ["Vencimento em 15/11/2026", "A vencer", reais(3_333)],
    ];
    expect(linhas).toHaveLength(esperado.length);
    linhas.forEach((linha, i) => {
      for (const texto of esperado[i]) expect(within(linha).getByText(texto)).toBeTruthy();
    });
    expect(screen.queryByText(reais(99_000))).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Dar baixa na parcela de/ })).toHaveLength(3); // a paga não tem o botão
  });
});
