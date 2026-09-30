import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pacientes } from "@/dados/colecoes";
import type { Paciente } from "@/dominio";

import { anamneses, type Anamnese } from "./dados";
import HistoricoDeVersoes from "./HistoricoDeVersoes";
import { PERGUNTAS, type Respostas } from "./questionario";

// Fictício, sem CPF.
const ANA: Paciente = { id: "p1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(11) 90000-0002" };

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
  pacientes.substituirTudo([ANA]);
  anamneses.substituirTudo([]);
});

afterEach(() => {
  vi.restoreAllMocks();
  pacientes.substituirTudo([]);
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

describe("impressão", () => {
  /** O que havia na tela no instante em que o navegador foi chamado para imprimir. */
  let impressoes: { modo?: string; folha?: string | null }[];

  const folha = () => document.querySelector<HTMLElement>("body > [data-print-clone]");
  const imprimir = (numero: number) => fireEvent.click(screen.getByRole("button", { name: `Imprimir a versão ${numero}` }));
  const depoisDeImprimir = () => act(() => void window.dispatchEvent(new Event("afterprint")));

  beforeEach(() => {
    impressoes = [];
    vi.spyOn(window, "print").mockImplementation(() =>
      impressoes.push({ modo: document.body.dataset.printMode, folha: folha()?.textContent }),
    );
    anamneses.substituirTudo([
      versao("a", "p1", "2026-03-10", { alergia: { sim: true, detalhe: "Penicilina" } }),
      versao("b", "p1", "2026-09-30"),
    ]);
  });

  it("imprime a versão escolhida: folha no body, no modo de impressão do kit, com nome, data, versão, respostas e a linha de assinatura", () => {
    render(<HistoricoDeVersoes pacienteId="p1" />);
    expect(folha()).toBeNull(); // fora da impressão a folha não existe

    imprimir(1);

    expect(impressoes).toHaveLength(1);
    expect(impressoes[0].modo).toBe("clone");
    expect(impressoes[0].folha).toBeTruthy(); // a folha já estava no body quando o navegador foi chamado
    const dela = within(folha()!);
    expect(dela.getByRole("heading", { level: 1, name: "Anamnese" })).toBeTruthy();
    expect(dela.getByText("Ana Beatriz Moura")).toBeTruthy();
    expect(dela.getByText("Data: 10/03/2026 · Versão 1")).toBeTruthy();
    expect(dela.getByText("Sim — Penicilina")).toBeTruthy(); // a versão 1, e não a vigente
    expect(dela.getAllByRole("term")).toHaveLength(PERGUNTAS.length); // todas as perguntas, respondidas ou não
    expect(dela.getByText("Assinatura do paciente")).toBeTruthy();
    expect(folha()!.textContent).not.toMatch(/CPF|telefone|\(11\)/i);
  });

  it("depois da impressão a folha some e o modo de impressão é desligado; dá para imprimir outra versão em seguida", () => {
    render(<HistoricoDeVersoes pacienteId="p1" />);
    imprimir(1);

    depoisDeImprimir();
    expect(folha()).toBeNull();
    expect(document.body.dataset.printMode).toBeUndefined();

    imprimir(2);
    expect(impressoes).toHaveLength(2);
    expect(within(folha()!).getByText("Data: 30/09/2026 · Versão 2")).toBeTruthy();
    expect(within(folha()!).queryByText("Sim — Penicilina")).toBeNull();
  });

  it("imprimir a mesma versão duas vezes seguidas, mesmo sem o `afterprint`, abre a impressão nas duas", () => {
    render(<HistoricoDeVersoes pacienteId="p1" />);

    imprimir(2);
    imprimir(2);

    expect(impressoes).toHaveLength(2);
    expect(document.querySelectorAll("body > [data-print-clone]")).toHaveLength(1);
  });

  it("ao sair da tela com a folha montada, não deixa o modo de impressão ligado", () => {
    const { unmount } = render(<HistoricoDeVersoes pacienteId="p1" />);
    imprimir(1);
    expect(document.body.dataset.printMode).toBe("clone");

    unmount();

    expect(document.body.dataset.printMode).toBeUndefined();
    expect(folha()).toBeNull();
  });
});

