import { describe, expect, it } from "vitest";

import type { Consulta, Paciente, Profissional, SituacaoConsulta } from "@/dominio";

import { camposDaDeclaracao, consultasDoPaciente, horarioDaConsulta, prepararDeclaracao, type CamposDaDeclaracao } from "./declaracao";

// Fictícios, sem CPF.
const ANA: Paciente = { id: "p1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002", email: "ana@exemplo.com" };
const DRA: Profissional = { id: "d1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b", especialidade: "Clínica geral" };

const campos = (extra: Partial<CamposDaDeclaracao> = {}): CamposDaDeclaracao => ({
  pacienteId: "p1",
  profissionalId: "d1",
  consultaId: "",
  data: "2026-09-30",
  horaInicio: "08:00",
  horaFim: "09:00",
  ...extra,
});
const preparar = (c: CamposDaDeclaracao) => prepararDeclaracao(c, [ANA], [DRA]);
const consulta = (id: string, pacienteId: string, inicio: string, situacao: SituacaoConsulta = "concluida", duracaoMin = 60): Consulta => ({
  id,
  pacienteId,
  profissionalId: "d1",
  cadeiraId: "c1",
  inicio,
  duracaoMin,
  situacao,
});

describe("camposDaDeclaracao", () => {
  it("abre na data dada, sem ninguém, sem consulta e sem horário", () => {
    expect(camposDaDeclaracao("2026-09-30")).toEqual({
      pacienteId: "",
      profissionalId: "",
      consultaId: "",
      data: "2026-09-30",
      horaInicio: "",
      horaFim: "",
    });
  });
});

describe("consultasDoPaciente", () => {
  it("só as do paciente, sem faltas nem canceladas, da mais recente para a mais antiga", () => {
    const todas = [
      consulta("a", "p1", "2026-09-10T08:00"),
      consulta("b", "p2", "2026-09-11T08:00"), // de outro paciente
      consulta("c", "p1", "2026-09-30T14:30", "confirmada"),
      consulta("d", "p1", "2026-09-20T09:00", "faltou"), // não compareceu
      consulta("e", "p1", "2026-09-25T09:00", "cancelada"), // não houve
      consulta("f", "p1", "2026-09-15T09:00", "em-atendimento"),
      consulta("g", "p1", "2026-09-05T09:00", "agendada"),
    ];

    expect(consultasDoPaciente(todas, "p1").map((c) => c.id)).toEqual(["c", "f", "a", "g"]);
    expect(todas.map((c) => c.id)).toEqual(["a", "b", "c", "d", "e", "f", "g"]); // a lista de entrada não é reordenada
    expect(consultasDoPaciente(todas, "p9")).toEqual([]);
  });
});

describe("horarioDaConsulta", () => {
  it("o dia e o início da consulta, e o fim é o início mais a duração", () => {
    expect(horarioDaConsulta({ inicio: "2026-09-30T08:00", duracaoMin: 60 })).toEqual({ data: "2026-09-30", horaInicio: "08:00", horaFim: "09:00" });
    expect(horarioDaConsulta({ inicio: "2026-09-30T08:30", duracaoMin: 45 })).toEqual({ data: "2026-09-30", horaInicio: "08:30", horaFim: "09:15" });
  });

  it("consulta que passa da meia-noite termina às 23:59: a declaração é de um dia só", () => {
    expect(horarioDaConsulta({ inicio: "2026-09-30T23:30", duracaoMin: 60 }).horaFim).toBe("23:59");
  });
});

describe("prepararDeclaracao", () => {
  it("monta só o que vai para o papel: nome do paciente, nome e CRO de quem assina, o dia e o horário", () => {
    expect(preparar(campos())).toEqual({
      ok: true,
      dados: {
        paciente: { nome: "Ana Beatriz Moura" },
        profissional: { nome: "Dra. Exemplo", cro: "CRO-SP 00000" },
        quando: "30/09/2026, das 08:00 às 09:00",
      },
    });
  });

  it("a consulta escolhida só ajuda a preencher: não muda o que vai para o papel", () => {
    expect(preparar(campos({ consultaId: "qualquer" }))).toEqual(preparar(campos()));
  });

  it("formulário em branco: um erro por campo, sem imprimir nada", () => {
    expect(prepararDeclaracao(camposDaDeclaracao(""), [ANA], [DRA])).toEqual({
      ok: false,
      erros: {
        pacienteId: "Escolha o paciente.",
        profissionalId: "Escolha o profissional.",
        data: "Informe a data.",
        horaInicio: "Informe a hora de início.",
        horaFim: "Informe a hora de fim.",
      },
    });
  });

  it("o fim tem de ser depois do início: igual e antes são recusados", () => {
    expect(preparar(campos({ horaFim: "08:00" }))).toEqual({ ok: false, erros: { horaFim: "O fim tem de ser depois do início." } });
    expect(preparar(campos({ horaFim: "07:59" }))).toEqual({ ok: false, erros: { horaFim: "O fim tem de ser depois do início." } });
  });

  it("data que o calendário não tem e hora que o relógio não tem contam como vazias", () => {
    expect(preparar(campos({ data: "2026-02-30" }))).toEqual({ ok: false, erros: { data: "Informe a data." } });
    expect(preparar(campos({ horaInicio: "24:00" }))).toEqual({ ok: false, erros: { horaInicio: "Informe a hora de início." } });
  });

  it("profissional inativo não assina, mesmo escolhido antes de ser desativado", () => {
    const r = prepararDeclaracao(campos(), [ANA], [{ ...DRA, ativo: false }]);

    expect(r).toEqual({ ok: false, erros: { profissionalId: "Escolha o profissional." } });
  });
});
