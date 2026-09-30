import { describe, expect, it } from "vitest";

import type { Consulta, Expediente, FaixaHoraria, SituacaoConsulta } from "@/dominio";

import { horariosLivres } from "./horarios";

// 05/10/2026 é segunda-feira; 04/10, domingo; 10/10, sábado.
const SEGUNDA = "2026-10-05";

const faixa = (inicio: string, fim: string): FaixaHoraria => ({ inicio, fim });

/** Uma clínica que só abre na segunda-feira, nas faixas dadas. */
const soNaSegunda = (...faixas: FaixaHoraria[]): Expediente => ({ 0: [], 1: faixas, 2: [], 3: [], 4: [], 5: [], 6: [] });

const consulta = (inicio: string, duracaoMin: number, situacao: SituacaoConsulta = "agendada"): Consulta => ({
  id: "c1",
  pacienteId: "p1",
  profissionalId: "prof1",
  cadeiraId: "cad1",
  inicio,
  duracaoMin,
  situacao,
});

describe("horariosLivres", () => {
  it("lista os inícios de 15 em 15 minutos, até a consulta terminar junto com a faixa", () => {
    const expediente = soNaSegunda(faixa("08:00", "09:00"));
    expect(horariosLivres(expediente, SEGUNDA, [], 30)).toEqual(["08:00", "08:15", "08:30"]);
  });

  it("conta os passos a partir da abertura de cada faixa", () => {
    const expediente = soNaSegunda(faixa("08:30", "09:30"), faixa("14:10", "15:00"));
    expect(horariosLivres(expediente, SEGUNDA, [], 30)).toEqual(["08:30", "08:45", "09:00", "14:10", "14:25"]);
  });

  it("não sugere nem atravessa o intervalo entre duas faixas", () => {
    const expediente = soNaSegunda(faixa("08:00", "09:00"), faixa("10:00", "11:00"));
    expect(horariosLivres(expediente, SEGUNDA, [], 30)).toEqual(["08:00", "08:15", "08:30", "10:00", "10:15", "10:30"]);
  });

  it("devolve em ordem mesmo com as faixas fora de ordem", () => {
    const expediente = soNaSegunda(faixa("10:00", "10:30"), faixa("08:00", "08:30"));
    expect(horariosLivres(expediente, SEGUNDA, [], 30)).toEqual(["08:00", "10:00"]);
  });

  it("usa a faixa do dia da semana da data, de domingo a sábado", () => {
    const semana: Expediente = {
      0: [faixa("07:00", "07:30")],
      1: [faixa("08:00", "08:30")],
      2: [faixa("09:00", "09:30")],
      3: [faixa("10:00", "10:30")],
      4: [faixa("11:00", "11:30")],
      5: [faixa("12:00", "12:30")],
      6: [faixa("13:00", "13:30")],
    };
    const dias = ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10"];
    expect(dias.map((dia) => horariosLivres(semana, dia, [], 30))).toEqual([
      ["07:00"],
      ["08:00"],
      ["09:00"],
      ["10:00"],
      ["11:00"],
      ["12:00"],
      ["13:00"],
    ]);
  });

  it("dia fechado (sem faixa) fica sem horário", () => {
    expect(horariosLivres(soNaSegunda(faixa("08:00", "09:00")), "2026-10-04", [], 30)).toEqual([]);
  });

  it("tira os inícios que sobreporiam uma consulta marcada; encostar não tira", () => {
    const expediente = soNaSegunda(faixa("08:00", "10:00"));
    // A consulta de 08:30 às 09:00 deixa livre só o que termina antes dela ou começa depois.
    expect(horariosLivres(expediente, SEGUNDA, [consulta("2026-10-05T08:30", 30)], 30)).toEqual([
      "08:00",
      "09:00",
      "09:15",
      "09:30",
    ]);
  });

  it.each<[SituacaoConsulta, boolean]>([
    ["agendada", true],
    ["confirmada", true],
    ["em-atendimento", true],
    ["concluida", true],
    ["faltou", true],
    ["cancelada", false],
  ])("consulta %s ocupa o horário: %s", (situacao, ocupa) => {
    const expediente = soNaSegunda(faixa("08:00", "09:00"));
    const livres = horariosLivres(expediente, SEGUNDA, [consulta("2026-10-05T08:00", 60, situacao)], 30);
    expect(livres).toEqual(ocupa ? [] : ["08:00", "08:15", "08:30"]);
  });

  it("ignora as consultas de outros dias", () => {
    const expediente = soNaSegunda(faixa("08:00", "09:00"));
    const outrosDias = [consulta("2026-10-12T08:00", 60), consulta("2026-10-04T08:00", 60)];
    expect(horariosLivres(expediente, SEGUNDA, outrosDias, 30)).toEqual(["08:00", "08:15", "08:30"]);
  });

  it("consulta mais longa que a faixa não tem horário", () => {
    expect(horariosLivres(soNaSegunda(faixa("08:00", "09:00")), SEGUNDA, [], 90)).toEqual([]);
  });

  it("duração que não é positiva e dia mal formado não têm horário", () => {
    const expediente = soNaSegunda(faixa("08:00", "09:00"));
    for (const duracao of [0, -30, NaN]) expect(horariosLivres(expediente, SEGUNDA, [], duracao)).toEqual([]);
    for (const dia of ["", "2026-10", "05/10/2026"]) expect(horariosLivres(expediente, dia, [], 30)).toEqual([]);
  });
});
