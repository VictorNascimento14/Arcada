import { describe, expect, it } from "vitest";

import type { Consulta, SituacaoConsulta } from "@/dominio";

import { conflitosDaConsulta, type Reserva } from "./conflitos";

// A consulta que os casos disputam: segunda-feira, 09:00 às 10:00, na cadeira 1 com o profissional 1.
const consulta = (mudancas: Partial<Consulta> = {}): Consulta => ({
  id: "c1",
  pacienteId: "p1",
  profissionalId: "prof1",
  cadeiraId: "cad1",
  inicio: "2026-10-05T09:00",
  duracaoMin: 60,
  situacao: "agendada",
  ...mudancas,
});

// Quem quer marcar: por padrão, a mesma cadeira, o mesmo profissional e o mesmo horário.
const candidata = (mudancas: Partial<Reserva> = {}): Reserva => ({
  cadeiraId: "cad1",
  profissionalId: "prof1",
  inicio: "2026-10-05T09:00",
  duracaoMin: 60,
  ...mudancas,
});

const ids = (conflitos: ReturnType<typeof conflitosDaConsulta>) => conflitos.map((c) => c.consulta.id);

describe("conflitosDaConsulta", () => {
  it("sem consultas marcadas, não há conflito", () => {
    expect(conflitosDaConsulta(candidata(), [])).toEqual([]);
  });

  it("devolve a consulta que colide e diz se foi a cadeira, o profissional ou os dois", () => {
    const marcada = consulta();
    expect(conflitosDaConsulta(candidata({ profissionalId: "prof2" }), [marcada])).toEqual([
      { consulta: marcada, motivos: ["cadeira"] },
    ]);
    expect(conflitosDaConsulta(candidata({ cadeiraId: "cad2" }), [marcada])).toEqual([
      { consulta: marcada, motivos: ["profissional"] },
    ]);
    expect(conflitosDaConsulta(candidata(), [marcada])).toEqual([
      { consulta: marcada, motivos: ["cadeira", "profissional"] },
    ]);
  });

  it("outra cadeira e outro profissional no mesmo horário não conflitam", () => {
    expect(conflitosDaConsulta(candidata({ cadeiraId: "cad2", profissionalId: "prof2" }), [consulta()])).toEqual([]);
  });

  // A consulta marcada ocupa 09:00–10:00.
  it.each<[string, string, number, boolean]>([
    ["começa antes e entra no horário", "2026-10-05T08:30", 60, true],
    ["começa dentro e termina depois", "2026-10-05T09:30", 60, true],
    ["cabe dentro", "2026-10-05T09:15", 30, true],
    ["cobre a consulta inteira", "2026-10-05T08:00", 180, true],
    ["ocupa exatamente o mesmo horário", "2026-10-05T09:00", 60, true],
    ["termina quando a outra começa", "2026-10-05T08:00", 60, false],
    ["começa quando a outra termina", "2026-10-05T10:00", 30, false],
    ["cai no mesmo horário, mas em outro dia", "2026-10-06T09:00", 60, false],
  ])("candidata que %s", (_descricao, inicio, duracaoMin, conflita) => {
    expect(ids(conflitosDaConsulta(candidata({ inicio, duracaoMin }), [consulta()]))).toEqual(conflita ? ["c1"] : []);
  });

  it.each<[SituacaoConsulta, boolean]>([
    ["agendada", true],
    ["confirmada", true],
    ["em-atendimento", true],
    ["concluida", true],
    ["faltou", true],
    ["cancelada", false],
  ])("consulta %s ocupa o horário: %s", (situacao, ocupa) => {
    expect(ids(conflitosDaConsulta(candidata(), [consulta({ situacao })]))).toEqual(ocupa ? ["c1"] : []);
  });

  it("uma consulta remarcada não conflita consigo mesma, mas conflita com as outras", () => {
    const propria = consulta({ id: "c1" }); // 09:00–10:00
    const outra = consulta({ id: "c2", inicio: "2026-10-05T10:00" }); // 10:00–11:00
    // Remarcada para 09:30–10:30, a c1 entra no horário antigo dela mesma e no da c2.
    const remarcada = candidata({ id: "c1", inicio: "2026-10-05T09:30" });
    expect(ids(conflitosDaConsulta(remarcada, [propria, outra]))).toEqual(["c2"]);
  });

  it("lista todas as que colidem, na ordem da agenda", () => {
    const daCadeira = consulta({ id: "c1", profissionalId: "prof2" });
    const doProfissional = consulta({ id: "c2", cadeiraId: "cad2", inicio: "2026-10-05T09:30" });
    const livre = consulta({ id: "c3", inicio: "2026-10-05T11:00" });
    expect(conflitosDaConsulta(candidata(), [daCadeira, livre, doProfissional])).toEqual([
      { consulta: daCadeira, motivos: ["cadeira"] },
      { consulta: doProfissional, motivos: ["profissional"] },
    ]);
  });
});
