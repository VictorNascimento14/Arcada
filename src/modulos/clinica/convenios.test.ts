import { beforeEach, describe, expect, it } from "vitest";

import { clinica, CLINICA_ID } from "@/dados/colecoes";
import type { Clinica } from "@/dominio";

import { adicionarConvenio, LIMITE_DO_NOME_DO_CONVENIO, removerConvenio, validarConvenio } from "./convenios";

const EXPEDIENTE: Clinica["expediente"] = { 0: [], 1: [{ inicio: "08:00", fim: "12:00" }], 2: [], 3: [], 4: [], 5: [], 6: [] };
const CLINICA: Clinica = { id: CLINICA_ID, nome: "Clínica Exemplo", cidade: "Cidade Exemplo", expediente: EXPEDIENTE };
const convenios = () => clinica.obter(CLINICA_ID)?.convenios;

beforeEach(() => {
  localStorage.clear();
  clinica.substituirTudo([CLINICA]);
});

describe("validarConvenio", () => {
  it("aceita um nome, com o tamanho máximo, e recusa um caractere a mais", () => {
    expect(validarConvenio("Plano Alfa")).toBeUndefined();
    expect(validarConvenio("a".repeat(LIMITE_DO_NOME_DO_CONVENIO))).toBeUndefined();
    expect(validarConvenio("a".repeat(LIMITE_DO_NOME_DO_CONVENIO + 1))).toBeTruthy();
  });

  it("exige o nome, mesmo que só tenha espaços", () => {
    expect(validarConvenio("")).toBeTruthy();
    expect(validarConvenio("   ")).toBeTruthy();
  });

  it("recusa o que já está na lista, sem distinguir caixa, acento nem espaço a mais", () => {
    const existentes = ["Convênio Exemplo"];

    expect(validarConvenio("convenio exemplo", existentes)).toBeTruthy();
    expect(validarConvenio("  CONVÊNIO   EXEMPLO ", existentes)).toBeTruthy();
    expect(validarConvenio("Convênio Exemplo Plus", existentes)).toBeUndefined();
  });
});

describe("adicionarConvenio", () => {
  it("guarda o nome aparado, em ordem alfabética (Ágil junto do A), sem tocar no resto da clínica", () => {
    expect(adicionarConvenio("  Saúde   Beta ")).toBeUndefined();
    adicionarConvenio("Plano Alfa");
    adicionarConvenio("Ágil Saúde");

    expect(convenios()).toEqual(["Ágil Saúde", "Plano Alfa", "Saúde Beta"]);
    expect(clinica.obter(CLINICA_ID)).toMatchObject({ nome: "Clínica Exemplo", cidade: "Cidade Exemplo", expediente: EXPEDIENTE });
    expect(clinica.listar()).toHaveLength(1);
  });

  it("com erro, devolve a mensagem e não grava", () => {
    adicionarConvenio("Plano Alfa");

    expect(adicionarConvenio("plano alfa")).toBeTruthy();
    expect(adicionarConvenio(" ")).toBeTruthy();
    expect(convenios()).toEqual(["Plano Alfa"]);
  });

  it("sem o registro da clínica, cria um só com a lista e a semana fechada", () => {
    clinica.substituirTudo([]);

    expect(adicionarConvenio("Plano Alfa")).toBeUndefined();

    const criada = clinica.obter(CLINICA_ID)!;
    expect(criada.convenios).toEqual(["Plano Alfa"]);
    expect(Object.values(criada.expediente).every((faixas) => faixas.length === 0)).toBe(true);
  });
});

describe("removerConvenio", () => {
  it("tira o convênio da lista e deixa os outros", () => {
    adicionarConvenio("Plano Alfa");
    adicionarConvenio("Saúde Beta");

    removerConvenio("Plano Alfa");

    expect(convenios()).toEqual(["Saúde Beta"]);
  });

  it("nome que não está na lista, ou clínica sem registro, é ignorado", () => {
    adicionarConvenio("Plano Alfa");
    removerConvenio("Outro");
    expect(convenios()).toEqual(["Plano Alfa"]);

    clinica.substituirTudo([]);
    removerConvenio("Plano Alfa");
    expect(clinica.listar()).toHaveLength(0); // não cria registro só para remover
  });
});
