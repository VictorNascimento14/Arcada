import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { lancamentos } from "@/dados/colecoes";
import { formatarReais, type Lancamento } from "@/dominio";

import FaturamentoPorSemana from "./FaturamentoPorSemana";

const parcela = (id: string, valor: number, pagoEm?: string): Lancamento => ({
  id,
  pacienteId: "a1",
  planoId: "pl1",
  valor,
  vencimento: "2026-09-01",
  ...(pagoEm ? { pagoEm, forma: "pix" as const } : {}),
});

// Hoje é quarta-feira, 30/09/2026: as seis semanas vão de 24/08 a 04/10.
const HOJE = "2026-09-30";

const linhas = () => screen.getAllByRole("listitem");
/** O preenchimento da barra de uma linha: o `MeterBar` leva o tamanho final em `--w`, que a animação de entrada usa. */
const barra = (li: HTMLElement) => li.querySelector<HTMLElement>("[style*='--w']")!;

beforeEach(() => {
  lancamentos.substituirTudo([
    parcela("a", 10000, "2026-09-30"), // esta semana
    parcela("b", 40000, "2026-09-22"), // 21/09 a 27/09: a maior
    parcela("c", 10000, "2026-09-15"), // 14/09 a 20/09, duas parcelas
    parcela("d", 10000, "2026-09-18"),
    parcela("e", 4000, "2026-09-08"), // 07/09 a 13/09
    parcela("f", 99999, "2026-08-20"), // antes das seis semanas
    parcela("g", 99999), // em aberto
  ]);
});

afterEach(() => {
  lancamentos.substituirTudo([]);
});

describe("painel: faturamento por semana", () => {
  it("mostra as seis últimas semanas, da mais antiga à de hoje, com o período e o recebido em cada uma", () => {
    render(<FaturamentoPorSemana hoje={HOJE} />);

    expect(screen.getByRole("heading", { name: "Faturamento por semana" })).toBeTruthy();
    expect(linhas().map((li) => li.textContent)).toEqual([
      `24/08 a 30/08${formatarReais(0)}`,
      `31/08 a 06/09${formatarReais(0)}`,
      `07/09 a 13/09${formatarReais(4000)}`,
      `14/09 a 20/09${formatarReais(20000)}`,
      `21/09 a 27/09${formatarReais(40000)}`,
      `28/09 a 04/10 · esta semana${formatarReais(10000)}`,
    ]);
  });

  it("a barra é o valor sobre o da maior semana, na escala primary-800 (a maior) a primary-500 (a menor)", () => {
    render(<FaturamentoPorSemana hoje={HOJE} />);

    const barras = linhas().map(barra);
    expect(barras.map((b) => b.style.getPropertyValue("--w"))).toEqual(["0%", "0%", "10%", "50%", "100%", "25%"]);
    expect(barras.map((b) => b.className.match(/bg-primary-\d+/)?.[0])).toEqual([
      "bg-primary-500",
      "bg-primary-500",
      "bg-primary-500", // 10%
      "bg-primary-700", // 50%
      "bg-primary-800", // a maior
      "bg-primary-600", // 25%
    ]);
  });

  it("sem parcela recebida nas seis semanas, diz isso em vez de desenhar barras vazias", () => {
    lancamentos.substituirTudo([parcela("f", 99999, "2026-08-20"), parcela("g", 99999)]);
    render(<FaturamentoPorSemana hoje={HOJE} />);

    expect(screen.getByText(/Nenhuma parcela recebida nas últimas 6 semanas/)).toBeTruthy();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
