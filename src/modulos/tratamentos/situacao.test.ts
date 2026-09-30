import { describe, expect, it } from "vitest";

import type { PlanoTratamento, SituacaoPlano } from "@/dominio";

import { podeTransitar, proximasSituacoes, transitar } from "./situacao";

const SITUACOES: SituacaoPlano[] = ["proposto", "aprovado", "em-andamento", "concluido", "recusado"];

// O fluxo, escrito à parte da implementação: só estas quatro passagens existem.
const PERMITIDAS = ["proposto>aprovado", "proposto>recusado", "aprovado>em-andamento", "em-andamento>concluido"];

const plano = (situacao: SituacaoPlano): PlanoTratamento => ({
  id: "plano-1",
  pacienteId: "paciente-1",
  itens: [{ id: "item-1", procedimentoId: "proc-restauracao", dente: 16, faces: ["O", "M"], preco: 25000 }],
  desconto: 1500,
  situacao,
});

describe("podeTransitar", () => {
  const pares = SITUACOES.flatMap((de) => SITUACOES.map((para): [SituacaoPlano, SituacaoPlano] => [de, para]));

  it.each(pares)("%s para %s", (de, para) => {
    expect(podeTransitar(de, para)).toBe(PERMITIDAS.includes(`${de}>${para}`));
  });
});

describe("proximasSituacoes", () => {
  it.each<[SituacaoPlano, SituacaoPlano[]]>([
    ["proposto", ["aprovado", "recusado"]],
    ["aprovado", ["em-andamento"]],
    ["em-andamento", ["concluido"]],
    ["concluido", []], // fim
    ["recusado", []], // fim
  ])("de %s vai para %j", (situacao, esperado) => {
    expect(proximasSituacoes(situacao)).toEqual(esperado);
  });
});

describe("transitar", () => {
  it("devolve o plano na nova situação, com o resto intacto e sem mexer no original", () => {
    const antes = plano("proposto");
    const depois = transitar(antes, "aprovado");
    expect(depois).toEqual({ ...antes, situacao: "aprovado" });
    expect(antes.situacao).toBe("proposto");
  });

  it("percorre o caminho inteiro: proposto, aprovado, em andamento, concluído", () => {
    const fim = (["aprovado", "em-andamento", "concluido"] as const).reduce(transitar, plano("proposto"));
    expect(fim.situacao).toBe("concluido");
  });

  it("recusar é um fim de linha: o plano recusado não avança", () => {
    const recusado = transitar(plano("proposto"), "recusado");
    for (const para of SITUACOES) expect(() => transitar(recusado, para)).toThrow(RangeError);
  });

  it.each<[SituacaoPlano, SituacaoPlano]>([
    ["proposto", "concluido"], // não pula etapa
    ["proposto", "em-andamento"],
    ["aprovado", "recusado"], // depois de aprovado não se recusa
    ["concluido", "em-andamento"], // não volta
    ["aprovado", "aprovado"], // ficar onde está não é transição
  ])("recusa de %s para %s", (de, para) => {
    expect(() => transitar(plano(de), para)).toThrow(RangeError);
  });
});
