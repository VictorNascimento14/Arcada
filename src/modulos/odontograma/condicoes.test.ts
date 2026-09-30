import { describe, expect, it } from "vitest";

import { CONDICOES } from "./condicoes";

const ids = (escopo: string) => CONDICOES.filter((c) => c.escopo === escopo).map((c) => c.id);

/** Rampas do kit que já trocam sozinhas no tema escuro: não levam variante `dark:`. */
const RAMPAS_DO_KIT = ["red", "foreground"];

describe("CONDICOES", () => {
  it("são nove, cada uma com id, rótulo e cor só sua", () => {
    expect(CONDICOES).toHaveLength(9);
    for (const campo of ["id", "rotulo", "cor"] as const) {
      expect(new Set(CONDICOES.map((c) => c[campo])).size).toBe(9);
    }
  });

  it("cárie, restauração e selante valem por face; as outras seis, no dente inteiro", () => {
    expect(ids("face")).toEqual(["carie", "restauracao", "selante"]);
    expect(ids("dente")).toEqual(["fratura", "extracaoIndicada", "ausente", "tratamentoDeCanal", "coroa", "implante"]);
  });

  it("a cor é classe literal text-*, com a variante dark: das paletas que não são do kit", () => {
    for (const { cor } of CONDICOES) {
      const [claro, escuro, ...resto] = cor.split(" ");
      const rampa = claro.split("-")[1];
      expect(claro).toMatch(/^text-[a-z]+-\d{2,3}$/);
      expect(resto).toEqual([]);
      if (RAMPAS_DO_KIT.includes(rampa)) expect(escuro).toBeUndefined();
      else expect(escuro).toMatch(new RegExp(`^dark:text-${rampa}-\\d{2,3}$`));
    }
  });
});
