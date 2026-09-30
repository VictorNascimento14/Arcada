import { describe, expect, it } from "vitest";

import { ROTULO_SITUACAO_DA_PARCELA, situacaoDaParcela } from "./situacao";

describe("situação da parcela", () => {
  it.each([
    ["2026-10-14", "vencida"],
    ["2026-10-15", "vence-hoje"],
    ["2026-10-16", "a-vencer"],
    ["2026-09-30", "vencida"], // mês anterior
    ["2025-12-31", "vencida"], // ano anterior
    ["2027-01-01", "a-vencer"], // ano seguinte
  ])("parcela em aberto com vencimento em %s, vista em 2026-10-15, é %s", (vencimento, esperada) => {
    expect(situacaoDaParcela({ vencimento }, "2026-10-15")).toBe(esperada);
  });

  it("vence hoje ainda não é atraso: vira vencida no dia seguinte", () => {
    expect(situacaoDaParcela({ vencimento: "2026-10-31" }, "2026-10-31")).toBe("vence-hoje");
    expect(situacaoDaParcela({ vencimento: "2026-10-31" }, "2026-11-01")).toBe("vencida");
  });

  it("com baixa está paga, seja adiantada, no dia ou depois de vencida", () => {
    for (const vencimento of ["2026-09-01", "2026-10-15", "2026-11-01"]) {
      expect(situacaoDaParcela({ vencimento, pagoEm: "2026-10-15" }, "2026-10-15")).toBe("paga");
    }
  });

  it("tem um rótulo para cada situação", () => {
    expect(Object.values(ROTULO_SITUACAO_DA_PARCELA)).toEqual(["A vencer", "Vence hoje", "Vencida", "Paga"]);
  });
});
