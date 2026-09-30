import { describe, expect, it } from "vitest";

import { NAVEGACAO } from "@/modulos";

import { modulo } from "./modulo";

describe("módulo atendimento", () => {
  it("registra a aba Atendimentos na ordem 60 e a rota da consulta, sem item na coluna", () => {
    expect(NAVEGACAO.abasPaciente.find((a) => a.chave === "atendimento")).toMatchObject({ ordem: 60, rotulo: "Atendimentos" });
    expect(modulo.rotas.map((r) => r.path)).toEqual(["/atendimento/:consultaId"]);
    expect(modulo.coluna).toBeUndefined();
  });
});
