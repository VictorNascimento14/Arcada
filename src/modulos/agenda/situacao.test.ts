import { describe, expect, it } from "vitest";

import type { SituacaoConsulta } from "@/dominio";

import { podeTransitar, transicoesDe } from "./situacao";

const SITUACOES: SituacaoConsulta[] = ["agendada", "confirmada", "em-atendimento", "concluida", "faltou", "cancelada"];

describe("transicoesDe", () => {
  // A ordem importa: é a dos botões da tela.
  it.each<[SituacaoConsulta, SituacaoConsulta[]]>([
    ["agendada", ["confirmada", "faltou", "cancelada"]],
    ["confirmada", ["em-atendimento", "faltou", "cancelada"]],
    ["em-atendimento", ["concluida"]],
    ["concluida", []],
    ["faltou", []],
    ["cancelada", []],
  ])("de %s a consulta pode ir para %j", (situacao, esperado) => {
    expect(transicoesDe(situacao)).toEqual(esperado);
  });
});

describe("podeTransitar", () => {
  it("aceita só as sete transições da regra, entre as 36 combinações de situação", () => {
    const aceitas = SITUACOES.flatMap((de) =>
      SITUACOES.filter((para) => podeTransitar(de, para)).map((para) => `${de} > ${para}`),
    );
    expect(aceitas).toEqual([
      "agendada > confirmada",
      "agendada > faltou",
      "agendada > cancelada",
      "confirmada > em-atendimento",
      "confirmada > faltou",
      "confirmada > cancelada",
      "em-atendimento > concluida",
    ]);
  });
});
