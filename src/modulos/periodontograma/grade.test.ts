import { describe, expect, it } from "vitest";

import { SITIOS } from "./exame";
import { faixaDoCampo, medidaValida, nomeDoSitio, rotuloDoSitio } from "./grade";

describe("rotuloDoSitio", () => {
  it("na arcada superior o lado de dentro é o palatino: MP, P e DP", () => {
    expect(SITIOS.map((s) => rotuloDoSitio(s, "superior"))).toEqual(["MV", "V", "DV", "MP", "P", "DP"]);
  });

  it("na inferior é o lingual, com os rótulos do modelo", () => {
    expect(SITIOS.map((s) => rotuloDoSitio(s, "inferior"))).toEqual(["MV", "V", "DV", "ML", "L", "DL"]);
  });
});

describe("nomeDoSitio", () => {
  it("escreve o nome por extenso, palatino em cima e lingual embaixo", () => {
    expect(SITIOS.map((s) => nomeDoSitio(s, "superior"))).toEqual([
      "mesiovestibular",
      "vestibular",
      "distovestibular",
      "mesiopalatino",
      "palatino",
      "distopalatino",
    ]);
    expect(SITIOS.map((s) => nomeDoSitio(s, "inferior")).slice(3)).toEqual(["mesiolingual", "lingual", "distolingual"]);
  });
});

describe("medidaValida", () => {
  it("aceita a profundidade inteira de 0 a 15 mm, com os extremos", () => {
    expect([0, 1, 7, 15].every((v) => medidaValida("profundidade", v))).toBe(true);
    expect([-1, 16, 2.5, Number.NaN, Infinity].some((v) => medidaValida("profundidade", v))).toBe(false);
  });

  it("aceita a margem negativa: de −15 a 15 mm", () => {
    expect([-15, -3, 0, 4, 15].every((v) => medidaValida("margem", v))).toBe(true);
    expect([-16, 16, -0.5].some((v) => medidaValida("margem", v))).toBe(false);
  });
});

describe("faixaDoCampo", () => {
  it("escreve o intervalo com o sinal de menos de verdade", () => {
    expect(faixaDoCampo("profundidade")).toBe("0 a 15 mm");
    expect(faixaDoCampo("margem")).toBe("−15 a 15 mm");
  });
});
