import { beforeEach, describe, expect, it } from "vitest";

import { procedimentos } from "@/dados/colecoes";
import { SEMEADORES } from "@/dados/semeadores";
import { carregarSementes } from "@/dados/sementes";
import type { Procedimento } from "@/dominio";

import { CATALOGO } from "./catalogo";
import { semeador } from "./sementes";

beforeEach(() => {
  localStorage.clear();
  procedimentos.substituirTudo([]);
});

describe("semente do catálogo de procedimentos", () => {
  it("planta o catálogo padrão na primeira carga", () => {
    carregarSementes([semeador]);
    expect(procedimentos.listar()).toEqual(CATALOGO);
  });

  it("não sobrescreve os procedimentos que a clínica já tem", () => {
    const meu: Procedimento = {
      id: "meu",
      nome: "Procedimento Exemplo",
      especialidade: "Prevenção",
      preco: 10000,
      duracaoMin: 30,
      exigeDente: false,
      exigeFace: false,
      ativo: true,
    };
    procedimentos.substituirTudo([meu]);
    carregarSementes([semeador]);
    expect(procedimentos.listar()).toEqual([meu]);
  });

  it("é achada pelo registro de semeadores do app", () => {
    expect(SEMEADORES).toContain(semeador);
  });
});
