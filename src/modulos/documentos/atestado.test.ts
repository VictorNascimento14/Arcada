import { describe, expect, it } from "vitest";

import type { Paciente, Profissional } from "@/dominio";

import { camposDoAtestado, LIMITE_DA_FINALIDADE, prepararAtestado, textoDoPeriodo, type CamposDoAtestado } from "./atestado";

// Fictícios, sem CPF.
const ANA: Paciente = { id: "p1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002", email: "ana@exemplo.com" };
const DRA: Profissional = { id: "d1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b", especialidade: "Clínica geral" };

const campos = (extra: Partial<CamposDoAtestado> = {}): CamposDoAtestado => ({
  pacienteId: "p1",
  profissionalId: "d1",
  dataInicio: "2026-09-30",
  horaInicio: "08:00",
  dataFim: "2026-09-30",
  horaFim: "12:00",
  finalidade: "Finalidade de teste.",
  ...extra,
});
const preparar = (c: CamposDoAtestado) => prepararAtestado(c, [ANA], [DRA]);

describe("camposDoAtestado", () => {
  it("abre começando e terminando na data dada, sem ninguém escolhido, sem hora e sem finalidade: nada é escrito pelo app", () => {
    expect(camposDoAtestado("2026-09-30")).toEqual({
      pacienteId: "",
      profissionalId: "",
      dataInicio: "2026-09-30",
      horaInicio: "",
      dataFim: "2026-09-30",
      horaFim: "",
      finalidade: "",
    });
  });
});

describe("textoDoPeriodo", () => {
  it("no mesmo dia escreve a data uma vez, com as horas; em dias diferentes, o início e o fim por inteiro", () => {
    expect(textoDoPeriodo("2026-09-30T08:00", "2026-09-30T12:00")).toBe("30/09/2026, das 08:00 às 12:00");
    expect(textoDoPeriodo("2026-09-30T08:00", "2026-10-02T18:30")).toBe("de 30/09/2026 às 08:00 até 02/10/2026 às 18:30");
  });
});

describe("prepararAtestado", () => {
  it("monta só o que vai para o papel: nome do paciente, nome e CRO de quem assina, o período escrito e a finalidade", () => {
    expect(preparar(campos())).toEqual({
      ok: true,
      dados: {
        paciente: { nome: "Ana Beatriz Moura" },
        profissional: { nome: "Dra. Exemplo", cro: "CRO-SP 00000" },
        periodo: "30/09/2026, das 08:00 às 12:00",
        finalidade: "Finalidade de teste.",
      },
    });
  });

  it("aceita um período de vários dias e guarda as quebras de linha da finalidade, cortando só as pontas", () => {
    const r = preparar(campos({ dataFim: "2026-10-02", horaFim: "18:00", finalidade: "\n Primeira linha\nSegunda linha \n" }));

    expect(r.ok && r.dados.periodo).toBe("de 30/09/2026 às 08:00 até 02/10/2026 às 18:00");
    expect(r.ok && r.dados.finalidade).toBe("Primeira linha\nSegunda linha");
  });

  it("formulário em branco: um erro por campo, sem imprimir nada", () => {
    expect(prepararAtestado(camposDoAtestado(""), [ANA], [DRA])).toEqual({
      ok: false,
      erros: {
        pacienteId: "Escolha o paciente.",
        profissionalId: "Escolha o profissional.",
        dataInicio: "Informe a data de início.",
        horaInicio: "Informe a hora de início.",
        dataFim: "Informe a data de fim.",
        horaFim: "Informe a hora de fim.",
        finalidade: "Escreva a finalidade do atestado.",
      },
    });
  });

  it("o fim tem de ser depois do início: no mesmo dia o erro é da hora, em dias diferentes é da data", () => {
    expect(preparar(campos({ horaFim: "08:00" }))).toEqual({ ok: false, erros: { horaFim: "O fim tem de ser depois do início." } }); // igual não vale
    expect(preparar(campos({ horaFim: "07:59" }))).toEqual({ ok: false, erros: { horaFim: "O fim tem de ser depois do início." } });
    expect(preparar(campos({ dataFim: "2026-09-29", horaFim: "18:00" }))).toEqual({
      ok: false,
      erros: { dataFim: "O fim tem de ser depois do início." },
    });
  });

  it("data que o calendário não tem e hora que o relógio não tem contam como vazias", () => {
    expect(preparar(campos({ dataInicio: "2026-02-30" }))).toEqual({ ok: false, erros: { dataInicio: "Informe a data de início." } });
    expect(preparar(campos({ horaFim: "24:00" }))).toEqual({ ok: false, erros: { horaFim: "Informe a hora de fim." } });
  });

  it("finalidade só de espaços conta como vazia; no limite passa e um caractere a mais não", () => {
    expect(preparar(campos({ finalidade: " \n\t " }))).toEqual({ ok: false, erros: { finalidade: "Escreva a finalidade do atestado." } });
    expect(preparar(campos({ finalidade: "a".repeat(LIMITE_DA_FINALIDADE) })).ok).toBe(true);
    expect(preparar(campos({ finalidade: "a".repeat(LIMITE_DA_FINALIDADE + 1) }))).toEqual({
      ok: false,
      erros: { finalidade: `Use no máximo ${LIMITE_DA_FINALIDADE} caracteres.` },
    });
  });

  it("profissional inativo não assina, mesmo escolhido antes de ser desativado", () => {
    const r = prepararAtestado(campos(), [ANA], [{ ...DRA, ativo: false }]);

    expect(r).toEqual({ ok: false, erros: { profissionalId: "Escolha o profissional." } });
  });
});
