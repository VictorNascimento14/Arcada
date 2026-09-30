import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { planos, procedimentos } from "@/dados/colecoes";
import type { PlanoTratamento, Procedimento, SituacaoPlano } from "@/dominio";
import { odontogramas } from "@/modulos/odontograma/dados";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { diaISO } from "@/ui";

import ProcedimentosRealizados from "./ProcedimentosRealizados";

const HOJE = diaISO(new Date());
const proc = (p: Pick<Procedimento, "id" | "nome"> & Partial<Procedimento>): Procedimento => ({
  especialidade: "Dentística",
  preco: 10_000,
  duracaoMin: 30,
  exigeDente: false,
  exigeFace: false,
  ativo: true,
  ...p,
});
const plano = (id: string, situacao: SituacaoPlano, extra: Partial<PlanoTratamento> = {}): PlanoTratamento => ({
  id,
  pacienteId: "pac1",
  itens: [],
  desconto: 0,
  situacao,
  ...extra,
});
const APROVADO = plano("a", "aprovado", {
  itens: [
    { id: "a1", procedimentoId: "resina", dente: 16, faces: ["O"], preco: 20_000 },
    { id: "a2", procedimentoId: "limpeza", preco: 10_000 },
  ],
});

beforeEach(() => {
  procedimentos.substituirTudo([proc({ id: "resina", nome: "Restauração em resina", condicaoResultante: "restauracao" }), proc({ id: "limpeza", nome: "Profilaxia" })]);
  planos.substituirTudo([APROVADO]);
  odontogramas.substituirTudo([]);
});

function abrir() {
  const rotas = [
    { path: "/", element: <ProcedimentosRealizados pacienteId="pac1" /> },
    { path: "/pacientes/:id", element: <p>Ficha</p> },
  ];
  render(<RouterProvider router={createMemoryRouter(rotas)} />);
}

const marcar = () => fireEvent.click(screen.getByRole("button", { name: "Marcar como realizados" }));
const escolher = (nome: RegExp) => fireEvent.click(screen.getByRole("checkbox", { name: nome }));

describe("cartão Procedimentos realizados", () => {
  it("lista os itens dos planos aprovados e em andamento do paciente, com dente e faces; não os de outros planos", () => {
    planos.substituirTudo([
      APROVADO,
      plano("b", "proposto", { itens: [{ id: "b1", procedimentoId: "limpeza", preco: 1 }] }),
      plano("c", "em-andamento", { pacienteId: "pac2", itens: [{ id: "c1", procedimentoId: "limpeza", preco: 1 }] }),
      plano("d", "concluido", { itens: [{ id: "d1", procedimentoId: "limpeza", preco: 1, realizadoEm: "2026-09-01" }] }),
    ]);
    abrir();

    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByRole("checkbox", { name: /Restauração em resina/ }).closest("label")?.textContent).toContain("Dente 16");
    expect(screen.getByText("Plano 1")).toBeTruthy();
    expect(screen.queryByText("Plano 2")).toBeNull();
    expect(screen.queryByText("Plano 4")).toBeNull();
  });

  it("o botão só habilita com um item escolhido", () => {
    abrir();
    const botao = screen.getByRole("button", { name: "Marcar como realizados" }) as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
    escolher(/Profilaxia/);
    expect(botao.disabled).toBe(false);
    escolher(/Profilaxia/);
    expect(botao.disabled).toBe(true);
  });

  it("marcar grava o dia de hoje nos itens escolhidos, abre o andamento do plano e mostra a data", () => {
    abrir();
    escolher(/Restauração em resina/);
    marcar();

    const gravado = planos.obter("a");
    expect(gravado?.itens.map((i) => i.realizadoEm)).toEqual([HOJE, undefined]);
    expect(gravado?.situacao).toBe("em-andamento");
    expect(screen.getByText(`Realizado em ${dataBR(HOJE)}`)).toBeTruthy();
    expect(screen.getByText("Em andamento")).toBeTruthy();
    expect(screen.getAllByRole("checkbox")).toHaveLength(1); // o feito perdeu a caixa; sobrou a limpeza
    expect((screen.getByRole("button", { name: "Marcar como realizados" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("o procedimento com condição resultante marca o odontograma do paciente; o sem condição não", () => {
    abrir();
    escolher(/Profilaxia/);
    marcar();
    expect(odontogramas.obter("pac1")).toBeUndefined();

    escolher(/Restauração em resina/);
    marcar();
    expect(odontogramas.obter("pac1")?.marcas).toEqual([{ dente: 16, face: "O", condicao: "restauracao" }]);
  });

  it("vários de uma vez, e o item já realizado antes continua com a data antiga", () => {
    planos.substituirTudo([plano("a", "em-andamento", { itens: [...APROVADO.itens, { id: "a3", procedimentoId: "limpeza", preco: 1, realizadoEm: "2026-09-01" }] })]);
    abrir();
    escolher(/Restauração em resina/);
    escolher(/Profilaxia/);
    marcar();

    expect(planos.obter("a")?.itens.map((i) => i.realizadoEm)).toEqual([HOJE, HOJE, "2026-09-01"]);
    const feitos = screen.getAllByText(/^Realizado em /).map((e) => e.textContent);
    expect(feitos).toEqual([`Realizado em ${dataBR(HOJE)}`, `Realizado em ${dataBR(HOJE)}`, "Realizado em 01/09/2026"]);
  });

  it("sem plano aprovado ou em andamento, explica e leva à ficha", () => {
    planos.substituirTudo([plano("b", "proposto")]);
    abrir();

    expect(screen.getByText(/não tem plano aprovado ou em andamento/)).toBeTruthy();
    expect(within(screen.getByText(/não tem plano aprovado/)).getByRole("link", { name: "Abra a ficha" }).getAttribute("href")).toBe("/pacientes/pac1");
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});
