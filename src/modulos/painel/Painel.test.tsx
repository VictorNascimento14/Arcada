import { act, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { consultas, pacientes, profissionais } from "@/dados/colecoes";
import type { Consulta, Paciente, Profissional, SituacaoConsulta } from "@/dominio";

import Painel from "./Painel";

// Tudo fictício: telefones com DDD 00, que não existe; nenhum CPF.
const PACIENTES: Paciente[] = [
  { id: "a1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002" },
  { id: "a2", nome: "João Pedro Alves", nascimento: "2018-05-14", telefone: "(00) 90000-0005" },
  { id: "a3", nome: "Helena Duarte", nascimento: "1996-12-30", telefone: "(00) 90000-0004" },
];
const PROFISSIONAIS: Profissional[] = [
  { id: "p1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b" },
  { id: "p2", nome: "Dr. Exemplo", cro: "CRO-SP 00001", cor: "#4a6fa5" },
];

const consulta = (id: string, inicio: string, pacienteId: string, situacao: SituacaoConsulta, profissionalId = "p1"): Consulta => ({
  id,
  pacienteId,
  profissionalId,
  cadeiraId: "c1",
  inicio,
  duracaoMin: 30,
  situacao,
});

// Fora de ordem de propósito: quem ordena é a regra. Hoje é quarta-feira, 30/09/2026.
const CONSULTAS: Consulta[] = [
  consulta("k5", "2026-09-30T15:00", "a3", "agendada"),
  consulta("k1", "2026-09-30T08:00", "a1", "concluida"),
  consulta("k2", "2026-09-30T10:30", "a2", "confirmada", "p2"),
  consulta("k3", "2026-09-30T14:00", "a3", "cancelada"),
  consulta("k4", "2026-10-01T09:00", "a1", "agendada"),
];

const TODAS = [consultas, pacientes, profissionais];

/** Fixa "agora" e deixa correr só o relógio do painel (`setInterval`): por isso as buscas aqui são síncronas. */
function abrir(hora: number, minuto = 0, segundo = 0) {
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
  vi.setSystemTime(new Date(2026, 8, 30, hora, minuto, segundo));
  render(
    <MemoryRouter>
      <Painel />
    </MemoryRouter>,
  );
}

const secao = () => screen.getByRole("region", { name: "Consultas de hoje" });
const proxima = () => screen.getByRole("group", { name: "Próxima consulta" });

beforeEach(() => {
  pacientes.substituirTudo(PACIENTES);
  profissionais.substituirTudo(PROFISSIONAIS);
  consultas.substituirTudo(CONSULTAS);
});

afterEach(() => {
  vi.useRealTimers();
  for (const c of TODAS) c.substituirTudo([]);
});

describe("painel: consultas de hoje", () => {
  it("lista as do dia em ordem de horário, com a situação, sem a cancelada nem as de outro dia", () => {
    abrir(9);

    const linhas = within(secao()).getAllByRole("listitem");
    expect(linhas.map((li) => li.textContent)).toEqual([
      "08:00Ana Beatriz MouraDra. ExemploConcluída",
      "10:30João Pedro AlvesDr. ExemploConfirmada",
      "15:00Helena DuarteDra. ExemploAgendada",
    ]);
  });

  it("destaca a próxima: a primeira que ainda vai começar", () => {
    abrir(9);

    expect(proxima().textContent).toContain("10:30");
    expect(proxima().textContent).toContain("João Pedro Alves");
    expect(proxima().textContent).toContain("Confirmada");
  });

  it("passa sozinho: a cada minuto a próxima é recalculada", () => {
    abrir(10, 30, 30); // às 10:30 a consulta das 10:30 ainda é a próxima
    expect(proxima().textContent).toContain("João Pedro Alves");

    act(() => {
      vi.advanceTimersByTime(60_000); // 10:31
    });

    expect(proxima().textContent).toContain("Helena Duarte");
  });

  it("depois do último horário não há próxima, e a lista segue inteira", () => {
    abrir(16);

    expect(screen.queryByRole("group", { name: "Próxima consulta" })).toBeNull();
    expect(screen.getByText("Nenhuma consulta por começar hoje.")).toBeTruthy();
    expect(within(secao()).getAllByRole("listitem")).toHaveLength(3);
  });

  it("sem consulta hoje, diz isso e leva à agenda", () => {
    consultas.substituirTudo(CONSULTAS.filter((c) => c.inicio.startsWith("2026-10-01")));
    abrir(9);

    expect(screen.getByText(/Nenhuma consulta marcada para hoje/)).toBeTruthy();
    expect(within(secao()).queryByRole("list")).toBeNull();
    expect(screen.getByRole("link", { name: "Abrir a agenda" }).getAttribute("href")).toBe("/agenda");
  });

  it("paciente ou profissional removido aparece como tal, em vez de a consulta sumir", () => {
    consultas.substituirTudo([consulta("k6", "2026-09-30T10:00", "sumiu", "agendada", "sumiu")]);
    abrir(9);

    const [linha] = within(secao()).getAllByRole("listitem");
    expect(linha.textContent).toContain("Paciente removido");
    expect(linha.textContent).toContain("Profissional removido");
  });
});
