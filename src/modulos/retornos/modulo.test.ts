import { describe, expect, it } from "vitest";

import { NAVEGACAO } from "@/modulos";

import { modulo } from "./modulo";

describe("módulo retornos", () => {
  it("registra a rota /retornos e o item Retornos no grupo Consultório, ordem 30, ícone refresh, sem aba na ficha", () => {
    expect(modulo.rotas.map((r) => r.path)).toEqual(["/retornos"]);
    expect(modulo.coluna).toEqual({ grupo: "consultorio", ordem: 30, rotulo: "Retornos", icone: "refresh", caminho: "/retornos" });
    expect(modulo.abaPaciente).toBeUndefined();

    const consultorio = NAVEGACAO.grupos.find((g) => g.chave === "consultorio");
    expect(consultorio?.itens.find((i) => i.key === "retornos")).toMatchObject({ label: "Retornos", path: "/retornos", icon: "refresh" });
  });
});
