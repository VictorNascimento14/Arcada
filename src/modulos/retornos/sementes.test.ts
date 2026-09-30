import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cadeiras, clinica, consultas, pacientes, planos, profissionais } from "@/dados/colecoes";
import { semeadorDoNucleo } from "@/dados/sementes";
import { semeador as semeadorDaAgenda } from "../agenda/sementes";
import { retornosPendentes } from "./lista";
import { semeador } from "./sementes";

const TODAS = [clinica, profissionais, cadeiras, pacientes, consultas, planos];

/** Semeia como o app: o núcleo, depois a agenda e os retornos, com o relógio no meio-dia de `hoje`. */
function semearEm(hoje: string) {
  const [a, m, d] = hoje.split("-").map(Number);
  vi.setSystemTime(new Date(a, m - 1, d, 12));
  semeadorDoNucleo.semear();
  semeadorDaAgenda.semear();
  semeador.semear();
}

const pendentes = (hoje: string) => retornosPendentes(pacientes.listar(), consultas.listar(), planos.listar(), hoje);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  for (const c of TODAS) c.substituirTudo([]);
});
afterEach(() => {
  vi.useRealTimers();
  for (const c of TODAS) c.substituirTudo([]);
});

describe("sementes dos retornos", () => {
  // Qualquer dia da semana e virada de mês: os quatro pacientes não têm consulta na agenda, então o resultado não muda.
  it.each(["2026-09-28", "2026-09-30", "2026-10-02", "2026-10-04", "2026-08-31", "2027-03-31"])(
    "hoje é %s: dois retornos vencidos e dois a vencer, do mais antigo ao mais próximo",
    (hoje) => {
      semearEm(hoje);

      expect(pendentes(hoje).map((r) => [r.paciente.nome, r.situacao])).toEqual([
        ["Rafael Teixeira", "vencido"],
        ["Beatriz Campos", "vencido"],
        ["Otávio Ramos", "a-vencer"],
        ["Sara Nogueira", "a-vencer"],
      ]);
    },
  );

  it("acrescenta quatro pacientes e quatro consultas concluídas às da agenda, todos fictícios", () => {
    semearEm("2026-09-30");

    expect(pacientes.listar()).toHaveLength(12);
    expect(consultas.listar()).toHaveLength(14);
    const novas = consultas.listar().filter((c) => c.id.startsWith("cons-demo-ret-"));
    expect(novas.map((c) => c.situacao)).toEqual(["concluida", "concluida", "concluida", "concluida"]);
    for (const c of novas) expect(pacientes.obter(c.pacienteId), c.id).toBeDefined();
    expect(pacientes.listar().every((p) => p.telefone.startsWith("(00)") && !p.cpf)).toBe(true);
  });

  it("rodar de novo não duplica nada", () => {
    semearEm("2026-09-30");
    semeador.semear();

    expect(pacientes.listar()).toHaveLength(12);
    expect(consultas.listar()).toHaveLength(14);
  });

  it("sem as consultas da agenda não semeia, para não a fazer pular as dela", () => {
    semeadorDoNucleo.semear();
    semeador.semear();

    expect(consultas.listar()).toHaveLength(0);
    expect(pacientes.listar()).toHaveLength(8);
  });
});
