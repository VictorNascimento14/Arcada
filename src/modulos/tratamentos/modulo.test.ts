import { describe, expect, it } from "vitest";

import { NAVEGACAO } from "@/modulos";

describe("módulo tratamentos", () => {
  it("registra a aba da ficha do paciente e as rotas da lista e do plano", () => {
    expect(NAVEGACAO.abasPaciente.find((a) => a.chave === "tratamentos")).toMatchObject({ ordem: 40, rotulo: "Tratamentos" });
    const caminhos = NAVEGACAO.rotas.map((r) => r.path);
    expect(caminhos).toContain("/tratamentos");
    expect(caminhos).toContain("/planos/:planoId");
  });

  it("põe o item Tratamentos na coluna, no grupo Gestão", () => {
    const gestao = NAVEGACAO.grupos.find((g) => g.chave === "gestao");
    expect(gestao?.itens.find((i) => i.key === "tratamentos")).toMatchObject({ label: "Tratamentos", path: "/tratamentos", icon: "receipt" });
  });
});
