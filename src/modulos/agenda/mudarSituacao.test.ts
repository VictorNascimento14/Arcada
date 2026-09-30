import { beforeEach, describe, expect, it } from "vitest";

import { consultas } from "@/dados/colecoes";
import type { Consulta, SituacaoConsulta } from "@/dominio";

import { cancelarConsulta, MOTIVO_MAX, mudarSituacao } from "./mudarSituacao";

const base = (situacao: SituacaoConsulta): Consulta => ({
  id: "k1", pacienteId: "a1", profissionalId: "p1", cadeiraId: "c1", inicio: "2026-10-01T09:00", duracaoMin: 45, situacao, procedimentoId: "pr1",
});
const situacaoGravada = () => consultas.obter("k1")?.situacao;

beforeEach(() => {
  localStorage.clear();
  consultas.substituirTudo([base("agendada")]);
});

describe("mudarSituacao", () => {
  it("grava a situação nova e mexe só nela", () => {
    const r = mudarSituacao("k1", "confirmada");

    expect(r).toEqual({ ok: true, consulta: base("confirmada") });
    expect(consultas.obter("k1")).toEqual(base("confirmada"));
  });

  it("percorre o caminho do atendimento, passo a passo", () => {
    for (const passo of ["confirmada", "em-atendimento", "concluida"] as const) {
      expect(mudarSituacao("k1", passo).ok).toBe(true);
      expect(situacaoGravada()).toBe(passo);
    }
  });

  it("a agendada também entra direto em atendimento, e a confirmada pode faltar", () => {
    expect(mudarSituacao("k1", "em-atendimento").ok).toBe(true);
    consultas.substituirTudo([base("confirmada")]);
    expect(mudarSituacao("k1", "faltou").ok).toBe(true);
    expect(situacaoGravada()).toBe("faltou");
  });

  it.each<[SituacaoConsulta, SituacaoConsulta, string]>([
    ["agendada", "concluida", "A consulta agendada não pode passar para concluída."], // pular etapa
    ["confirmada", "agendada", "A consulta confirmada não pode passar para agendada."], // voltar
    ["confirmada", "confirmada", "A consulta confirmada não pode passar para confirmada."], // repetir
    ["concluida", "faltou", "A consulta concluída não pode passar para faltou."], // situação final
    ["em-atendimento", "faltou", "A consulta em atendimento não pode passar para faltou."],
  ])("recusa %s > %s e não grava nada", (de, para, erro) => {
    consultas.substituirTudo([base(de)]);

    expect(mudarSituacao("k1", para)).toEqual({ ok: false, erro });
    expect(situacaoGravada()).toBe(de);
  });

  it("recusa a consulta que não existe", () => {
    expect(mudarSituacao("some", "confirmada")).toEqual({ ok: false, erro: "Esta consulta não existe mais." });
  });

  it("não cancela: cancelar pede o motivo", () => {
    expect(mudarSituacao("k1", "cancelada")).toEqual({ ok: false, erro: "Cancelar a consulta pede o motivo." });
    expect(situacaoGravada()).toBe("agendada");
  });
});

describe("cancelarConsulta", () => {
  it("cancela e guarda o motivo, sem os espaços das pontas, mexendo só nisso", () => {
    const r = cancelarConsulta("k1", "  Paciente pediu para desmarcar  ");

    const esperada = { ...base("cancelada"), motivoCancelamento: "Paciente pediu para desmarcar" };
    expect(r).toEqual({ ok: true, consulta: esperada });
    expect(consultas.obter("k1")).toEqual(esperada);
  });

  it("a confirmada também cancela", () => {
    consultas.substituirTudo([base("confirmada")]);
    expect(cancelarConsulta("k1", "Viagem").ok).toBe(true);
    expect(situacaoGravada()).toBe("cancelada");
  });

  it("pede o motivo: vazio, só espaços e maior que o limite não cancelam", () => {
    expect(cancelarConsulta("k1", "")).toEqual({ ok: false, erro: "Informe o motivo do cancelamento." });
    expect(cancelarConsulta("k1", "   ")).toEqual({ ok: false, erro: "Informe o motivo do cancelamento." });
    expect(cancelarConsulta("k1", "x".repeat(MOTIVO_MAX + 1))).toEqual({ ok: false, erro: `O motivo pode ter até ${MOTIVO_MAX} caracteres.` });
    expect(cancelarConsulta("k1", "x".repeat(MOTIVO_MAX)).ok).toBe(true);
  });

  it.each<SituacaoConsulta>(["em-atendimento", "concluida", "faltou", "cancelada"])("recusa cancelar a consulta %s e não grava o motivo", (situacao) => {
    consultas.substituirTudo([base(situacao)]);

    expect(cancelarConsulta("k1", "Motivo").ok).toBe(false);
    expect(consultas.obter("k1")).toEqual(base(situacao));
  });

  it("recusa a consulta que não existe", () => {
    expect(cancelarConsulta("some", "Motivo")).toEqual({ ok: false, erro: "Esta consulta não existe mais." });
  });
});
