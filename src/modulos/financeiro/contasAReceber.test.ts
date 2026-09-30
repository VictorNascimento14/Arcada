import { describe, expect, it } from "vitest";

import type { Lancamento, Paciente } from "@/dominio";

import { contasAReceber } from "./contasAReceber";

const HOJE = "2026-10-15";
const paciente = (id: string, nome: string): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "" });
const PACIENTES = [paciente("ana", "Ana Exemplo"), paciente("bruno", "Bruno Exemplo")];
const parcela = (id: string, pacienteId: string, vencimento: string, extra: Partial<Lancamento> = {}): Lancamento => ({
  id,
  pacienteId,
  planoId: "pl1",
  valor: 1_000,
  vencimento,
  ...extra,
});
const PAGA = { pagoEm: "2026-10-01", forma: "pix" } as const;
const ordem = (lancamentos: Lancamento[]) => contasAReceber(lancamentos, PACIENTES, HOJE).map((c) => [c.lancamento.id, c.situacao]);

describe("contas a receber", () => {
  it("põe as em aberto primeiro, pelo vencimento, e as pagas no fim, cada uma com a situação", () => {
    expect(
      ordem([
        parcela("paga-antiga", "ana", "2026-09-01", PAGA),
        parcela("a-vencer", "ana", "2026-10-20"),
        parcela("vencida", "bruno", "2026-10-10"),
        parcela("hoje", "ana", "2026-10-15"),
        parcela("paga-adiantada", "bruno", "2026-11-01", PAGA),
      ]),
    ).toEqual([
      ["vencida", "vencida"],
      ["hoje", "vence-hoje"],
      ["a-vencer", "a-vencer"],
      ["paga-antiga", "paga"],
      ["paga-adiantada", "paga"],
    ]);
  });

  it("no mesmo dia, pelo nome do paciente; no mesmo paciente, pela ordem em que foram geradas", () => {
    expect(
      ordem([parcela("b", "bruno", "2026-11-15"), parcela("a1", "ana", "2026-11-15"), parcela("a2", "ana", "2026-11-15")]).map(([id]) => id),
    ).toEqual(["a1", "a2", "b"]);
  });

  it("junta o paciente de cada parcela; o de um paciente que não existe entra sem `paciente`", () => {
    const [ana, sumiu] = contasAReceber([parcela("a", "ana", "2026-11-01"), parcela("s", "sumiu", "2026-11-02")], PACIENTES, HOJE);
    expect(ana.paciente?.nome).toBe("Ana Exemplo");
    expect(sumiu.paciente).toBeUndefined();
  });

  it("sem parcelas, lista vazia", () => {
    expect(contasAReceber([], PACIENTES, HOJE)).toEqual([]);
  });
});
