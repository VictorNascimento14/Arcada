import { beforeEach, describe, expect, it } from "vitest";

import { lancamentos, planos } from "@/dados/colecoes";
import type { PlanoTratamento, SituacaoPlano } from "@/dominio";

import { calcularParcelas, gerarParcelas, MAXIMO_DE_PARCELAS } from "./lancamentos";

const PLANO: PlanoTratamento = {
  id: "pl1",
  pacienteId: "pac1",
  itens: [{ id: "i1", procedimentoId: "p1", preco: 10_000 }],
  desconto: 0,
  situacao: "aprovado",
};
const campos = (parcelas: string, vencimento = "2026-10-15") => ({ parcelas, vencimento });

beforeEach(() => {
  planos.substituirTudo([PLANO]);
  lancamentos.substituirTudo([]);
});

describe("calcularParcelas", () => {
  it("divide o total do plano — já com o desconto — e não grava nada", () => {
    const comDesconto = { ...PLANO, desconto: 1 }; // R$ 99,99: 3333 + 3333 + 3333
    expect(calcularParcelas(comDesconto, campos("3"))).toEqual({
      parcelas: [
        { valor: 3_333, vencimento: "2026-10-15" },
        { valor: 3_333, vencimento: "2026-11-15" },
        { valor: 3_333, vencimento: "2026-12-15" },
      ],
    });
    expect(lancamentos.listar()).toEqual([]);
  });

  it.each(["0", "", "abc", "2,5", "-1", String(MAXIMO_DE_PARCELAS + 1)])("recusa %j como número de parcelas", (texto) => {
    expect(calcularParcelas(PLANO, campos(texto))).toEqual({ erros: { parcelas: `Informe de 1 a ${MAXIMO_DE_PARCELAS} parcelas.` } });
  });

  it("recusa parcela de menos de um centavo", () => {
    const pequeno = { ...PLANO, itens: [{ id: "i1", procedimentoId: "p1", preco: 2 }] };
    expect(calcularParcelas(pequeno, campos("3"))).toEqual({ erros: { parcelas: "Cada parcela precisa ter ao menos R$ 0,01." } });
    expect("parcelas" in calcularParcelas(pequeno, campos("2"))).toBe(true);
  });

  it.each(["", "2026-02-30", "15/10/2026"])("recusa %j como vencimento", (vencimento) => {
    expect(calcularParcelas(PLANO, campos("2", vencimento))).toEqual({ erros: { vencimento: "Informe o dia do primeiro vencimento." } });
  });
});

describe("gerarParcelas", () => {
  it("grava um lançamento por parcela, do paciente e do plano, somando o total", () => {
    expect(gerarParcelas("pl1", campos("3", "2026-01-31"))).toEqual({});

    const gravados = lancamentos.listar();
    expect(gravados.map((l) => [l.valor, l.vencimento])).toEqual([
      [3_334, "2026-01-31"],
      [3_333, "2026-02-28"],
      [3_333, "2026-03-31"],
    ]);
    expect(gravados.every((l) => l.pacienteId === "pac1" && l.planoId === "pl1" && l.pagoEm === undefined)).toBe(true);
    expect(new Set(gravados.map((l) => l.id)).size).toBe(3);
    expect(gravados.reduce((soma, l) => soma + l.valor, 0)).toBe(10_000);
  });

  it("mantém os lançamentos que já existiam, de outros planos", () => {
    const outro = { id: "l0", pacienteId: "pac9", planoId: "outro", valor: 500, vencimento: "2026-09-01" };
    lancamentos.substituirTudo([outro]);
    gerarParcelas("pl1", campos("2"));
    expect(lancamentos.listar()).toHaveLength(3);
    expect(lancamentos.obter("l0")).toEqual(outro);
  });

  it("devolve os erros por campo e não grava nada", () => {
    expect(gerarParcelas("pl1", campos("0", ""))).toEqual({ parcelas: expect.any(String) });
    expect(gerarParcelas("pl1", campos("2", ""))).toEqual({ vencimento: expect.any(String) });
    expect(lancamentos.listar()).toEqual([]);
  });

  it("gera uma vez só: pedir de novo lança e não duplica as parcelas", () => {
    gerarParcelas("pl1", campos("2"));
    expect(() => gerarParcelas("pl1", campos("2"))).toThrow("já tem parcelas");
    expect(lancamentos.listar()).toHaveLength(2);
  });

  it("gera o plano aprovado e o em andamento; os outros lançam", () => {
    const com = (situacao: SituacaoPlano) => planos.substituirTudo([{ ...PLANO, situacao }]);
    for (const situacao of ["proposto", "concluido", "recusado"] as const) {
      com(situacao);
      expect(() => gerarParcelas("pl1", campos("2"))).toThrow("aprovado ou em andamento");
    }
    com("em-andamento");
    expect(gerarParcelas("pl1", campos("2"))).toEqual({});
  });

  it("lança se o plano não existe", () => {
    expect(() => gerarParcelas("nada", campos("2"))).toThrow("não existe");
  });
});
