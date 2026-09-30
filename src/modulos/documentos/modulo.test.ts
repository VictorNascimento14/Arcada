import { describe, expect, it } from "vitest";

import { NAVEGACAO } from "@/modulos";

import { modulo } from "./modulo";

describe("módulo documentos", () => {
  it("registra a rota /documentos e o item Documentos no grupo Gestão, ordem 30, ícone file, sem aba na ficha", () => {
    expect(modulo.rotas.map((r) => r.path)).toEqual(["/documentos"]);
    expect(modulo.coluna).toEqual({ grupo: "gestao", ordem: 30, rotulo: "Documentos", icone: "file", caminho: "/documentos" });
    expect(modulo.abaPaciente).toBeUndefined();

    const gestao = NAVEGACAO.grupos.find((g) => g.chave === "gestao");
    expect(gestao?.itens.find((i) => i.key === "documentos")).toMatchObject({ label: "Documentos", path: "/documentos", icon: "file" });
  });
});
