import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { consultas, procedimentos, profissionais } from "@/dados/colecoes";
import type { Consulta, SituacaoConsulta } from "@/dominio";
import { somarDias } from "@/modulos/agenda/dias";
import { diaISO } from "@/ui";

import AbaAtendimentos from "./AbaAtendimentos";

const HOJE = diaISO(new Date());
const marcada = (id: string, dias: number, situacao: SituacaoConsulta, extra: Partial<Consulta> = {}): Consulta => ({
  id,
  pacienteId: "pac1",
  profissionalId: "pr1",
  cadeiraId: "cad1",
  inicio: `${somarDias(HOJE, dias)}T09:00`,
  duracaoMin: 30,
  situacao,
  ...extra,
});

beforeEach(() => {
  profissionais.substituirTudo([{ id: "pr1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#0f766e" }]);
  procedimentos.substituirTudo([
    { id: "limpeza", nome: "Profilaxia", especialidade: "Prevenção", preco: 18_000, duracaoMin: 30, exigeDente: false, exigeFace: false, ativo: true },
  ]);
  consultas.substituirTudo([]);
});

function abrir() {
  const rotas = [
    { path: "/", element: <AbaAtendimentos pacienteId="pac1" /> },
    { path: "/atendimento/:consultaId", element: <p>Tela do atendimento</p> },
  ];
  render(<RouterProvider router={createMemoryRouter(rotas)} />);
}

describe("aba Atendimentos da ficha", () => {
  it("sem consulta de hoje em diante, diz que não há nenhuma", () => {
    consultas.substituirTudo([marcada("velha", -1, "concluida")]);
    abrir();
    expect(screen.getByText("Nenhuma consulta de hoje em diante.")).toBeTruthy();
  });

  it("lista só as consultas do paciente de hoje em diante, na ordem, com procedimento, profissional e situação", () => {
    consultas.substituirTudo([
      marcada("depois", 2, "agendada"),
      marcada("ontem", -1, "concluida"),
      marcada("outro", 1, "agendada", { pacienteId: "pac2" }),
      marcada("hoje", 0, "confirmada", { procedimentoId: "limpeza" }),
    ]);
    abrir();

    const linhas = screen.getAllByRole("listitem");
    expect(linhas).toHaveLength(2);
    for (const texto of ["09:00–09:30 · Profilaxia · Dra. Exemplo", "Confirmada"]) expect(within(linhas[0]).getByText(texto)).toBeTruthy();
    for (const texto of ["09:00–09:30 · Sem procedimento definido · Dra. Exemplo", "Agendada"]) expect(within(linhas[1]).getByText(texto)).toBeTruthy();
  });

  it("Iniciar atendimento só aparece na agendada e na confirmada; a em atendimento leva de volta à tela dela", () => {
    const situacoes: SituacaoConsulta[] = ["agendada", "confirmada", "em-atendimento", "concluida", "faltou", "cancelada"];
    consultas.substituirTudo(situacoes.map((s, i) => marcada(s, i, s)));
    abrir();

    const linhas = screen.getAllByRole("listitem");
    const iniciar = linhas.map((l) => within(l).queryByRole("button", { name: /^Iniciar atendimento/ }) !== null);
    expect(iniciar).toEqual([true, true, false, false, false, false]);
    expect(within(linhas[2]).getByRole("link", { name: "Abrir atendimento" }).getAttribute("href")).toBe("/atendimento/em-atendimento");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("iniciar grava a situação em atendimento e abre a tela do atendimento", () => {
    consultas.substituirTudo([marcada("c1", 0, "confirmada")]);
    abrir();

    fireEvent.click(screen.getByRole("button", { name: /^Iniciar atendimento de .*, \d{2}:\d{2}$/ }));

    expect(consultas.obter("c1")?.situacao).toBe("em-atendimento");
    expect(screen.getByText("Tela do atendimento")).toBeTruthy();
  });
});
