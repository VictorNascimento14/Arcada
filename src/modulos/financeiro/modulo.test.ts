import { describe, expect, it } from "vitest";

import { NAVEGACAO } from "@/modulos";

describe("módulo financeiro", () => {
  it("registra a rota /financeiro e a aba da ficha do paciente", () => {
    expect(NAVEGACAO.rotas.map((r) => r.path)).toContain("/financeiro");
    expect(NAVEGACAO.abasPaciente.find((a) => a.chave === "financeiro")).toMatchObject({ ordem: 50, rotulo: "Financeiro" });
  });

  it("põe o item Financeiro na coluna, no grupo Gestão, e na barra do celular", () => {
    const gestao = NAVEGACAO.grupos.find((g) => g.chave === "gestao");
    expect(gestao?.itens.find((i) => i.key === "financeiro")).toMatchObject({ label: "Financeiro", path: "/financeiro", icon: "coin" });
    expect(NAVEGACAO.barraCelular).toContain("financeiro");
  });
});
