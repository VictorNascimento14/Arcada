import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cadeiras, clinica, CLINICA_ID, consultas, pacientes, profissionais } from "@/dados/colecoes";
import { semeadorDoNucleo } from "@/dados/sementes";
import { CATALOGO } from "../procedimentos/catalogo";
import { conflitosDaConsulta } from "./conflitos";
import { horariosLivres } from "./horarios";
import { semeador } from "./sementes";

const TODAS = [clinica, profissionais, cadeiras, pacientes, consultas];

/** Semeia como o app: o núcleo primeiro, depois a agenda, com o relógio no meio-dia de `hoje`. */
function semearEm(hoje: string) {
  const [a, m, d] = hoje.split("-").map(Number);
  vi.setSystemTime(new Date(a, m - 1, d, 12));
  semeadorDoNucleo.semear();
  semeador.semear();
}

const dias = () => consultas.listar().map((c) => c.inicio.slice(0, 10));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  for (const c of TODAS) c.substituirTudo([]);
});

afterEach(() => {
  vi.useRealTimers();
  for (const c of TODAS) c.substituirTudo([]);
});

describe("sementes da agenda", () => {
  // hoje → segunda-feira da semana semeada (sábado e domingo olham para a semana que vem)
  it.each([
    ["2026-09-28", "2026-09-28"], // segunda
    ["2026-09-30", "2026-09-28"], // quarta
    ["2026-10-02", "2026-09-28"], // sexta
    ["2026-10-03", "2026-10-05"], // sábado
    ["2026-10-04", "2026-10-05"], // domingo
  ])("hoje é %s: dez consultas de segunda a sexta a partir de %s", (hoje, segunda) => {
    semearEm(hoje);

    expect(consultas.listar()).toHaveLength(10);
    const primeira = new Date(`${segunda}T12:00`);
    for (const dia of dias()) {
      const desde = Math.round((new Date(`${dia}T12:00`).getTime() - primeira.getTime()) / 86_400_000);
      expect(desde).toBeGreaterThanOrEqual(0);
      expect(desde).toBeLessThanOrEqual(4);
    }
  });

  it("usa só pacientes, profissionais e cadeiras que o núcleo semeia", () => {
    semearEm("2026-09-30");

    for (const c of consultas.listar()) {
      expect(pacientes.obter(c.pacienteId), c.id).toBeDefined();
      expect(profissionais.obter(c.profissionalId), c.id).toBeDefined();
      expect(cadeiras.obter(c.cadeiraId), c.id).toBeDefined();
    }
  });

  it("cada consulta traz um procedimento do catálogo padrão, e o horário é a duração dele em passos de 15 minutos", () => {
    semearEm("2026-09-30");

    for (const c of consultas.listar()) {
      const p = CATALOGO.find((x) => x.id === c.procedimentoId);
      expect(p, c.id).toBeDefined();
      expect(c.duracaoMin, c.id).toBe(Math.ceil(p!.duracaoMin / 15) * 15);
    }
  });

  it("nenhuma consulta disputa cadeira ou profissional com outra, e todas cabem no expediente", () => {
    semearEm("2026-09-30");
    const todas = consultas.listar();
    const { expediente } = clinica.obter(CLINICA_ID)!;

    for (const c of todas) {
      expect(conflitosDaConsulta(c, todas), c.id).toEqual([]);
      expect(horariosLivres(expediente, c.inicio.slice(0, 10), [], c.duracaoMin), c.id).toContain(c.inicio.slice(11));
    }
  });

  it("o que já passou está concluído e o que vem por aí segue agendado ou confirmado", () => {
    semearEm("2026-09-30"); // quarta

    for (const c of consultas.listar()) {
      const dia = c.inicio.slice(0, 10);
      if (dia < "2026-09-30") expect(c.situacao, c.id).toBe("concluida");
      else expect(["agendada", "confirmada"], c.id).toContain(c.situacao);
    }
  });

  it("pula o dia que é feriado, porque a agenda não marca nele", () => {
    semearEm("2026-09-07"); // segunda, Independência do Brasil

    expect(consultas.listar()).toHaveLength(8);
    expect(dias()).not.toContain("2026-09-07");
  });

  it("não mexe numa agenda que já tem consulta", () => {
    semeadorDoNucleo.semear();
    const minha = { id: "minha", pacienteId: "pac-ana", profissionalId: "prof-exemplo", cadeiraId: "cadeira-1", inicio: "2026-11-03T09:00", duracaoMin: 30, situacao: "agendada" as const };
    consultas.substituirTudo([minha]);

    semeador.semear();

    expect(consultas.listar()).toEqual([minha]);
  });
});
