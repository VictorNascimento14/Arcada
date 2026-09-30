import { describe, expect, it } from "vitest";

import { cadeiraAtiva, profissionalAtivo } from "./clinica";

describe("profissionalAtivo", () => {
  it("sem o campo conta como ativo; só false desativa", () => {
    expect(profissionalAtivo({})).toBe(true);
    expect(profissionalAtivo({ ativo: true })).toBe(true);
    expect(profissionalAtivo({ ativo: false })).toBe(false);
  });
});

describe("cadeiraAtiva", () => {
  it("sem o campo conta como ativa; só false desativa", () => {
    expect(cadeiraAtiva({})).toBe(true);
    expect(cadeiraAtiva({ ativa: true })).toBe(true);
    expect(cadeiraAtiva({ ativa: false })).toBe(false);
  });
});
