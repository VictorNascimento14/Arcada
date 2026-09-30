import { beforeEach, describe, expect, it } from "vitest";

import { clinica, CLINICA_ID } from "@/dados/colecoes";
import type { Clinica } from "@/dominio";

import { camposDaClinica, LIMITES, salvarDadosDaClinica, validarDadosDaClinica, type CamposDaClinica } from "./dadosDaClinica";

const EXPEDIENTE: Clinica["expediente"] = { 0: [], 1: [{ inicio: "08:00", fim: "12:00" }], 2: [], 3: [], 4: [], 5: [], 6: [] };
const COMPLETOS: CamposDaClinica = { nome: "Clínica Exemplo", telefone: "(00) 3000-0000", endereco: "Rua Exemplo, 100", cidade: "Cidade Exemplo", uf: "SP" };
const SO_O_NOME: CamposDaClinica = { nome: "Clínica Exemplo", telefone: "", endereco: "", cidade: "", uf: "" };

beforeEach(() => {
  localStorage.clear();
  clinica.substituirTudo([{ id: CLINICA_ID, nome: "Nome antigo", expediente: EXPEDIENTE }]);
});

describe("validarDadosDaClinica", () => {
  it("aceita os dados completos e só o nome, com o resto vazio", () => {
    expect(validarDadosDaClinica(COMPLETOS)).toEqual({});
    expect(validarDadosDaClinica(SO_O_NOME)).toEqual({});
  });

  it("exige o nome, mesmo que só tenha espaços", () => {
    expect(validarDadosDaClinica({ ...SO_O_NOME, nome: "" }).nome).toBeTruthy();
    expect(validarDadosDaClinica({ ...SO_O_NOME, nome: "   " }).nome).toBeTruthy();
  });

  it("aceita o tamanho máximo do campo e recusa um caractere a mais", () => {
    expect(validarDadosDaClinica({ ...COMPLETOS, endereco: "a".repeat(LIMITES.endereco) })).toEqual({});
    expect(validarDadosDaClinica({ ...COMPLETOS, endereco: "a".repeat(LIMITES.endereco + 1) }).endereco).toBeTruthy();
    expect(validarDadosDaClinica({ ...COMPLETOS, nome: "a".repeat(LIMITES.nome + 1) }).nome).toBeTruthy();
  });

  it("só aceita sigla de UF que existe, em maiúsculas", () => {
    expect(validarDadosDaClinica({ ...COMPLETOS, uf: "DF" })).toEqual({});
    expect(validarDadosDaClinica({ ...COMPLETOS, uf: "XX" }).uf).toBeTruthy();
    expect(validarDadosDaClinica({ ...COMPLETOS, uf: "sp" }).uf).toBeTruthy();
  });
});

describe("salvarDadosDaClinica", () => {
  it("grava aparando os espaços, guarda o vazio como ausente e mantém o expediente", () => {
    const erros = salvarDadosDaClinica({ ...COMPLETOS, nome: "  Clínica Boa  ", telefone: "  ", uf: "" });

    expect(erros).toEqual({});
    const salva = clinica.obter(CLINICA_ID)!;
    expect(salva).toMatchObject({ nome: "Clínica Boa", endereco: "Rua Exemplo, 100", cidade: "Cidade Exemplo" });
    expect(salva.telefone).toBeUndefined();
    expect(salva.uf).toBeUndefined();
    expect(salva.expediente).toEqual(EXPEDIENTE);
    expect(clinica.listar()).toHaveLength(1);
  });

  it("com erro, devolve as mensagens e não grava nada", () => {
    const erros = salvarDadosDaClinica({ ...COMPLETOS, nome: " ", uf: "XX" });

    expect(Object.keys(erros).sort()).toEqual(["nome", "uf"]);
    expect(clinica.obter(CLINICA_ID)!.nome).toBe("Nome antigo");
  });

  it("cria o registro quando a clínica ainda não existe, com a semana fechada", () => {
    clinica.substituirTudo([]);

    expect(salvarDadosDaClinica(COMPLETOS)).toEqual({});
    const salva = clinica.obter(CLINICA_ID)!;
    expect(salva.nome).toBe("Clínica Exemplo");
    expect(Object.values(salva.expediente).every((faixas) => faixas.length === 0)).toBe(true);
  });
});

describe("camposDaClinica", () => {
  it("devolve texto vazio no que falta, e tudo vazio sem clínica", () => {
    expect(camposDaClinica({ id: CLINICA_ID, nome: "X", expediente: EXPEDIENTE })).toEqual({ ...SO_O_NOME, nome: "X" });
    expect(camposDaClinica(undefined)).toEqual({ nome: "", telefone: "", endereco: "", cidade: "", uf: "" });
  });
});
