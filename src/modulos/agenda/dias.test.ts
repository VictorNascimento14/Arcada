import { describe, expect, it } from "vitest";

import type { Consulta } from "@/dominio";

import { diasComConsulta, diasDaSemana, inicioDaSemana, rotuloDaSemana, rotuloDoDia, somarDias } from "./dias";

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

describe("diasComConsulta", () => {
  const consulta = (id: string, inicio: string, situacao: Consulta["situacao"] = "agendada"): Consulta => ({
    id, pacienteId: "a1", profissionalId: "p1", cadeiraId: "c1", inicio, duracaoMin: 30, situacao,
  });

  it("lista cada dia uma vez só, em ordem", () => {
    const dias = diasComConsulta([
      consulta("1", "2026-10-01T09:00"),
      consulta("2", "2026-09-15T14:00"),
      consulta("3", "2026-10-01T15:30"),
    ]);

    expect(dias).toEqual(["2026-09-15", "2026-10-01"]);
  });

  it("a cancelada não conta, a menos que o dia tenha outra consulta", () => {
    const dias = diasComConsulta([
      consulta("1", "2026-09-16T09:00", "cancelada"),
      consulta("2", "2026-09-17T09:00", "cancelada"),
      consulta("3", "2026-09-17T10:00", "faltou"),
    ]);

    expect(dias).toEqual(["2026-09-17"]); // a que faltou continua na grade
  });

  it("sem consulta, nenhum dia", () => {
    expect(diasComConsulta([])).toEqual([]);
  });
});

describe("a semana", () => {
  it("vai de segunda a domingo: o domingo fecha a semana e a segunda seguinte abre a próxima", () => {
    expect(inicioDaSemana("2026-09-30")).toBe("2026-09-28"); // quarta
    expect(inicioDaSemana("2026-09-28")).toBe("2026-09-28"); // a própria segunda
    expect(inicioDaSemana("2026-10-04")).toBe("2026-09-28"); // domingo
    expect(inicioDaSemana("2026-10-05")).toBe("2026-10-05");
  });

  it("são sete dias seguidos, também na virada de mês e de ano", () => {
    expect(diasDaSemana("2026-09-30")).toEqual([
      "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04",
    ]);
    expect(diasDaSemana("2027-01-01")[0]).toBe("2026-12-28");
    expect(diasDaSemana("2027-01-01")[6]).toBe("2027-01-03");
  });

  it("o título traz o intervalo, com o mês e o ano só onde mudam", () => {
    expect(rotuloDaSemana("2026-10-07")).toBe("5 a 11 de outubro de 2026");
    expect(rotuloDaSemana("2026-09-30")).toBe("28 de setembro a 4 de outubro de 2026");
    expect(rotuloDaSemana("2027-01-01")).toBe("28 de dezembro de 2026 a 3 de janeiro de 2027");
  });
});
