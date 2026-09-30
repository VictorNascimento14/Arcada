import { describe, expect, it } from "vitest";

import { NAVEGACAO } from "@/modulos";

describe("módulo tratamentos", () => {
  it("registra a aba da ficha do paciente e a rota do plano", () => {
    expect(NAVEGACAO.abasPaciente.find((a) => a.chave === "tratamentos")).toMatchObject({ ordem: 40, rotulo: "Tratamentos" });
    expect(NAVEGACAO.rotas.some((r) => r.path === "/planos/:planoId")).toBe(true);
  });
});
