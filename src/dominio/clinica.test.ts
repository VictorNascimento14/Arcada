import { describe, expect, it } from "vitest";

import { profissionalAtivo } from "./clinica";

describe("profissionalAtivo", () => {
  it("sem o campo conta como ativo; só false desativa", () => {
    expect(profissionalAtivo({})).toBe(true);
    expect(profissionalAtivo({ ativo: true })).toBe(true);
    expect(profissionalAtivo({ ativo: false })).toBe(false);
  });
});
