import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { pacientes, planos } from "@/dados/colecoes";
import { formatarReais, type ItemPlano, type Paciente, type PlanoTratamento, type SituacaoPlano } from "@/dominio";

import PlanosEmAberto from "./PlanosEmAberto";

// O `getByText` normaliza o espaço não separável que o Intl põe depois do `R$`; o texto esperado precisa do mesmo tratamento.
const reais = (centavos: number) => formatarReais(centavos).replace(/\s/g, " ");
const paciente = (id: string, nome: string): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "" });
const item = (id: string, preco: number, realizadoEm?: string): ItemPlano => ({ id, procedimentoId: "p1", preco, ...(realizadoEm ? { realizadoEm } : {}) });
const plano = (id: string, pacienteId: string, situacao: SituacaoPlano, itens: ItemPlano[] = [], desconto = 0): PlanoTratamento => ({
  id,
  pacienteId,
  itens,
  desconto,
  situacao,
});

beforeEach(() => {
  pacientes.substituirTudo([paciente("ana", "Ana Exemplo"), paciente("bruno", "Bruno Exemplo")]);
  planos.substituirTudo([]);
});

function abrir() {
  const rotas = [
    { path: "/tratamentos", Component: PlanosEmAberto },
    { path: "/pacientes", element: <p>Lista de pacientes</p> },
  ];
  render(<RouterProvider router={createMemoryRouter(rotas, { initialEntries: ["/tratamentos"] })} />);
}

describe("planos em aberto", () => {
  it("lista só os em aberto, com paciente, itens, situação e total, e cada linha abre o plano", () => {
    planos.substituirTudo([
      plano("aprovado", "bruno", "aprovado", [item("i1", 10_000), item("i2", 5_000)], 1_000),
      plano("proposto", "ana", "proposto", [item("i3", 7_000)]),
      plano("feito", "ana", "concluido", [item("i4", 99_000)]),
      plano("recusado", "bruno", "recusado", [item("i5", 88_000)]),
    ]);
    abrir();

    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/planos/proposto", "/planos/aprovado"]); // propostos primeiro
    for (const texto of ["Ana Exemplo", "1 item", "Proposto", reais(7_000)]) expect(within(links[0]).getByText(texto)).toBeTruthy();
    for (const texto of ["Bruno Exemplo", "2 itens", "Aprovado", reais(14_000)]) expect(within(links[1]).getByText(texto)).toBeTruthy();
    expect(screen.queryByText(reais(99_000))).toBeNull();
  });

  it("mostra o progresso de cada plano: os itens realizados sobre o total", () => {
    planos.substituirTudo([
      plano("andamento", "ana", "em-andamento", [item("i1", 10_000, "2026-09-30"), item("i2", 5_000, "2026-09-30"), item("i3", 5_000)]),
      plano("novo", "bruno", "proposto", [item("i4", 7_000)]),
    ]);
    abrir();

    const [proposto, andamento] = screen.getAllByRole("link"); // propostos primeiro
    expect(within(proposto).getByRole("progressbar", { name: "Progresso do tratamento: 0 de 1 item realizado" }).getAttribute("aria-valuenow")).toBe("0");
    const barra = within(andamento).getByRole("progressbar", { name: "Progresso do tratamento: 2 de 3 itens realizados" });
    expect(barra.getAttribute("aria-valuenow")).toBe("67");
    expect(within(andamento).getByText("2 de 3 realizados")).toBeTruthy();
  });

  it("resume quantos são e quanto somam", () => {
    planos.substituirTudo([plano("a", "ana", "proposto", [item("i1", 7_000)]), plano("b", "bruno", "em-andamento", [item("i2", 3_000)])]);
    abrir();
    expect(screen.getByText(`2 planos, somando ${reais(10_000)}`)).toBeTruthy();
  });

  it("no singular quando é um só", () => {
    planos.substituirTudo([plano("a", "ana", "proposto", [item("i1", 7_000)])]);
    abrir();
    expect(screen.getByText(`1 plano, somando ${reais(7_000)}`)).toBeTruthy();
  });

  it("plano de paciente que não existe aparece com o aviso, em vez de sumir", () => {
    planos.substituirTudo([plano("a", "sumiu", "proposto")]);
    abrir();
    expect(screen.getByText("Paciente não encontrado")).toBeTruthy();
  });

  it("sem plano em aberto, diz onde os planos nascem e leva aos pacientes", () => {
    planos.substituirTudo([plano("feito", "ana", "concluido", [item("i1", 7_000)])]);
    abrir();

    expect(screen.getByText(/Nenhum plano em aberto/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ir para os pacientes" }).getAttribute("href")).toBe("/pacientes");
  });
});
