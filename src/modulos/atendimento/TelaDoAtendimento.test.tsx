import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { consultas, pacientes, procedimentos, profissionais } from "@/dados/colecoes";
import type { Consulta, SituacaoConsulta } from "@/dominio";

import TelaDoAtendimento from "./TelaDoAtendimento";

const consulta = (situacao: SituacaoConsulta): Consulta => ({
  id: "c1",
  pacienteId: "pac1",
  profissionalId: "pr1",
  cadeiraId: "cad1",
  inicio: "2026-10-01T09:00",
  duracaoMin: 45,
  procedimentoId: "limpeza",
  situacao,
});

beforeEach(() => {
  pacientes.substituirTudo([{ id: "pac1", nome: "Paciente Exemplo", nascimento: "1990-06-12", telefone: "" }]);
  profissionais.substituirTudo([{ id: "pr1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#0f766e" }]);
  procedimentos.substituirTudo([
    { id: "limpeza", nome: "Profilaxia", especialidade: "Prevenção", preco: 18_000, duracaoMin: 30, exigeDente: false, exigeFace: false, ativo: true },
  ]);
  consultas.substituirTudo([consulta("agendada")]);
});

function abrir(id = "c1") {
  const rotas = [
    { path: "/atendimento/:consultaId", Component: TelaDoAtendimento },
    { path: "/agenda", element: <p>Agenda</p> },
    { path: "/pacientes/:id", element: <p>Ficha</p> },
  ];
  render(<RouterProvider router={createMemoryRouter(rotas, { initialEntries: [`/atendimento/${id}`] })} />);
}

const iniciar = () => screen.queryByRole("button", { name: "Iniciar atendimento" });

describe("tela do atendimento", () => {
  it("consulta que não existe: avisa e leva de volta à agenda", () => {
    abrir("nenhuma");
    expect(screen.getByText("Atendimento não encontrado")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Voltar à agenda" }).getAttribute("href")).toBe("/agenda");
  });

  it("mostra a consulta, e abrir a tela não inicia nada: a situação só muda pelo botão", () => {
    abrir();

    for (const texto of ["Paciente Exemplo", "Dra. Exemplo", "Profilaxia", "Agendada", "O atendimento ainda não começou."]) {
      expect(screen.getAllByText(new RegExp(texto)).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/quinta-feira, 1 de outubro de 2026, 09:00–09:45/)).toBeTruthy();
    expect(consultas.obter("c1")?.situacao).toBe("agendada");
  });

  it("Iniciar atendimento leva a consulta para em atendimento e o botão some", () => {
    abrir();
    fireEvent.click(iniciar()!);

    expect(consultas.obter("c1")?.situacao).toBe("em-atendimento");
    expect(iniciar()).toBeNull();
    expect(screen.getByText("Em atendimento")).toBeTruthy();
  });

  it("os cartões de procedimentos realizados e de evolução só aparecem com a consulta em atendimento", () => {
    abrir();
    expect(screen.queryByText("Procedimentos realizados")).toBeNull();
    expect(screen.queryByText("Evolução clínica")).toBeNull();

    fireEvent.click(iniciar()!);
    expect(screen.getByText("Procedimentos realizados")).toBeTruthy();
    expect(screen.getByText("Evolução clínica")).toBeTruthy();
  });

  it.each<SituacaoConsulta>(["em-atendimento", "concluida", "faltou", "cancelada"])("consulta %s não oferece iniciar", (situacao) => {
    consultas.substituirTudo([consulta(situacao)]);
    abrir();
    expect(iniciar()).toBeNull();
  });
});
