import { describe, expect, it } from "vitest";

import type { Consulta } from "@/dominio";

import { consultasAPartirDe, faixaDeHoras } from "./consultas";

const consulta = (id: string, pacienteId: string, inicio: string, duracaoMin = 30): Consulta => ({
  id,
  pacienteId,
  profissionalId: "pr1",
  cadeiraId: "cad1",
  inicio,
  duracaoMin,
  situacao: "agendada",
});

describe("consultasAPartirDe", () => {
  const todas = [
    consulta("a", "p1", "2026-10-02T09:00"),
    consulta("b", "p2", "2026-10-01T09:00"),
    consulta("c", "p1", "2026-09-29T17:00"),
    consulta("d", "p1", "2026-09-30T08:30"),
    consulta("e", "p1", "2026-10-01T14:00"),
  ];

  it("devolve só as do paciente, de hoje em diante, na ordem do horário", () => {
    expect(consultasAPartirDe(todas, "p1", "2026-09-30").map((c) => c.id)).toEqual(["d", "e", "a"]);
  });

  it("o dia de hoje entra, mesmo que a hora já tenha passado; ontem não", () => {
    const hoje = [consulta("h", "p1", "2026-09-30T00:00"), consulta("o", "p1", "2026-09-29T23:59")];
    expect(consultasAPartirDe(hoje, "p1", "2026-09-30").map((c) => c.id)).toEqual(["h"]);
  });

  it("não reordena a lista recebida", () => {
    const antes = todas.map((c) => c.id);
    consultasAPartirDe(todas, "p1", "2026-09-30");
    expect(todas.map((c) => c.id)).toEqual(antes);
  });
});

describe("faixaDeHoras", () => {
  it("vai do início ao fim, somando a duração", () => {
    expect(faixaDeHoras(consulta("a", "p1", "2026-09-30T08:45", 30))).toBe("08:45–09:15");
    expect(faixaDeHoras(consulta("b", "p1", "2026-09-30T11:30", 90))).toBe("11:30–13:00");
  });
});
