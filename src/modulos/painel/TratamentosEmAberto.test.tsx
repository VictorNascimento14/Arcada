import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { pacientes, planos } from "@/dados/colecoes";
import { formatarReais, type PlanoTratamento, type SituacaoPlano } from "@/dominio";

import TratamentosEmAberto from "./TratamentosEmAberto";

/** Um plano com um item para cada preço, em centavos. */
const plano = (id: string, situacao: SituacaoPlano, precos: number[], desconto = 0): PlanoTratamento => ({
  id,
  pacienteId: "a1",
  itens: precos.map((preco, i) => ({ id: `${id}-${i}`, procedimentoId: "proc", preco })),
  desconto,
  situacao,
});

const abrir = () =>
  render(
    <MemoryRouter>
      <TratamentosEmAberto />
    </MemoryRouter>,
  );

/** O valor final de cada cartão: o texto `sr-only` que o `AnimatedNumber` deixa ao lado do número que anima. */
const valores = () => screen.getAllByRole("listitem").map((li) => li.querySelector(".sr-only")?.textContent);

beforeEach(() => {
  pacientes.substituirTudo([{ id: "a1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002" }]);
  planos.substituirTudo([
    plano("p1", "proposto", [10000, 5000], 1000), // 14000
    plano("p2", "proposto", [20000]), // 20000
    plano("a1", "aprovado", [30000], 5000), // 25000
    plano("e1", "em-andamento", [8000]), // 8000
    plano("c1", "concluido", [99999]),
    plano("r1", "recusado", [99999]),
  ]);
});

afterEach(() => {
  pacientes.substituirTudo([]);
  planos.substituirTudo([]);
});

describe("painel: planos em aberto", () => {
  it("conta os orçamentos e os tratamentos em aberto e mostra o valor de cada grupo", () => {
    abrir();

    expect(screen.getByRole("heading", { name: "Planos em aberto" })).toBeTruthy();
    expect(valores()).toEqual(["2", "2"]);
    const [orcamentos, tratamentos] = screen.getAllByRole("listitem");
    expect(orcamentos.textContent).toContain("Orçamentos em aberto");
    expect(orcamentos.textContent).toContain(`${formatarReais(34000)} à espera da decisão do paciente`); // 14000 + 20000
    expect(tratamentos.textContent).toContain("Tratamentos em aberto");
    expect(tratamentos.textContent).toContain(`${formatarReais(33000)} aprovados ou em andamento`); // 25000 + 8000
  });

  it("leva à lista dos planos em aberto", () => {
    abrir();

    expect(screen.getByRole("link", { name: "Ver os planos" }).getAttribute("href")).toBe("/tratamentos");
  });

  it("sem plano em aberto, mostra zero e diz que não há nenhum", () => {
    planos.substituirTudo([plano("c1", "concluido", [10000]), plano("r1", "recusado", [10000])]);
    abrir();

    expect(valores()).toEqual(["0", "0"]);
    expect(screen.getByText("Nenhum orçamento à espera do paciente")).toBeTruthy();
    expect(screen.getByText("Nenhum tratamento aprovado ou em andamento")).toBeTruthy();
  });
});
