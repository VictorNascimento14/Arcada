import { beforeEach, describe, expect, it } from "vitest";

import { cadeiras } from "@/dados/colecoes";
import type { Cadeira } from "@/dominio";

import { camposDaCadeira, LIMITE_DO_NOME_DA_CADEIRA, salvarCadeira, validarCadeira } from "./cadeiras";

const EXISTENTE: Cadeira = { id: "c1", nome: "Cadeira 1" };

beforeEach(() => {
  localStorage.clear();
  cadeiras.substituirTudo([EXISTENTE]);
});

describe("validarCadeira", () => {
  it("aceita um nome, e o tamanho máximo, e recusa um caractere a mais", () => {
    expect(validarCadeira({ nome: "Cadeira 3", ativa: true })).toEqual({});
    expect(validarCadeira({ nome: "a".repeat(LIMITE_DO_NOME_DA_CADEIRA), ativa: true })).toEqual({});
    expect(validarCadeira({ nome: "a".repeat(LIMITE_DO_NOME_DA_CADEIRA + 1), ativa: true }).nome).toBeTruthy();
  });

  it("exige o nome, mesmo que só tenha espaços", () => {
    expect(validarCadeira({ nome: "", ativa: true }).nome).toBe("Informe o nome da cadeira.");
    expect(validarCadeira({ nome: "   ", ativa: true }).nome).toBeTruthy();
  });
});

describe("salvarCadeira", () => {
  it("cria uma cadeira nova com id próprio e o nome aparado", () => {
    expect(salvarCadeira({ nome: "  Sala 2  ", ativa: true })).toEqual({});

    expect(cadeiras.listar()).toHaveLength(2);
    const nova = cadeiras.listar().find((c) => c.nome === "Sala 2")!;
    expect(nova.ativa).toBe(true);
    expect(nova.id).toBeTruthy();
    expect(nova.id).not.toBe(EXISTENTE.id);
  });

  it("edita pelo id, sem duplicar, e guarda a desativação", () => {
    expect(salvarCadeira({ nome: "Cadeira 1 (reserva)", ativa: false }, "c1")).toEqual({});

    expect(cadeiras.listar()).toHaveLength(1);
    expect(cadeiras.obter("c1")).toEqual({ id: "c1", nome: "Cadeira 1 (reserva)", ativa: false });
  });

  it("sem nome, devolve o erro e não grava nada", () => {
    expect(salvarCadeira({ nome: " ", ativa: false }, "c1").nome).toBeTruthy();
    expect(cadeiras.listar()).toEqual([EXISTENTE]);
  });
});

describe("camposDaCadeira", () => {
  it("nova começa ativa; o dado antigo sem o campo conta como ativo", () => {
    expect(camposDaCadeira()).toEqual({ nome: "", ativa: true });
    expect(camposDaCadeira(EXISTENTE)).toEqual({ nome: "Cadeira 1", ativa: true });
    expect(camposDaCadeira({ ...EXISTENTE, ativa: false }).ativa).toBe(false);
  });
});
