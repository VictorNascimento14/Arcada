import { describe, expect, it } from "vitest";

import { NAVEGACAO } from "@/modulos";

import { modulo } from "./modulo";

describe("módulo odontograma", () => {
  it("registra só a aba da ficha do paciente, na ordem 20", () => {
    expect(NAVEGACAO.abasPaciente.find((a) => a.chave === "odontograma")).toMatchObject({ ordem: 20, rotulo: "Odontograma" });
    expect(modulo.rotas).toEqual([]);
    expect(modulo.coluna).toBeUndefined();
  });
});
