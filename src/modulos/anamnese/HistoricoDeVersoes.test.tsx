import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { anamneses, type Anamnese } from "./dados";
import HistoricoDeVersoes from "./HistoricoDeVersoes";
import { PERGUNTAS, type Respostas } from "./questionario";

/** Toda pergunta sim/não respondida "não": uma ficha completa. */
const MINIMAS = Object.fromEntries(PERGUNTAS.filter((p) => p.tipo === "simNao").map((p) => [p.id, { sim: false }])) as Respostas;

const versao = (id: string, pacienteId: string, data: string, mais: Respostas = {}): Anamnese => ({
  id,
  pacienteId,
  data,
  respostas: { ...MINIMAS, ...mais },
});

const linhas = () => screen.getAllByRole("listitem");
const ver = (numero: number) => fireEvent.click(screen.getByRole("button", { name: `Ver respostas da versão ${numero}` }));

beforeEach(() => {
  localStorage.clear();
  anamneses.substituirTudo([]);
});

describe("HistoricoDeVersoes", () => {
  it("lista as versões do paciente da mais nova à mais antiga, numeradas, e marca só a mais nova como vigente", () => {
    anamneses.substituirTudo([
      versao("a", "p1", "2026-03-10"),
      versao("b", "p2", "2026-09-01"), // de outro paciente
      versao("c", "p1", "2026-09-30"),
      versao("d", "p1", "2026-09-30"), // no mesmo dia, gravada depois
    ]);

    render(<HistoricoDeVersoes pacienteId="p1" />);

    expect(linhas()).toHaveLength(3);
    const [nova, meio, antiga] = linhas();
    expect(within(nova).getByText("Versão 3")).toBeTruthy();
    expect(within(nova).getByText("30/09/2026")).toBeTruthy();
    expect(within(nova).getByText("Vigente")).toBeTruthy();
    expect(within(meio).getByText("Versão 2")).toBeTruthy();
    expect(within(meio).queryByText("Vigente")).toBeNull();
    expect(within(antiga).getByText("Versão 1")).toBeTruthy();
    expect(within(antiga).getByText("10/03/2026")).toBeTruthy();
    expect(screen.getAllByText("Vigente")).toHaveLength(1);
  });

  it("não desenha nada quando o paciente não tem versão", () => {
    anamneses.substituirTudo([versao("a", "p1", "2026-03-10")]);

    const { container } = render(<HistoricoDeVersoes pacienteId="p2" />);

    expect(container.firstChild).toBeNull();
  });

  it("abre as respostas da versão escolhida, só para ler, e fecha no Escape", () => {
    anamneses.substituirTudo([
      versao("a", "p1", "2026-03-10", { alergia: { sim: true, detalhe: "Penicilina" }, outrosProblemas: "Asma leve" }),
      versao("b", "p1", "2026-09-30"),
    ]);
    render(<HistoricoDeVersoes pacienteId="p1" />);
    expect(screen.queryByRole("dialog")).toBeNull();

    ver(1);
    const antiga = screen.getByRole("dialog", { name: "Versão 1 · 10/03/2026" });
    expect(within(antiga).getByText("Sim — Penicilina")).toBeTruthy();
    expect(within(antiga).getByText("Asma leve")).toBeTruthy();
    expect(within(antiga).queryAllByRole("textbox")).toHaveLength(0);
    expect(within(antiga).queryAllByRole("radio")).toHaveLength(0);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    ver(2); // a vigente é outra: não traz a alergia da antiga
    const vigente = screen.getByRole("dialog", { name: "Versão 2 · 30/09/2026" });
    expect(within(vigente).queryByText("Sim — Penicilina")).toBeNull();
  });

  it("acompanha a coleção: cada versão gravada entra na lista, e a vigente passa para a nova", () => {
    anamneses.substituirTudo([versao("a", "p1", "2026-03-10")]);
    render(<HistoricoDeVersoes pacienteId="p1" />);
    expect(linhas()).toHaveLength(1);

    act(() => anamneses.salvar(versao("b", "p1", "2026-09-30")));

    expect(linhas()).toHaveLength(2);
    expect(within(linhas()[0]).getByText("Versão 2")).toBeTruthy();
    expect(within(linhas()[0]).getByText("Vigente")).toBeTruthy();
    expect(within(linhas()[1]).queryByText("Vigente")).toBeNull();
  });
});
