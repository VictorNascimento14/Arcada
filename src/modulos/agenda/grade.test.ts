import { describe, expect, it } from "vitest";

import type { FaixaHoraria } from "@/dominio";
import { montarGrade } from "./grade";

const MANHA: FaixaHoraria = { inicio: "08:00", fim: "12:00" };
const TARDE: FaixaHoraria = { inicio: "13:30", fim: "18:00" };
const consulta = (inicio: string, duracaoMin: number) => ({ inicio, duracaoMin });

describe("montarGrade", () => {
  it("cobre o expediente em horas cheias e deixa o almoço como trecho fechado", () => {
    const g = montarGrade([MANHA, TARDE], [])!;

    expect([g.de, g.ate]).toEqual([480, 1080]);
    expect(g.horas.map((h) => h.rotulo)).toEqual([
      "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
    ]);
    expect(g.fechados).toEqual([{ de: 720, ate: 810 }]);
  });

  it("arredonda a abertura para baixo e o fechamento para cima, fechando as pontas", () => {
    const g = montarGrade([{ inicio: "08:30", fim: "17:45" }], [])!;

    expect([g.de, g.ate]).toEqual([480, 1080]);
    expect(g.fechados).toEqual([{ de: 480, ate: 510 }, { de: 1065, ate: 1080 }]);
  });

  it("aceita as faixas fora de ordem", () => {
    expect(montarGrade([TARDE, MANHA], [])).toEqual(montarGrade([MANHA, TARDE], []));
  });

  it("dia fechado e sem consulta não tem grade", () => {
    expect(montarGrade([], [])).toBeNull();
  });

  it("cresce para a consulta que cai fora do expediente", () => {
    const g = montarGrade([MANHA], [consulta("2026-09-30T07:30", 45), consulta("2026-09-30T12:30", 45)])!;

    expect([g.de, g.ate]).toEqual([420, 840]);
    expect(g.fechados).toEqual([{ de: 420, ate: 480 }, { de: 720, ate: 840 }]);
  });

  it("no dia fechado com consulta, a janela é a da consulta e ela toda é trecho fechado", () => {
    const g = montarGrade([], [consulta("2026-10-04T10:15", 30)])!;

    expect([g.de, g.ate]).toEqual([600, 660]);
    expect(g.fechados).toEqual([{ de: 600, ate: 660 }]);
  });

  it("consulta dentro do expediente não muda a janela", () => {
    expect(montarGrade([MANHA, TARDE], [consulta("2026-09-30T09:00", 60)])).toEqual(montarGrade([MANHA, TARDE], []));
  });

  it("para na meia-noite", () => {
    const g = montarGrade([], [consulta("2026-09-30T23:30", 90)])!;

    expect(g.ate).toBe(1440);
    expect(g.horas.map((h) => h.rotulo)).toEqual(["23:00", "24:00"]);
  });
});
