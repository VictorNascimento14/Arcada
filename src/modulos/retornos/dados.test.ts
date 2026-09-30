import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { consultas, planos } from "@/dados/colecoes";
import type { Consulta } from "@/dominio";

import { ADIAR_MAX_DIAS, adiarRetorno, dispensarRetorno, MOTIVO_MAX, reativarRetorno, retornos } from "./dados";

const atendida = (pacienteId: string, dia: string): Consulta => ({
  id: `c-${pacienteId}-${dia}`,
  pacienteId,
  profissionalId: "prof",
  cadeiraId: "cad",
  inicio: `${dia}T09:00`,
  duracaoMin: 30,
  situacao: "concluida",
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 30, 12)); // 30/09/2026
  // retornos: a Ana em 10/09 (venceu há 20 dias) e a Bia em 20/10 (vence daqui a 20 dias)
  consultas.substituirTudo([atendida("ana", "2026-03-10"), atendida("bia", "2026-04-20")]);
  planos.substituirTudo([]);
  retornos.substituirTudo([]);
});
afterEach(() => {
  vi.useRealTimers();
  for (const c of [consultas, planos, retornos]) c.substituirTudo([]);
});

describe("adiarRetorno", () => {
  it("adia o retorno vencido contando de hoje e guarda o estado ligado ao último atendimento", () => {
    expect(adiarRetorno("ana", 15)).toEqual({ ok: true, adiadoAte: "2026-10-15" });
    expect(retornos.obter("ana")).toEqual({ id: "ana", ultimoAtendimento: "2026-03-10", adiadoAte: "2026-10-15" });
  });

  it("adia o retorno que ainda vai vencer contando do dia dele, e adiar de novo conta do dia adiado", () => {
    expect(adiarRetorno("bia", 7)).toMatchObject({ ok: true, adiadoAte: "2026-10-27" });
    expect(adiarRetorno("bia", 10)).toMatchObject({ ok: true, adiadoAte: "2026-11-06" });
    expect(retornos.listar()).toHaveLength(1);
  });

  it("recusa dias que não sejam um inteiro de 1 a 365", () => {
    for (const dias of [0, -3, 1.5, Number.NaN, ADIAR_MAX_DIAS + 1]) {
      expect(adiarRetorno("ana", dias), String(dias)).toEqual({ ok: false, erro: "Informe de 1 a 365 dias." });
    }
    expect(adiarRetorno("ana", ADIAR_MAX_DIAS).ok).toBe(true);
    expect(adiarRetorno("ana", 1).ok).toBe(true);
  });

  it("recusa quem não tem retorno e quem foi dispensado, sem gravar nada", () => {
    expect(adiarRetorno("zeca", 7)).toEqual({ ok: false, erro: "Este paciente ainda não tem retorno a adiar." });
    expect(retornos.listar()).toHaveLength(0);

    dispensarRetorno("ana", "Mudou de cidade");
    expect(adiarRetorno("ana", 7)).toEqual({ ok: false, erro: "Este retorno foi dispensado. Reative-o antes de adiar." });
    expect(retornos.obter("ana")?.adiadoAte).toBeUndefined();
  });

  it("o estado de um atendimento antigo não trava o retorno novo", () => {
    dispensarRetorno("ana", "Mudou de cidade");
    consultas.substituirTudo([atendida("ana", "2026-03-10"), atendida("ana", "2026-04-05")]); // novo atendimento: retorno em 05/10

    expect(adiarRetorno("ana", 7)).toEqual({ ok: true, adiadoAte: "2026-10-12" });
    expect(retornos.obter("ana")).toEqual({ id: "ana", ultimoAtendimento: "2026-04-05", adiadoAte: "2026-10-12" });
  });
});

describe("dispensarRetorno", () => {
  it("guarda o motivo sem as pontas, datado de hoje, e troca o adiamento que havia", () => {
    adiarRetorno("ana", 15);

    expect(dispensarRetorno("ana", "  Mudou de cidade ")).toEqual({ ok: true });
    expect(retornos.obter("ana")).toEqual({ id: "ana", ultimoAtendimento: "2026-03-10", dispensadoEm: "2026-09-30", motivo: "Mudou de cidade" });
  });

  it("exige o motivo, dentro do limite, e um retorno a dispensar", () => {
    expect(dispensarRetorno("ana", "")).toEqual({ ok: false, erro: "Diga o motivo da dispensa." });
    expect(dispensarRetorno("ana", "   ")).toEqual({ ok: false, erro: "Diga o motivo da dispensa." });
    expect(dispensarRetorno("ana", "x".repeat(MOTIVO_MAX + 1))).toEqual({ ok: false, erro: "O motivo passa de 200 caracteres." });
    expect(dispensarRetorno("zeca", "Mudou de cidade")).toEqual({ ok: false, erro: "Este paciente ainda não tem retorno a dispensar." });
    expect(retornos.listar()).toHaveLength(0);

    expect(dispensarRetorno("ana", "x".repeat(MOTIVO_MAX)).ok).toBe(true);
  });
});

describe("reativarRetorno", () => {
  it("desfaz a dispensa e o adiamento, e reativar de novo não faz mal", () => {
    dispensarRetorno("ana", "Mudou de cidade");
    adiarRetorno("bia", 7);

    reativarRetorno("ana");
    reativarRetorno("bia");
    reativarRetorno("bia");

    expect(retornos.listar()).toHaveLength(0);
  });
});
