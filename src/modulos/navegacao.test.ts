import { describe, expect, it } from "vitest";

import { montarNavegacao } from "./navegacao";
import type { Modulo } from "./tipos";

const Vazio = () => null;

function modulo(chave: string, coluna?: Partial<NonNullable<Modulo["coluna"]>>, aba?: number): Modulo {
  return {
    chave,
    rotas: [{ path: `/${chave}`, Component: Vazio }],
    coluna: coluna && { grupo: "consultorio", ordem: 0, rotulo: chave, icone: "grid", caminho: `/${chave}`, ...coluna },
    abaPaciente: aba === undefined ? undefined : { ordem: aba, rotulo: chave, Componente: Vazio },
  };
}

describe("montarNavegacao", () => {
  it("ordena os itens por ordem e desempata pela chave", () => {
    const { grupos } = montarNavegacao([modulo("b", { ordem: 1 }), modulo("c", { ordem: 0 }), modulo("a", { ordem: 1 })]);
    expect(grupos[0].itens.map((i) => i.key)).toEqual(["c", "a", "b"]);
  });

  it("separa os grupos na ordem fixa e omite grupo vazio", () => {
    const { grupos } = montarNavegacao([modulo("fin", { grupo: "gestao" }), modulo("ag", { grupo: "consultorio" })]);
    expect(grupos.map((g) => g.chave)).toEqual(["consultorio", "gestao"]);
  });

  it("junta as rotas de todos os módulos, com ou sem item na coluna", () => {
    const { rotas } = montarNavegacao([modulo("a", {}), modulo("so-rota")]);
    expect(rotas.map((r) => r.path)).toEqual(["/a", "/so-rota"]);
  });

  it("lista a barra do celular e as abas do paciente em ordem", () => {
    const nav = montarNavegacao([
      modulo("agenda", { ordem: 2, barraCelular: true }),
      modulo("painel", { ordem: 1, barraCelular: true }),
      modulo("odonto", undefined, 2),
      modulo("anamnese", undefined, 1),
    ]);
    expect(nav.barraCelular).toEqual(["painel", "agenda"]);
    expect(nav.abasPaciente.map((a) => a.chave)).toEqual(["anamnese", "odonto"]);
  });
});
