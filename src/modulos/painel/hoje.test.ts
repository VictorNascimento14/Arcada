import { describe, expect, it } from "vitest";

import type { Consulta, SituacaoConsulta } from "@/dominio";

import { agoraISO, consultasDeHoje, proximaConsulta } from "./hoje";

const consulta = (id: string, inicio: string, situacao: SituacaoConsulta = "agendada"): Consulta => ({
  id,
  pacienteId: "a1",
  profissionalId: "p1",
  cadeiraId: "c1",
  inicio,
  duracaoMin: 30,
  situacao,
});

describe("agoraISO", () => {
  it("escreve o horário local com dois dígitos, sem passar por UTC", () => {
    expect(agoraISO(new Date(2026, 8, 5, 7, 3))).toBe("2026-09-05T07:03");
    expect(agoraISO(new Date(2026, 8, 30, 23, 30))).toBe("2026-09-30T23:30"); // à noite ainda é o mesmo dia
  });
});

describe("consultasDeHoje", () => {
  it("fica só com o dia, sem a cancelada, na ordem do horário", () => {
    const todas = [
      consulta("tarde", "2026-09-30T15:00"),
      consulta("ontem", "2026-09-29T09:00"),
      consulta("cancelada", "2026-09-30T10:00", "cancelada"),
      consulta("manha", "2026-09-30T08:00", "concluida"),
      consulta("amanha", "2026-10-01T08:00"),
      consulta("faltou", "2026-09-30T11:30", "faltou"),
    ];

    expect(consultasDeHoje(todas, "2026-09-30").map((c) => c.id)).toEqual(["manha", "faltou", "tarde"]);
    expect(todas.map((c) => c.id)[0]).toBe("tarde"); // a coleção de origem não é reordenada
  });

  it("duas no mesmo horário ficam na ordem em que foram marcadas", () => {
    const todas = [consulta("b", "2026-09-30T08:00"), consulta("a", "2026-09-30T08:00")];
    expect(consultasDeHoje(todas, "2026-09-30").map((c) => c.id)).toEqual(["b", "a"]);
  });

  it("dia sem consulta dá lista vazia", () => {
    expect(consultasDeHoje([consulta("x", "2026-10-01T08:00")], "2026-09-30")).toEqual([]);
  });
});

describe("proximaConsulta", () => {
  const dia = [
    consulta("feita", "2026-09-30T08:00", "concluida"),
    consulta("agora", "2026-09-30T10:00", "em-atendimento"),
    consulta("confirmada", "2026-09-30T11:00", "confirmada"),
    consulta("agendada", "2026-09-30T14:00"),
  ];

  it("é a primeira que ainda aguarda o atendimento, pulando as que já foram e a que está em atendimento", () => {
    expect(proximaConsulta(dia, "2026-09-30T09:00")?.id).toBe("confirmada");
  });

  it("a que começa neste minuto ainda é a próxima; passado o minuto, é a seguinte", () => {
    expect(proximaConsulta(dia, "2026-09-30T11:00")?.id).toBe("confirmada");
    expect(proximaConsulta(dia, "2026-09-30T11:01")?.id).toBe("agendada");
  });

  it("a que passou da hora sem começar não é a próxima, e a falta também não", () => {
    const passou = [consulta("faltou", "2026-09-30T14:00", "faltou"), consulta("atrasada", "2026-09-30T15:00")];
    expect(proximaConsulta(passou, "2026-09-30T16:00")).toBeUndefined();
  });

  it("não há próxima sem consulta", () => {
    expect(proximaConsulta([], "2026-09-30T08:00")).toBeUndefined();
  });
});
