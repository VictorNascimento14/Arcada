import { beforeEach, describe, expect, it } from "vitest";

import { pacientes, planos, procedimentos } from "@/dados/colecoes";
import type { ItemPlano, Paciente, PlanoTratamento, Procedimento } from "@/dominio";

import { CAMPOS_VAZIOS, type CamposDoItem } from "./itens";
import { adicionarItem, criarPlano, definirDesconto, mudarSituacao, removerItem } from "./planos";

const PACIENTE: Paciente = { id: "pac1", nome: "Paciente Exemplo", nascimento: "1990-06-12", telefone: "" };
const RESINA: Procedimento = {
  id: "resina",
  nome: "Restauração em resina",
  especialidade: "Dentística",
  preco: 22_000,
  duracaoMin: 50,
  exigeDente: true,
  exigeFace: true,
  ativo: true,
};
const ITEM: ItemPlano = { id: "i1", procedimentoId: "resina", dente: 16, faces: ["O"], preco: 20_000 };
const PLANO: PlanoTratamento = { id: "pl1", pacienteId: "pac1", itens: [], desconto: 0, situacao: "proposto" };
const COM_ITEM: PlanoTratamento = { ...PLANO, itens: [ITEM] };
const CAMPOS: CamposDoItem = { ...CAMPOS_VAZIOS, procedimentoId: "resina", dente: "16", faces: ["M", "O"], preco: "200,00" };

const itensDo = (id: string) => planos.obter(id)?.itens ?? [];

beforeEach(() => {
  pacientes.substituirTudo([PACIENTE]);
  procedimentos.substituirTudo([RESINA]);
  planos.substituirTudo([]);
});

describe("criarPlano", () => {
  it("cria o plano proposto do paciente, sem itens nem desconto, e o grava", () => {
    const plano = criarPlano("pac1");

    expect(plano).toMatchObject({ pacienteId: "pac1", itens: [], desconto: 0, situacao: "proposto" });
    expect(planos.obter(plano.id)).toEqual(plano);
  });

  it("paciente que não existe: lança e não grava", () => {
    expect(() => criarPlano("fantasma")).toThrow(/não existe/);
    expect(planos.listar()).toHaveLength(0);
  });
});

describe("adicionarItem", () => {
  beforeEach(() => planos.substituirTudo([PLANO]));

  it("grava o item com id, dente, faces e o preço ajustado", () => {
    expect(adicionarItem("pl1", CAMPOS)).toEqual({});

    const [item] = itensDo("pl1");
    expect(item).toMatchObject({ procedimentoId: "resina", dente: 16, faces: ["M", "O"], preco: 20_000 });
    expect(item.id).toBeTruthy();
  });

  it("dois itens do mesmo procedimento ficam com ids diferentes", () => {
    adicionarItem("pl1", CAMPOS);
    adicionarItem("pl1", CAMPOS);

    const [a, b] = itensDo("pl1");
    expect(a.id).not.toBe(b.id);
  });

  it("campo inválido devolve os erros e não grava", () => {
    expect(adicionarItem("pl1", { ...CAMPOS, faces: [] })).toEqual({ faces: "Marque ao menos uma face." });
    expect(itensDo("pl1")).toEqual([]);
  });

  it.each(["aprovado", "em-andamento", "concluido", "recusado"] as const)("plano %s não recebe item: lança", (situacao) => {
    planos.substituirTudo([{ ...PLANO, situacao }]);
    expect(() => adicionarItem("pl1", CAMPOS)).toThrow(/proposto/);
    expect(itensDo("pl1")).toEqual([]);
  });

  it("plano que não existe: lança", () => {
    expect(() => adicionarItem("fantasma", CAMPOS)).toThrow(/não existe/);
  });
});

describe("removerItem", () => {
  it("tira só o item pedido", () => {
    planos.substituirTudo([{ ...PLANO, itens: [ITEM, { ...ITEM, id: "i2" }] }]);
    removerItem("pl1", "i1");
    expect(itensDo("pl1").map((i) => i.id)).toEqual(["i2"]);
  });

  it("plano aprovado não perde item: lança", () => {
    planos.substituirTudo([{ ...COM_ITEM, situacao: "aprovado" }]);
    expect(() => removerItem("pl1", "i1")).toThrow(/proposto/);
    expect(itensDo("pl1")).toHaveLength(1);
  });
});

describe("definirDesconto", () => {
  it("aplica o desconto sobre o subtotal e o substitui na vez seguinte", () => {
    planos.substituirTudo([COM_ITEM]);

    definirDesconto("pl1", { tipo: "percentual", percentual: 10 });
    expect(planos.obter("pl1")?.desconto).toBe(2_000);

    definirDesconto("pl1", { tipo: "valor", valor: 500 });
    expect(planos.obter("pl1")?.desconto).toBe(500);
  });

  it("plano aprovado não muda de desconto: lança", () => {
    planos.substituirTudo([{ ...COM_ITEM, situacao: "aprovado" }]);
    expect(() => definirDesconto("pl1", { tipo: "valor", valor: 500 })).toThrow(/proposto/);
  });
});

describe("mudarSituacao", () => {
  it("aprova o plano que tem item", () => {
    planos.substituirTudo([COM_ITEM]);
    mudarSituacao("pl1", "aprovado");
    expect(planos.obter("pl1")?.situacao).toBe("aprovado");
  });

  it("plano sem item não se aprova, mas se recusa", () => {
    planos.substituirTudo([PLANO]);

    expect(() => mudarSituacao("pl1", "aprovado")).toThrow(/sem itens/);
    expect(planos.obter("pl1")?.situacao).toBe("proposto");

    mudarSituacao("pl1", "recusado");
    expect(planos.obter("pl1")?.situacao).toBe("recusado");
  });

  it("segue as transições de situacao.ts: pular etapa lança e nada muda", () => {
    planos.substituirTudo([COM_ITEM]);
    expect(() => mudarSituacao("pl1", "concluido")).toThrow(RangeError);
    expect(planos.obter("pl1")?.situacao).toBe("proposto");
  });
});
