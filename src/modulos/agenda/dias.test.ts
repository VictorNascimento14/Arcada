import { describe, expect, it } from "vitest";

import { rotuloDoDia, somarDias } from "./dias";

describe("somarDias", () => {
  it("anda para a frente e para trás dentro do mês", () => {
    expect(somarDias("2026-09-15", 0)).toBe("2026-09-15");
    expect(somarDias("2026-09-15", 1)).toBe("2026-09-16");
    expect(somarDias("2026-09-15", -1)).toBe("2026-09-14");
  });

  it("passa de mês e de ano nos dois sentidos", () => {
    expect(somarDias("2026-09-30", 1)).toBe("2026-10-01");
    expect(somarDias("2026-10-01", -1)).toBe("2026-09-30");
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(somarDias("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("conhece o 29 de fevereiro", () => {
    expect(somarDias("2028-02-28", 1)).toBe("2028-02-29");
    expect(somarDias("2028-02-29", 1)).toBe("2028-03-01");
    expect(somarDias("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("soma várias semanas de uma vez", () => {
    expect(somarDias("2026-09-30", 7)).toBe("2026-10-07");
    expect(somarDias("2026-09-30", -30)).toBe("2026-08-31");
  });
});

describe("rotuloDoDia", () => {
  it("escreve o dia da semana, o dia, o mês e o ano por extenso", () => {
    expect(rotuloDoDia("2026-09-30")).toBe("quarta-feira, 30 de setembro de 2026");
  });

  it("não põe zero à esquerda no dia do mês", () => {
    expect(rotuloDoDia("2026-01-01")).toBe("quinta-feira, 1 de janeiro de 2026");
  });
});
