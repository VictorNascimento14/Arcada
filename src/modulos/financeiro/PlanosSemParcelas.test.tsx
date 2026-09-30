import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { lancamentos, pacientes, planos } from "@/dados/colecoes";
import { formatarReais, type Paciente, type PlanoTratamento, type SituacaoPlano } from "@/dominio";

import PlanosSemParcelas from "./PlanosSemParcelas";

// O `getByText` normaliza o espaço não separável que o Intl põe depois do `R$`; o texto esperado precisa do mesmo tratamento.
const reais = (centavos: number) => formatarReais(centavos).replace(/\s/g, " ");
const paciente = (id: string, nome: string): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "" });
const plano = (id: string, pacienteId: string, situacao: SituacaoPlano, preco = 10_000): PlanoTratamento => ({
  id,
  pacienteId,
  itens: [{ id: `${id}-i`, procedimentoId: "p1", preco }],
  desconto: 0,
  situacao,
});

beforeEach(() => {
  pacientes.substituirTudo([paciente("ana", "Ana Exemplo"), paciente("bruno", "Bruno Exemplo")]);
  planos.substituirTudo([]);
  lancamentos.substituirTudo([]);
});

function abrir() {
  const rotas = [
    { path: "/financeiro", Component: PlanosSemParcelas },
    { path: "/tratamentos", element: <p>Lista de tratamentos</p> },
    { path: "/planos/:planoId", element: <p>Tela do plano</p> },
  ];
  render(<RouterProvider router={createMemoryRouter(rotas, { initialEntries: ["/financeiro"] })} />);
}
const dialogo = () => within(screen.getByRole("dialog"));
const texto = (el: HTMLElement) => el.textContent?.replace(/\s/g, " "); // o `textContent` traz o espaço não separável do Intl
const preencher = (parcelas: string, vencimento: string) => {
  fireEvent.change(dialogo().getByLabelText("Número de parcelas"), { target: { value: parcelas } });
  fireEvent.change(dialogo().getByLabelText("1º vencimento"), { target: { value: vencimento } });
};
const gerar = () => fireEvent.click(dialogo().getByRole("button", { name: "Gerar parcelas" }));

describe("planos sem parcelas", () => {
  it("lista só os aprovados e em andamento sem lançamentos, com paciente, situação e total; a linha abre o plano", () => {
    planos.substituirTudo([
      plano("a", "bruno", "aprovado", 15_000),
      plano("b", "ana", "em-andamento", 7_000),
      plano("c", "ana", "proposto", 99_000),
      plano("d", "bruno", "aprovado", 88_000),
    ]);
    lancamentos.substituirTudo([{ id: "l1", pacienteId: "bruno", planoId: "d", valor: 88_000, vencimento: "2026-10-15" }]);
    abrir();

    const links = screen.getAllByRole("link").filter((l) => l.getAttribute("href")?.startsWith("/planos/"));
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/planos/b", "/planos/a"]);
    for (const texto of ["Ana Exemplo", "1 item"]) expect(within(links[0]).getByText(texto)).toBeTruthy();
    expect(screen.getByText("Em andamento")).toBeTruthy();
    expect(screen.getByText(reais(7_000))).toBeTruthy();
    expect(screen.queryByText(reais(99_000))).toBeNull();
    expect(screen.queryByText(reais(88_000))).toBeNull();
  });

  it("sem plano a parcelar, diz onde os planos são aprovados", () => {
    abrir();
    expect(screen.getByText(/Nenhum plano aguardando parcelas/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tratamentos" }).getAttribute("href")).toBe("/tratamentos");
  });

  it("gera as parcelas: mostra a prévia, grava os lançamentos e o plano sai da lista", () => {
    planos.substituirTudo([plano("a", "ana", "aprovado", 10_000)]);
    abrir();

    fireEvent.click(screen.getByRole("button", { name: "Gerar parcelas de Ana Exemplo" }));
    expect(texto(dialogo().getByText("Total do plano").parentElement!)).toBe(`Total do plano${reais(10_000)}`);
    preencher("3", "2026-10-15");
    expect(dialogo().getAllByRole("listitem").map(texto)).toEqual([
      `1ª · vence em 15/10/2026${reais(3_334)}`,
      `2ª · vence em 15/11/2026${reais(3_333)}`,
      `3ª · vence em 15/12/2026${reais(3_333)}`,
    ]);
    gerar();

    expect(lancamentos.listar().map((l) => [l.pacienteId, l.planoId, l.valor, l.vencimento])).toEqual([
      ["ana", "a", 3_334, "2026-10-15"],
      ["ana", "a", 3_333, "2026-11-15"],
      ["ana", "a", 3_333, "2026-12-15"],
    ]);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(/Nenhum plano aguardando parcelas/)).toBeTruthy();
  });

  it("dado inválido mostra o erro no campo, mantém o modal aberto e não grava", () => {
    planos.substituirTudo([plano("a", "ana", "aprovado")]);
    abrir();

    fireEvent.click(screen.getByRole("button", { name: /Gerar parcelas de/ }));
    preencher("0", "2026-10-15");
    gerar();
    expect(dialogo().getByText("Informe de 1 a 60 parcelas.")).toBeTruthy();
    expect(dialogo().queryByRole("listitem")).toBeNull(); // sem parcelas válidas, sem prévia

    preencher("2", "");
    gerar();
    expect(dialogo().getByText("Informe o dia do primeiro vencimento.")).toBeTruthy();
    expect(lancamentos.listar()).toEqual([]);
  });

  it("cancelar fecha o modal sem gravar", () => {
    planos.substituirTudo([plano("a", "ana", "aprovado")]);
    abrir();

    fireEvent.click(screen.getByRole("button", { name: /Gerar parcelas de/ }));
    fireEvent.click(dialogo().getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(lancamentos.listar()).toEqual([]);
  });
});
