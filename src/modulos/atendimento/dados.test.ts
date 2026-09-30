import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { consultas } from "@/dados/colecoes";
import type { Consulta, SituacaoConsulta } from "@/dominio";

import { evolucoes, LIMITE_DA_EVOLUCAO, registrarEvolucao } from "./dados";

const consulta = (situacao: SituacaoConsulta): Consulta => ({
  id: "c1",
  pacienteId: "pac1",
  profissionalId: "pr1",
  cadeiraId: "cad1",
  inicio: "2026-09-30T09:00",
  duracaoMin: 30,
  situacao,
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 30, 23, 30)); // à noite: o dia local segue sendo 30, e não o 1º de outubro do UTC
  consultas.substituirTudo([consulta("em-atendimento")]);
  evolucoes.substituirTudo([]);
});
afterEach(() => vi.useRealTimers());

describe("registrarEvolucao", () => {
  it("grava o texto, o dia de hoje, a consulta, o paciente e o profissional da consulta", () => {
    const r = registrarEvolucao("c1", "Paciente relatou sensibilidade.");

    expect(r.ok).toBe(true);
    expect(evolucoes.listar()).toHaveLength(1);
    expect(evolucoes.listar()[0]).toMatchObject({
      pacienteId: "pac1",
      consultaId: "c1",
      profissionalId: "pr1",
      dia: "2026-09-30",
      texto: "Paciente relatou sensibilidade.",
    });
    expect(r.ok && r.evolucao).toEqual(evolucoes.listar()[0]);
  });

  it("apara só as pontas: as quebras de linha do meio ficam como foram digitadas", () => {
    registrarEvolucao("c1", "  \n Primeira linha.\n\n  Segunda linha.  \n");
    expect(evolucoes.listar()[0].texto).toBe("Primeira linha.\n\n  Segunda linha.");
  });

  it("aceita o texto no limite; um caractere a mais é recusado", () => {
    expect(registrarEvolucao("c1", "a".repeat(LIMITE_DA_EVOLUCAO)).ok).toBe(true);
    const r = registrarEvolucao("c1", "a".repeat(LIMITE_DA_EVOLUCAO + 1));
    expect(r).toEqual({ ok: false, erro: "A evolução passa de 5.000 caracteres." });
    expect(evolucoes.listar()).toHaveLength(1);
  });

  it("evolução nova não substitui a anterior: as duas ficam, com ids diferentes", () => {
    registrarEvolucao("c1", "Primeira.");
    registrarEvolucao("c1", "Segunda.");

    const [a, b] = evolucoes.listar();
    expect([a.texto, b.texto]).toEqual(["Primeira.", "Segunda."]);
    expect(a.id).not.toBe(b.id);
  });

  it.each([
    ["texto vazio", "c1", "", "Escreva a evolução."],
    ["só espaços e quebras de linha", "c1", "  \n \t ", "Escreva a evolução."],
    ["consulta que não existe", "zzz", "Texto.", "Esta consulta não existe mais."],
  ])("recusa %s e não grava nada", (_caso, consultaId, texto, erro) => {
    expect(registrarEvolucao(consultaId, texto)).toEqual({ ok: false, erro });
    expect(evolucoes.listar()).toEqual([]);
  });

  it.each<SituacaoConsulta>(["agendada", "confirmada", "concluida", "faltou", "cancelada"])("consulta %s não recebe evolução", (situacao) => {
    consultas.substituirTudo([consulta(situacao)]);
    expect(registrarEvolucao("c1", "Texto.")).toEqual({ ok: false, erro: "A evolução se registra com a consulta em atendimento." });
    expect(evolucoes.listar()).toEqual([]);
  });
});
