import { describe, expect, it } from "vitest";

import type { Lancamento, Paciente } from "@/dominio";

import { diasDeAtrasoDaParcela, inadimplentes } from "./inadimplencia";

const HOJE = "2026-10-15";
const paciente = (id: string, nome: string): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "" });
const PACIENTES = [paciente("ana", "Ana Exemplo"), paciente("bruno", "Bruno Exemplo"), paciente("carla", "Carla Exemplo")];
const parcela = (id: string, pacienteId: string, valor: number, vencimento: string, extra: Partial<Lancamento> = {}): Lancamento => ({
  id,
  pacienteId,
  planoId: "pl1",
  valor,
  vencimento,
  ...extra,
});
const PAGA = { pagoEm: "2026-10-01", forma: "pix" } as const;

describe("dias de atraso da parcela", () => {
  it.each([
    ["2026-10-10", "2026-10-15", 5],
    ["2026-09-30", "2026-10-01", 1], // virada de mês
    ["2025-12-31", "2026-01-01", 1], // virada de ano
    ["2028-02-28", "2028-03-01", 2], // 2028 é bissexto: 28, 29 e 1º
    ["2027-02-28", "2027-03-01", 1], // 2027 não é
    ["2026-01-01", "2026-10-15", 287],
  ])("parcela em aberto de %s, vista em %s, está %i dias atrasada", (vencimento, hoje, dias) => {
    expect(diasDeAtrasoDaParcela({ vencimento }, hoje)).toBe(dias);
  });

  it("não há atraso na que vence hoje, na a vencer nem na paga, mesmo depois de vencida", () => {
    expect(diasDeAtrasoDaParcela({ vencimento: HOJE }, HOJE)).toBe(0);
    expect(diasDeAtrasoDaParcela({ vencimento: "2026-10-20" }, HOJE)).toBe(0);
    expect(diasDeAtrasoDaParcela({ vencimento: "2026-09-01", pagoEm: "2026-10-01" }, HOJE)).toBe(0);
  });
});

describe("inadimplentes", () => {
  it("soma o que cada paciente tem vencido e conta os dias da parcela mais antiga", () => {
    const [ana] = inadimplentes(
      [parcela("a1", "ana", 3_000, "2026-09-15"), parcela("a2", "ana", 2_000, "2026-10-10"), parcela("a3", "ana", 9_000, "2026-11-15")],
      PACIENTES,
      HOJE,
    );
    expect(ana).toMatchObject({ pacienteId: "ana", parcelas: 2, totalVencido: 5_000, diasDeAtraso: 30 });
    expect(ana.paciente?.nome).toBe("Ana Exemplo");
  });

  it("só conta a parcela em aberto vencida: paga, que vence hoje e a vencer ficam de fora, e quem não tem vencida não entra", () => {
    const lista = inadimplentes(
      [
        parcela("paga", "ana", 8_000, "2026-08-01", PAGA),
        parcela("hoje", "bruno", 4_000, HOJE),
        parcela("futura", "carla", 6_000, "2026-11-01"),
        parcela("vencida", "carla", 1_500, "2026-10-14"),
      ],
      PACIENTES,
      HOJE,
    );
    expect(lista.map((i) => [i.pacienteId, i.parcelas, i.totalVencido, i.diasDeAtraso])).toEqual([["carla", 1, 1_500, 1]]);
  });

  it("ordena do atraso mais antigo ao mais recente; no empate, o maior total e, depois, o nome", () => {
    const lista = inadimplentes(
      [
        parcela("c", "carla", 1_000, "2026-10-01"),
        parcela("b", "bruno", 5_000, "2026-10-01"),
        parcela("a", "ana", 5_000, "2026-10-01"),
        parcela("z", "ana", 100, "2026-10-14"),
        parcela("d", "dora", 999, "2026-09-01"),
      ],
      [...PACIENTES, paciente("dora", "Dora Exemplo")],
      HOJE,
    );
    expect(lista.map((i) => i.pacienteId)).toEqual(["dora", "ana", "bruno", "carla"]);
  });

  it("paciente que não existe entra sem `paciente`; sem parcelas, a lista é vazia", () => {
    const [sumiu] = inadimplentes([parcela("s", "sumiu", 1_000, "2026-10-01")], PACIENTES, HOJE);
    expect(sumiu.paciente).toBeUndefined();
    expect(inadimplentes([], PACIENTES, HOJE)).toEqual([]);
  });
});
