import { describe, expect, it } from "vitest";

import type { Consulta, ItemPlano, PlanoTratamento } from "@/dominio";
import { CATALOGO } from "@/modulos/procedimentos/catalogo";

import {
  INTERVALO_PADRAO_MESES,
  INTERVALOS_POR_PROCEDIMENTO,
  intervaloDoProcedimento,
  retornoDoPaciente,
  somarMeses,
  ultimoAtendimento,
} from "./regra";

const consulta = (extra: Partial<Consulta> = {}): Consulta => ({
  id: "c1",
  pacienteId: "p1",
  profissionalId: "prof",
  cadeiraId: "cad",
  inicio: "2026-03-10T09:00",
  duracaoMin: 30,
  situacao: "concluida",
  ...extra,
});
const item = (extra: Partial<ItemPlano> = {}): ItemPlano => ({ id: "i1", procedimentoId: "proc-a", preco: 10000, ...extra });
const plano = (itens: ItemPlano[], pacienteId = "p1"): PlanoTratamento => ({ id: "pl1", pacienteId, itens, desconto: 0, situacao: "em-andamento" });

describe("somarMeses", () => {
  it("soma os meses mantendo o dia e passa de ano", () => {
    expect(somarMeses("2026-03-15", 6)).toBe("2026-09-15");
    expect(somarMeses("2026-10-05", 6)).toBe("2027-04-05");
    expect(somarMeses("2026-12-31", 1)).toBe("2027-01-31");
  });

  it("no fim do mês cai no último dia do mês de chegada", () => {
    expect(somarMeses("2026-08-31", 6)).toBe("2027-02-28");
    expect(somarMeses("2027-08-31", 6)).toBe("2028-02-29"); // ano bissexto
    expect(somarMeses("2099-08-31", 6)).toBe("2100-02-28"); // século que não é múltiplo de 400
    expect(somarMeses("2026-03-31", 1)).toBe("2026-04-30");
  });

  it("com meses negativos volta no tempo, com o mesmo ajuste de fim de mês", () => {
    expect(somarMeses("2026-09-30", -6)).toBe("2026-03-30");
    expect(somarMeses("2026-03-31", -1)).toBe("2026-02-28");
    expect(somarMeses("2026-02-15", -2)).toBe("2025-12-15");
  });

  it("volta ao dia 31 quando o mês de chegada tem", () => {
    expect(somarMeses("2026-01-31", 1)).toBe("2026-02-28");
    expect(somarMeses("2026-01-31", 2)).toBe("2026-03-31");
  });
});

describe("intervaloDoProcedimento", () => {
  it("usa 6 meses sem procedimento e para o procedimento sem regra", () => {
    expect(INTERVALO_PADRAO_MESES).toBe(6);
    expect(intervaloDoProcedimento(undefined)).toBe(6);
    expect(intervaloDoProcedimento("proc-profilaxia")).toBe(6);
  });

  it("usa o prazo do mapa quando o procedimento tem regra própria", () => {
    expect(intervaloDoProcedimento("proc-x", { "proc-x": 3 })).toBe(3);
    expect(intervaloDoProcedimento("proc-manutencao-aparelho")).toBe(1);
  });

  it("o mapa da clínica só nomeia procedimentos do catálogo, em meses inteiros a partir de 1", () => {
    const ids = new Set(CATALOGO.map((p) => p.id));
    for (const [id, meses] of Object.entries(INTERVALOS_POR_PROCEDIMENTO)) {
      expect(ids.has(id), id).toBe(true);
      expect(Number.isInteger(meses) && meses >= 1, id).toBe(true);
    }
  });
});

describe("ultimoAtendimento", () => {
  it("é null para quem não foi atendido: consulta que não terminou, item a fazer e dado de outro paciente", () => {
    const naoAtendem = (["agendada", "confirmada", "em-atendimento", "faltou", "cancelada"] as const).map((situacao, i) =>
      consulta({ id: `c${i}`, situacao }),
    );
    expect(ultimoAtendimento("p1", naoAtendem, [plano([item()])])).toBeNull();
    expect(ultimoAtendimento("p1", [consulta({ pacienteId: "p2" })], [plano([item({ realizadoEm: "2026-04-01" })], "p2")])).toBeNull();
  });

  it("conta a consulta concluída pelo dia do início e o item do plano pelo dia realizado", () => {
    expect(ultimoAtendimento("p1", [consulta({ procedimentoId: "proc-a" })], [])).toEqual({ dia: "2026-03-10", procedimentoIds: ["proc-a"] });
    expect(ultimoAtendimento("p1", [], [plano([item({ realizadoEm: "2026-04-02" })])])).toEqual({ dia: "2026-04-02", procedimentoIds: ["proc-a"] });
  });

  it("fica com o mais recente entre as duas fontes", () => {
    const consultas = [consulta({ id: "velha", inicio: "2026-01-05T09:00" }), consulta({ id: "nova", inicio: "2026-05-20T14:00" })];
    expect(ultimoAtendimento("p1", consultas, [plano([item({ realizadoEm: "2026-04-02" })])])?.dia).toBe("2026-05-20");
    expect(ultimoAtendimento("p1", consultas, [plano([item({ realizadoEm: "2026-06-11" })])])?.dia).toBe("2026-06-11");
  });

  it("junta os procedimentos conhecidos do dia e ignora a consulta sem procedimento", () => {
    const dia = "2026-06-11";
    const atendimento = ultimoAtendimento(
      "p1",
      [consulta({ inicio: `${dia}T09:00` })],
      [plano([item({ id: "a", procedimentoId: "proc-a", realizadoEm: dia }), item({ id: "b", procedimentoId: "proc-b", realizadoEm: dia })])],
    );
    expect(atendimento).toEqual({ dia, procedimentoIds: ["proc-a", "proc-b"] });
  });
});

describe("retornoDoPaciente", () => {
  it("soma 6 meses ao último atendimento e ajusta o fim do mês", () => {
    expect(retornoDoPaciente("p1", [consulta({ inicio: "2026-03-10T09:00" })], [])).toEqual({
      pacienteId: "p1",
      ultimoAtendimento: "2026-03-10",
      intervaloMeses: 6,
      retornoEm: "2026-09-10",
    });
    expect(retornoDoPaciente("p1", [consulta({ inicio: "2026-08-31T09:00" })], [])?.retornoEm).toBe("2027-02-28");
  });

  it("usa o intervalo do procedimento do último atendimento", () => {
    const antes = consulta({ inicio: "2026-01-10T09:00", procedimentoId: "proc-manutencao-aparelho" });
    const depois = plano([item({ procedimentoId: "proc-profilaxia", realizadoEm: "2026-03-20" })]);
    expect(retornoDoPaciente("p1", [antes], [depois])?.retornoEm).toBe("2026-09-20"); // o último foi a limpeza: 6 meses
    expect(retornoDoPaciente("p1", [antes], [])?.retornoEm).toBe("2026-02-10"); // o último foi a manutenção: 1 mês
    expect(retornoDoPaciente("p1", [antes], [], { "proc-manutencao-aparelho": 2 })?.retornoEm).toBe("2026-03-10");
  });

  it("no dia com mais de um procedimento vale o menor intervalo", () => {
    const dia = "2026-06-11";
    const itens = [item({ id: "a", procedimentoId: "proc-x", realizadoEm: dia }), item({ id: "b", procedimentoId: "proc-y", realizadoEm: dia })];
    expect(retornoDoPaciente("p1", [], [plano(itens)], { "proc-x": 12, "proc-y": 3 })).toMatchObject({ intervaloMeses: 3, retornoEm: "2026-09-11" });
  });

  it("é null sem atendimento", () => {
    expect(retornoDoPaciente("p1", [consulta({ situacao: "agendada" })], [plano([item()])])).toBeNull();
  });
});
