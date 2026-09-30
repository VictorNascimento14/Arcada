import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pacientes } from "@/dados/colecoes";
import type { Paciente } from "@/dominio";

import { anamneses, salvarAnamnese, versoesDoPaciente, type Anamnese } from "./dados";
import { LIMITE_DO_DETALHE, LIMITE_DO_TEXTO, PERGUNTAS, type Respostas } from "./questionario";

// Fictício, sem CPF.
const ANA: Paciente = { id: "p1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(11) 90000-0002" };

/** Toda pergunta sim/não respondida "não": o mínimo que se pode gravar. */
const MINIMAS = Object.fromEntries(PERGUNTAS.filter((p) => p.tipo === "simNao").map((p) => [p.id, { sim: false }])) as Respostas;

/** As respostas mínimas com o que o caso troca. */
const ficha = (mais: Respostas): Respostas => ({ ...MINIMAS, ...mais });

beforeEach(() => {
  localStorage.clear();
  pacientes.substituirTudo([ANA]);
  anamneses.substituirTudo([]);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 30, 23, 30)); // 23h30 local: `toISOString()` já daria o dia seguinte no Brasil
});

afterEach(() => {
  vi.useRealTimers();
  pacientes.substituirTudo([]);
  anamneses.substituirTudo([]);
});

describe("salvarAnamnese", () => {
  it("grava uma versão do paciente, com id próprio e o dia local de hoje", () => {
    const versao = salvarAnamnese("p1", ficha({ alergia: { sim: true, detalhe: "Penicilina" } }));

    expect(versao).toMatchObject({ pacienteId: "p1", data: "2026-09-30", respostas: { alergia: { sim: true, detalhe: "Penicilina" } } });
    expect(versao?.id).toBeTruthy();
    expect(anamneses.listar()).toEqual([versao]);
  });

  it("cada salvamento é uma versão nova: as anteriores ficam como estavam", () => {
    const primeira = salvarAnamnese("p1", ficha({ gestante: { sim: true } }));
    const segunda = salvarAnamnese("p1", ficha({ gestante: { sim: false } }));

    expect(anamneses.listar()).toHaveLength(2);
    expect(segunda?.id).not.toBe(primeira?.id);
    expect(anamneses.obter(primeira!.id)?.respostas.gestante).toEqual({ sim: true });
  });

  it("apara o texto e o detalhe, tira o que ficou em branco e não leva o detalhe de um não", () => {
    const versao = salvarAnamnese(
      "p1",
      ficha({
        alergia: { sim: true, detalhe: "  Látex  " },
        anticoagulante: { sim: true, detalhe: "   " },
        reacaoAnestesia: { sim: false, detalhe: "digitado antes de mudar de ideia" },
        outrosProblemas: "  Asma leve  ",
        motivoDaConsulta: "   ",
      }),
    );

    expect(versao?.respostas.alergia).toEqual({ sim: true, detalhe: "Látex" });
    expect(versao?.respostas.anticoagulante).toEqual({ sim: true });
    expect(versao?.respostas.reacaoAnestesia).toEqual({ sim: false });
    expect(versao?.respostas.outrosProblemas).toBe("Asma leve");
    expect(versao?.respostas).not.toHaveProperty("motivoDaConsulta");
  });

  it("recusa, sem gravar, pergunta sim/não sem resposta, texto e detalhe além do limite e paciente que não existe", () => {
    const incompleta = { ...MINIMAS };
    delete incompleta.diabetes;

    expect(salvarAnamnese("p1", incompleta)).toBeNull();
    expect(salvarAnamnese("p1", ficha({ outrosProblemas: "a".repeat(LIMITE_DO_TEXTO + 1) }))).toBeNull();
    expect(salvarAnamnese("p1", ficha({ alergia: { sim: true, detalhe: "a".repeat(LIMITE_DO_DETALHE + 1) } }))).toBeNull();
    expect(salvarAnamnese("outro", MINIMAS)).toBeNull();
    expect(anamneses.listar()).toEqual([]);
  });
});

describe("versoesDoPaciente", () => {
  const v = (id: string, pacienteId: string, data: string): Anamnese => ({ id, pacienteId, data, respostas: MINIMAS });

  it("devolve só as do paciente, da mais nova à mais antiga, e no mesmo dia a última gravada primeiro", () => {
    const todas = [v("a", "p1", "2026-03-10"), v("b", "p2", "2026-09-01"), v("c", "p1", "2026-09-30"), v("d", "p1", "2026-03-10"), v("e", "p1", "2026-09-30")];

    expect(versoesDoPaciente(todas, "p1").map((x) => x.id)).toEqual(["e", "c", "d", "a"]);
    expect(versoesDoPaciente(todas, "p3")).toEqual([]);
    expect(todas.map((x) => x.id)).toEqual(["a", "b", "c", "d", "e"]); // a lista de entrada não é mexida
  });
});
