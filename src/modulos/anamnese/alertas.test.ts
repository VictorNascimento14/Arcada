import { describe, expect, it } from "vitest";

import { alertasDaAnamnese } from "./alertas";
import { PERGUNTAS, respostasValidas, type Respostas } from "./questionario";

/** Uma ficha completa e sem nenhum alerta: toda pergunta sim/não respondida "não". */
const SEM_ALERTAS = Object.fromEntries(PERGUNTAS.filter((p) => p.tipo === "simNao").map((p) => [p.id, { sim: false }])) as Respostas;

/** A ficha sem alertas, com o que o caso troca. */
const ficha = (mais: Respostas): Respostas => ({ ...SEM_ALERTAS, ...mais });

describe("alertasDaAnamnese", () => {
  it("não tem alerta enquanto nada foi respondido com sim", () => {
    expect(alertasDaAnamnese({})).toEqual([]);
    expect(alertasDaAnamnese(SEM_ALERTAS)).toEqual([]);
  });

  it("repete o que foi respondido: a alergia com o detalhe, o anticoagulante, a gestação e o diabetes", () => {
    const respostas = ficha({
      alergia: { sim: true, detalhe: "Penicilina" },
      anticoagulante: { sim: true },
      gestante: { sim: true },
      diabetes: { sim: true },
    });
    expect(respostasValidas(respostas)).toBe(true);
    expect(alertasDaAnamnese(respostas)).toEqual(["Alergia informada: Penicilina", "Usa anticoagulante", "Gestante", "Diabetes informado"]);
  });

  it("avisa também de pressão alta, problema no coração e reação a anestesia", () => {
    const respostas = ficha({
      hipertensao: { sim: true },
      problemaCardiaco: { sim: true, detalhe: "Arritmia" },
      reacaoAnestesia: { sim: true, detalhe: "Desmaio" },
    });
    expect(respostasValidas(respostas)).toBe(true);
    expect(alertasDaAnamnese(respostas)).toEqual(["Reação a anestesia informada: Desmaio", "Pressão alta informada", "Problema cardíaco informado: Arritmia"]);
  });

  it("põe o detalhe no alerta só quando foi informado, sem os espaços das pontas", () => {
    expect(alertasDaAnamnese(ficha({ alergia: { sim: true } }))).toEqual(["Alergia informada"]);
    expect(alertasDaAnamnese(ficha({ alergia: { sim: true, detalhe: "   " } }))).toEqual(["Alergia informada"]);
    expect(alertasDaAnamnese(ficha({ alergia: { sim: true, detalhe: "  Látex " } }))).toEqual(["Alergia informada: Látex"]);
  });

  it("ignora o detalhe de um não, o texto livre e as respostas de hábitos e de histórico odontológico", () => {
    const respostas = ficha({
      alergia: { sim: false, detalhe: "Penicilina" },
      outrosProblemas: "Tem diabetes",
      fuma: { sim: true },
      gengivaSangra: { sim: true },
    });
    expect(alertasDaAnamnese(respostas)).toEqual([]);
  });
});
