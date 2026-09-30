import { act, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { clinica, CLINICA_ID } from "@/dados/colecoes";
import type { Clinica } from "@/dominio";

import FolhaImpressa from "./FolhaImpressa";

const FECHADA: Clinica["expediente"] = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
// Fictícios: DDD 00 não existe.
const COMPLETA: Clinica = {
  id: CLINICA_ID,
  nome: "Clínica Exemplo",
  telefone: "(00) 90000-0001",
  endereco: "Rua Exemplo, 100",
  cidade: "São Paulo",
  uf: "SP",
  expediente: FECHADA,
};
const DRA = { nome: "Dra. Exemplo", cro: "CRO-SP 00000" };

const folha = () => document.querySelector<HTMLElement>("body > [data-print-clone]")!;
const desenhar = () =>
  render(
    <FolhaImpressa titulo="Receituário" profissional={DRA}>
      <p>Corpo do documento</p>
    </FolhaImpressa>,
  );

beforeEach(() => {
  localStorage.clear();
  clinica.substituirTudo([COMPLETA]);
});

afterEach(() => clinica.substituirTudo([]));

describe("FolhaImpressa", () => {
  it("vai para o body, em preto no branco: cabeçalho da clínica, título, corpo e a linha de assinatura com nome e CRO", () => {
    const { container } = desenhar();

    expect(container.firstChild).toBeNull(); // não fica na árvore da tela: é portal
    const dela = within(folha());
    expect(folha().classList.contains("text-black") && folha().classList.contains("bg-white")).toBe(true);
    expect(dela.getByText("Clínica Exemplo")).toBeTruthy();
    expect(dela.getByText("Rua Exemplo, 100 — São Paulo/SP")).toBeTruthy();
    expect(dela.getByText("Tel. (00) 90000-0001")).toBeTruthy();
    expect(dela.getByRole("heading", { level: 1, name: "Receituário" })).toBeTruthy();
    expect(dela.getByText("Corpo do documento")).toBeTruthy();
    expect(dela.getByText("Dra. Exemplo")).toBeTruthy();
    expect(dela.getByText("CRO-SP 00000")).toBeTruthy();

    // a linha vem antes do nome (é acima dela que se assina) e o corpo antes de tudo isso
    const linha = dela.getByRole("separator");
    const seguinte = (a: Node, b: Node) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
    expect(seguinte(dela.getByText("Corpo do documento"), linha)).toBeTruthy();
    expect(seguinte(linha, dela.getByText("Dra. Exemplo"))).toBeTruthy();
  });

  it("clínica só com o nome: cabeçalho sem endereço nem telefone; endereço e cidade/UF não deixam separador sobrando", () => {
    clinica.substituirTudo([{ id: CLINICA_ID, nome: "Clínica Exemplo", expediente: FECHADA }]);
    desenhar();
    expect(within(folha()).getByText("Clínica Exemplo")).toBeTruthy();
    expect(folha().textContent).not.toMatch(/Tel\.|—/);

    act(() => clinica.salvar({ id: CLINICA_ID, nome: "Clínica Exemplo", cidade: "São Paulo", expediente: FECHADA }));
    expect(within(folha()).getByText("São Paulo")).toBeTruthy(); // sem "/UF" nem "—"

    act(() => clinica.salvar({ id: CLINICA_ID, nome: "Clínica Exemplo", endereco: "Rua Exemplo, 100", uf: "SP", expediente: FECHADA }));
    expect(within(folha()).getByText("Rua Exemplo, 100 — SP")).toBeTruthy();
  });

  it("acompanha o cadastro da clínica e, sem clínica, sai sem cabeçalho, mas com o resto", () => {
    desenhar();

    act(() => clinica.salvar({ ...COMPLETA, telefone: "(00) 90000-0009" }));
    expect(within(folha()).getByText("Tel. (00) 90000-0009")).toBeTruthy();

    act(() => clinica.substituirTudo([]));
    expect(folha().querySelector("header")).toBeNull();
    expect(within(folha()).getByRole("heading", { level: 1, name: "Receituário" })).toBeTruthy();
    expect(within(folha()).getByText("CRO-SP 00000")).toBeTruthy();
  });

  it("sai do body quando a tela sai", () => {
    const { unmount } = desenhar();
    expect(folha()).toBeTruthy();

    unmount();

    expect(document.querySelector("body > [data-print-clone]")).toBeNull();
  });
});
