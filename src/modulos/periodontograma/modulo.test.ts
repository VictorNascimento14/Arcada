import { describe, expect, it } from "vitest";

import { montarNavegacao } from "../navegacao";
import { modulo } from "./modulo";

describe("módulo periodontograma", () => {
  it("entra só como aba da ficha do paciente, de rótulo Periodonto: sem rota nem item na coluna", () => {
    const nav = montarNavegacao([modulo]);

    expect(modulo.rotas).toEqual([]);
    expect(modulo.coluna).toBeUndefined();
    expect(nav.abasPaciente).toMatchObject([{ chave: "periodontograma", ordem: 30, rotulo: "Periodonto" }]);
  });
});
