import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PERGUNTAS, SECOES, type Respostas } from "./questionario";
import RespostasDaAnamnese from "./RespostasDaAnamnese";

const rotulo = (id: string) => PERGUNTAS.find((p) => p.id === id)!.rotulo;

/** O que está escrito como resposta da pergunta: o `dd` que vem logo depois do `dt` dela. */
const lida = (id: string) => screen.getByText(rotulo(id)).nextElementSibling?.textContent;

describe("RespostasDaAnamnese", () => {
  it("mostra as cinco seções, cada uma com as suas perguntas, na ordem do questionário", () => {
    render(<RespostasDaAnamnese respostas={{}} />);

    expect(screen.getAllByRole("heading", { level: 5 }).map((h) => h.textContent)).toEqual(SECOES.map((s) => s.titulo));
    expect(screen.getAllByRole("term").map((t) => t.textContent)).toEqual(PERGUNTAS.map((p) => p.rotulo));
  });

  it("lê o sim (com o detalhe aparado, se houver), o não e o texto como foi escrito", () => {
    const respostas: Respostas = {
      alergia: { sim: true, detalhe: "  Penicilina " },
      anticoagulante: { sim: true },
      gestante: { sim: false },
      outrosProblemas: "Asma leve\nRinite",
    };
    render(<RespostasDaAnamnese respostas={respostas} />);

    expect(lida("alergia")).toBe("Sim — Penicilina");
    expect(lida("anticoagulante")).toBe("Sim");
    expect(lida("gestante")).toBe("Não");
    expect(lida("outrosProblemas")).toBe("Asma leve\nRinite");
  });

  it("não toma a falta por um não: pergunta sem resposta aparece como não respondida, e texto em branco como não informado", () => {
    render(<RespostasDaAnamnese respostas={{ motivoDaConsulta: "   " }} />);

    expect(lida("diabetes")).toBe("Não respondida");
    expect(lida("motivoDaConsulta")).toBe("Não informado");
    expect(lida("escovacoesPorDia")).toBe("Não informado");
  });

  it("um registro estragado não derruba a tela: o que não se lê vira não respondida", () => {
    const estragado = { alergia: null, diabetes: "sim", gestante: { sim: 1 }, fuma: { detalhe: "x" } } as unknown as Respostas;
    render(<RespostasDaAnamnese respostas={estragado} />);

    for (const id of ["alergia", "diabetes", "fuma"]) expect(lida(id)).toBe("Não respondida");
    expect(lida("gestante")).toBe("Sim"); // truthy: só `null` e falta de `sim` são recusados, o resto o tipo já garante
  });
});
