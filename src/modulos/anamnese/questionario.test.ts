import { describe, expect, it } from "vitest";

import { LIMITE_DO_DETALHE, LIMITE_DO_TEXTO, PERGUNTAS, respostasValidas, SECOES, type Respostas } from "./questionario";

const simNao = PERGUNTAS.filter((p) => p.tipo === "simNao");

/** Toda pergunta sim/não respondida "não": o mínimo que se pode gravar. */
const MINIMAS = Object.fromEntries(simNao.map((p) => [p.id, { sim: false }]));

/** As respostas mínimas mais o que o caso acrescenta ou troca. */
const com = (mais: Record<string, unknown>) => ({ ...MINIMAS, ...mais });

describe("SECOES", () => {
  it("são as cinco seções do questionário, cada uma com perguntas", () => {
    expect(SECOES.map((s) => s.id)).toEqual(["saudeGeral", "medicamentos", "alergias", "habitos", "historicoOdontologico"]);
    for (const s of SECOES) expect(s.perguntas.length).toBeGreaterThan(0);
  });

  it("os ids das perguntas são únicos e sem acento, e o rótulo também não se repete", () => {
    expect(new Set(PERGUNTAS.map((p) => p.id)).size).toBe(PERGUNTAS.length);
    expect(new Set(PERGUNTAS.map((p) => p.rotulo)).size).toBe(PERGUNTAS.length);
    for (const { id } of PERGUNTAS) expect(id).toMatch(/^[a-z][A-Za-z]*$/);
  });

  it("tem perguntas sim/não e de texto", () => {
    expect(simNao.length).toBeGreaterThan(0);
    expect(PERGUNTAS.length - simNao.length).toBeGreaterThan(0);
  });
});

describe("respostasValidas", () => {
  it("aceita as sim/não respondidas, com ou sem detalhe, e as de texto respondidas, em branco ou ausentes", () => {
    const exemplo: Respostas = { alergia: { sim: true, detalhe: "Penicilina" }, motivoDaConsulta: "Revisão", outrosProblemas: "" };
    expect(respostasValidas(MINIMAS)).toBe(true);
    expect(respostasValidas(com(exemplo))).toBe(true);
  });

  it("exige toda pergunta sim/não respondida: não responder não é responder não", () => {
    const incompleta = { ...MINIMAS };
    delete incompleta[simNao[0].id];
    expect(respostasValidas({})).toBe(false);
    expect(respostasValidas(incompleta)).toBe(false);
    expect(respostasValidas(com({ [simNao[0].id]: undefined }))).toBe(false);
  });

  it("recusa pergunta que o questionário não tem", () => {
    expect(respostasValidas(com({ inexistente: "x" }))).toBe(false);
  });

  it("recusa resposta de outro tipo que o da pergunta", () => {
    // @ts-expect-error pergunta de texto não recebe resposta sim/não
    const errada: Respostas = { motivoDaConsulta: { sim: true } };
    expect(respostasValidas(com(errada))).toBe(false);
    for (const valor of ["sim", true, null, {}, { sim: "sim" }, { detalhe: "x" }]) {
      expect(respostasValidas(com({ diabetes: valor }))).toBe(false);
    }
    for (const valor of [3, null, ["x"]]) expect(respostasValidas(com({ motivoDaConsulta: valor }))).toBe(false);
  });

  it("aceita detalhe só onde a pergunta tem campo de detalhe", () => {
    expect(respostasValidas(com({ alergia: { sim: true, detalhe: "Látex" } }))).toBe(true);
    expect(respostasValidas(com({ diabetes: { sim: true, detalhe: "Tipo 2" } }))).toBe(false);
    expect(respostasValidas(com({ alergia: { sim: true, detalhe: 3 } }))).toBe(false);
  });

  it("aceita o tamanho máximo do detalhe e do texto, e recusa um caractere a mais", () => {
    const detalhe = (n: number) => com({ alergia: { sim: true, detalhe: "a".repeat(n) } });
    const texto = (n: number) => com({ motivoDaConsulta: "a".repeat(n) });
    expect(respostasValidas(detalhe(LIMITE_DO_DETALHE))).toBe(true);
    expect(respostasValidas(detalhe(LIMITE_DO_DETALHE + 1))).toBe(false);
    expect(respostasValidas(texto(LIMITE_DO_TEXTO))).toBe(true);
    expect(respostasValidas(texto(LIMITE_DO_TEXTO + 1))).toBe(false);
  });

  it("recusa o que não é um conjunto de respostas", () => {
    for (const valor of [undefined, null, "x", 3, [], [MINIMAS]]) expect(respostasValidas(valor)).toBe(false);
  });
});
