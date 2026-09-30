import { beforeEach, describe, expect, it } from "vitest";

import { profissionais } from "@/dados/colecoes";
import type { Profissional } from "@/dominio";

import {
  camposDoProfissional,
  CORES_DA_AGENDA,
  LIMITES_DO_PROFISSIONAL,
  salvarProfissional,
  validarProfissional,
  type CamposDoProfissional,
} from "./profissionais";

const COMPLETOS: CamposDoProfissional = { nome: "Dra. Exemplo", cro: "CRO-SP 00000", especialidade: "Endodontia", cor: "#4a6fa5", ativo: true };
const EXISTENTE: Profissional = { id: "p1", nome: "Dr. Exemplo", cro: "CRO-SP 00001", cor: "#1f6f5b" };

beforeEach(() => {
  localStorage.clear();
  profissionais.substituirTudo([EXISTENTE]);
});

describe("CORES_DA_AGENDA", () => {
  it("são cores hexadecimais distintas", () => {
    const valores = CORES_DA_AGENDA.map((c) => c.valor);
    expect(valores.every((v) => /^#[0-9a-f]{6}$/.test(v))).toBe(true);
    expect(new Set(valores).size).toBe(valores.length);
  });
});

describe("validarProfissional", () => {
  it("aceita os dados completos e só o essencial, sem especialidade", () => {
    expect(validarProfissional(COMPLETOS)).toEqual({});
    expect(validarProfissional({ ...COMPLETOS, especialidade: "" })).toEqual({});
  });

  it("exige o nome, mesmo que só tenha espaços, e respeita o limite", () => {
    expect(validarProfissional({ ...COMPLETOS, nome: "  " }).nome).toBeTruthy();
    expect(validarProfissional({ ...COMPLETOS, nome: "a".repeat(LIMITES_DO_PROFISSIONAL.nome + 1) }).nome).toBeTruthy();
  });

  it("aceita o CRO digitado solto e recusa o que não é um registro", () => {
    expect(validarProfissional({ ...COMPLETOS, cro: "cro sp 123" })).toEqual({});
    for (const cro of ["CRO-XX 123", "12345", "CRO-SP", "CRO-SP 1234567"]) {
      expect(validarProfissional({ ...COMPLETOS, cro }).cro, cro).toBeTruthy();
    }
    expect(validarProfissional({ ...COMPLETOS, cro: " " }).cro).toBe("Informe o registro no CRO.");
  });

  it("só aceita cor da lista e especialidade dentro do limite", () => {
    expect(validarProfissional({ ...COMPLETOS, cor: "#000000" }).cor).toBeTruthy();
    expect(validarProfissional({ ...COMPLETOS, cor: "" }).cor).toBeTruthy();
    expect(validarProfissional({ ...COMPLETOS, especialidade: "a".repeat(LIMITES_DO_PROFISSIONAL.especialidade + 1) }).especialidade).toBeTruthy();
  });
});

describe("salvarProfissional", () => {
  it("cria um profissional novo com id próprio, CRO no formato e o vazio como ausente", () => {
    const erros = salvarProfissional({ ...COMPLETOS, nome: "  Dra. Nova  ", cro: "cro sp 123", especialidade: " " });

    expect(erros).toEqual({});
    expect(profissionais.listar()).toHaveLength(2);
    const nova = profissionais.listar().find((p) => p.nome === "Dra. Nova")!;
    expect(nova).toMatchObject({ cro: "CRO-SP 123", cor: "#4a6fa5", ativo: true });
    expect(nova.id).toBeTruthy();
    expect(nova.id).not.toBe(EXISTENTE.id);
    expect(nova.especialidade).toBeUndefined();
  });

  it("edita pelo id, sem duplicar, e guarda a desativação", () => {
    const erros = salvarProfissional({ ...camposDoProfissional(EXISTENTE), nome: "Dr. Renomeado", ativo: false }, EXISTENTE.id);

    expect(erros).toEqual({});
    expect(profissionais.listar()).toHaveLength(1);
    expect(profissionais.obter("p1")).toMatchObject({ nome: "Dr. Renomeado", cro: "CRO-SP 00001", cor: "#1f6f5b", ativo: false });
  });

  it("com erro, devolve as mensagens e não grava nada", () => {
    const erros = salvarProfissional({ ...COMPLETOS, cro: "12345", cor: "vermelho" }, EXISTENTE.id);

    expect(Object.keys(erros).sort()).toEqual(["cor", "cro"]);
    expect(profissionais.listar()).toEqual([EXISTENTE]);
  });
});

describe("camposDoProfissional", () => {
  it("novo começa ativo e com a primeira cor; o dado antigo sem o campo conta como ativo", () => {
    expect(camposDoProfissional()).toEqual({ nome: "", cro: "", especialidade: "", cor: CORES_DA_AGENDA[0].valor, ativo: true });
    expect(camposDoProfissional(EXISTENTE)).toMatchObject({ nome: "Dr. Exemplo", ativo: true });
    expect(camposDoProfissional({ ...EXISTENTE, ativo: false }).ativo).toBe(false);
  });
});
