import { describe, expect, it } from "vitest";

import type { SituacaoConsulta } from "@/dominio";

import { ACAO_DA_SITUACAO, podeTransitar, transicoesDe } from "./situacao";

const SITUACOES: SituacaoConsulta[] = ["agendada", "confirmada", "em-atendimento", "concluida", "faltou", "cancelada"];

describe("transicoesDe", () => {
  // A ordem importa: é a dos botões da tela.
  it.each<[SituacaoConsulta, SituacaoConsulta[]]>([
    ["agendada", ["confirmada", "em-atendimento", "faltou", "cancelada"]],
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
  it("aceita só as oito transições da regra, entre as 36 combinações de situação", () => {
    const aceitas = SITUACOES.flatMap((de) =>
      SITUACOES.filter((para) => podeTransitar(de, para)).map((para) => `${de} > ${para}`),
    );
    expect(aceitas).toEqual([
      "agendada > confirmada",
      "agendada > em-atendimento",
      "agendada > faltou",
      "agendada > cancelada",
      "confirmada > em-atendimento",
      "confirmada > faltou",
      "confirmada > cancelada",
      "em-atendimento > concluida",
    ]);
  });
});

describe("ACAO_DA_SITUACAO", () => {
  it("todo destino de transição tem o verbo do botão", () => {
    for (const de of SITUACOES) for (const para of transicoesDe(de)) expect(ACAO_DA_SITUACAO[para], `${de} > ${para}`).toBeTruthy();
  });
});
