import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { pacientes, planos } from "@/dados/colecoes";
import { formatarReais, type ItemPlano, type Paciente, type PlanoTratamento } from "@/dominio";

import AbaTratamentos from "./AbaTratamentos";

const PACIENTE: Paciente = { id: "pac1", nome: "Paciente Exemplo", nascimento: "1990-06-12", telefone: "" };
const OUTRO: Paciente = { ...PACIENTE, id: "pac2", nome: "Outro Paciente Exemplo" };
// O `getByText` normaliza o espaço não separável que o Intl põe depois do `R$`; o texto esperado precisa do mesmo tratamento.
const reais = (centavos: number) => formatarReais(centavos).replace(/\s/g, " ");
const item = (id: string, preco: number, realizadoEm?: string): ItemPlano => ({ id, procedimentoId: "p1", preco, ...(realizadoEm ? { realizadoEm } : {}) });
const plano = (id: string, pacienteId: string, extra: Partial<PlanoTratamento> = {}): PlanoTratamento => ({
  id,
  pacienteId,
  itens: [],
  desconto: 0,
  situacao: "proposto",
  ...extra,
});

beforeEach(() => {
  pacientes.substituirTudo([PACIENTE, OUTRO]);
  planos.substituirTudo([]);
});

function abrir() {
  const rotas = [
    { path: "/", element: <AbaTratamentos pacienteId="pac1" /> },
    { path: "/planos/:planoId", element: <p>Tela do plano</p> },
  ];
  render(<RouterProvider router={createMemoryRouter(rotas)} />);
}

describe("aba Tratamentos da ficha", () => {
  it("sem plano, diz que não há nenhum", () => {
    abrir();
    expect(screen.getByText("Nenhum plano de tratamento ainda.")).toBeTruthy();
  });

  it("lista só os planos do paciente, com itens, situação e total, e cada um leva à tela do plano", () => {
    planos.substituirTudo([
      plano("a", "pac1", { itens: [item("i1", 10_000), item("i2", 5_000)], desconto: 1_000, situacao: "aprovado" }),
      plano("b", "pac2", { itens: [item("i3", 99_000)] }),
      plano("c", "pac1", { itens: [item("i4", 7_000)] }),
    ]);
    abrir();

    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/planos/a", "/planos/c"]);
    for (const texto of ["Plano 1", "2 itens", "Aprovado", reais(14_000)]) expect(within(links[0]).getByText(texto)).toBeTruthy();
    for (const texto of ["Plano 2", "1 item", "Proposto", reais(7_000)]) expect(within(links[1]).getByText(texto)).toBeTruthy();
  });

  it("mostra o progresso de cada plano: os itens realizados sobre o total; plano sem itens fica sem barra", () => {
    planos.substituirTudo([
      plano("a", "pac1", { itens: [item("i1", 10_000, "2026-09-30"), item("i2", 5_000)] }),
      plano("b", "pac1", { itens: [item("i3", 7_000)] }),
      plano("c", "pac1"),
    ]);
    abrir();

    const [primeiro, segundo, terceiro] = screen.getAllByRole("link");
    const metade = within(primeiro).getByRole("progressbar", { name: "Progresso do tratamento: 1 de 2 itens realizados" });
    expect(metade.getAttribute("aria-valuenow")).toBe("50");
    expect(within(primeiro).getByText("1 de 2 realizados")).toBeTruthy();
    expect(within(segundo).getByRole("progressbar", { name: "Progresso do tratamento: 0 de 1 item realizado" }).getAttribute("aria-valuenow")).toBe("0");
    expect(within(terceiro).queryByRole("progressbar")).toBeNull();
  });

  it("Novo plano cria um plano proposto para o paciente e abre a tela dele", async () => {
    abrir();

    fireEvent.click(screen.getByRole("button", { name: /novo plano/i }));

    expect(planos.listar()).toMatchObject([{ pacienteId: "pac1", situacao: "proposto", itens: [], desconto: 0 }]);
    expect(await screen.findByText("Tela do plano")).toBeTruthy();
  });
});
