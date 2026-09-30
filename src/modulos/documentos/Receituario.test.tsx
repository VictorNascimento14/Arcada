import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clinica, CLINICA_ID, pacientes, profissionais } from "@/dados/colecoes";
import type { Expediente, Paciente, Profissional } from "@/dominio";

import Receituario from "./Receituario";

const FECHADA: Expediente = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
// Fictícios, sem CPF: DDD 00 não existe.
const ANA: Paciente = { id: "p1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002" };
const BIA: Paciente = { id: "p2", nome: "Bianca Exemplo", nascimento: "1990-06-12", telefone: "(00) 90000-0003" };
const DRA: Profissional = { id: "d1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b" };
const ANTIGO: Profissional = { id: "d2", nome: "Dr. Antigo", cro: "CRO-SP 00009", cor: "#4a6fa5", ativo: false };

/** O que havia na tela no instante em que o navegador foi chamado para imprimir. */
let impressoes: { modo?: string; folha?: string | null }[];

const folha = () => document.querySelector<HTMLElement>("body > [data-print-clone]");
const campo = (rotulo: string) => screen.getByLabelText(rotulo) as HTMLInputElement;
const preencher = (rotulo: string, valor: string) => fireEvent.change(campo(rotulo), { target: { value: valor } });
const imprimir = () => fireEvent.click(screen.getByRole("button", { name: "Imprimir" }));
const depoisDeImprimir = () => act(() => void window.dispatchEvent(new Event("afterprint")));
const opcoes = (rotulo: string) => within(campo(rotulo)).getAllByRole("option").map((o) => o.textContent);

beforeEach(() => {
  localStorage.clear();
  // À noite, no Brasil, a data em UTC já é a do dia seguinte: o dia de hoje tem de ser o local.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 30, 22, 30));
  impressoes = [];
  vi.spyOn(window, "print").mockImplementation(() =>
    impressoes.push({ modo: document.body.dataset.printMode, folha: folha()?.textContent }),
  );
  pacientes.substituirTudo([BIA, ANA]);
  profissionais.substituirTudo([DRA, ANTIGO]);
  clinica.substituirTudo([{ id: CLINICA_ID, nome: "Clínica Exemplo", telefone: "(00) 90000-0001", expediente: FECHADA }]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  pacientes.substituirTudo([]);
  profissionais.substituirTudo([]);
  clinica.substituirTudo([]);
});

describe("Receituario", () => {
  it("abre em branco: a data de hoje, o texto vazio e só os profissionais ativos para escolher", () => {
    render(<Receituario />);

    expect(campo("Data").value).toBe("2026-09-30");
    expect(campo("Texto do receituário").value).toBe(""); // nenhum medicamento, dose ou conduta pré-preenchidos
    expect(opcoes("Paciente")).toEqual(["Escolha o paciente", "Ana Beatriz Moura", "Bianca Exemplo"]); // em ordem alfabética
    expect(opcoes("Profissional")).toEqual(["Escolha o profissional", "Dra. Exemplo"]); // o inativo não aparece
  });

  it("sem preencher nada, Imprimir aponta o que falta em cada campo e não abre a impressão", () => {
    render(<Receituario />);
    preencher("Data", "");

    imprimir();

    expect(screen.getByText("Escolha o paciente.")).toBeTruthy();
    expect(screen.getByText("Escolha o profissional.")).toBeTruthy();
    expect(screen.getByText("Informe a data.")).toBeTruthy();
    expect(screen.getByText("Escreva o texto do receituário.")).toBeTruthy();
    expect(campo("Texto do receituário").getAttribute("aria-invalid")).toBe("true");
    expect(impressoes).toHaveLength(0);
    expect(folha()).toBeNull();
  });

  it("Imprimir abre só a folha: cabeçalho da clínica, paciente, data, o texto com as quebras e a linha de assinatura com nome e CRO", () => {
    render(<Receituario />);
    expect(folha()).toBeNull(); // fora da impressão a folha não existe
    preencher("Paciente", "p1");
    preencher("Profissional", "d1");
    preencher("Data", "2026-10-05");
    preencher("Texto do receituário", "Primeira linha\nSegunda linha");

    imprimir();

    expect(impressoes).toHaveLength(1);
    expect(impressoes[0].modo).toBe("clone");
    expect(impressoes[0].folha).toBeTruthy(); // a folha já estava no body quando o navegador foi chamado
    const dela = within(folha()!);
    expect(dela.getByText("Clínica Exemplo")).toBeTruthy();
    expect(dela.getByRole("heading", { level: 1, name: "Receituário" })).toBeTruthy();
    expect(dela.getByText("Ana Beatriz Moura")).toBeTruthy();
    expect(dela.getByText("Data: 05/10/2026")).toBeTruthy();
    expect(folha()!.querySelector("p.whitespace-pre-wrap")!.textContent).toBe("Primeira linha\nSegunda linha");
    expect(dela.getByRole("separator")).toBeTruthy();
    expect(dela.getByText("Dra. Exemplo")).toBeTruthy();
    expect(dela.getByText("CRO-SP 00000")).toBeTruthy();
    expect(folha()!.textContent).not.toMatch(/90000-0002|Bianca|Antigo/); // nada além do nome do paciente e de quem assina
  });

  it("depois da impressão a folha some e o formulário segue preenchido, para imprimir outra via", () => {
    render(<Receituario />);
    preencher("Paciente", "p2");
    preencher("Profissional", "d1");
    preencher("Texto do receituário", "Texto de teste");
    imprimir();

    depoisDeImprimir();
    expect(folha()).toBeNull();
    expect(document.body.dataset.printMode).toBeUndefined();
    expect(campo("Texto do receituário").value).toBe("Texto de teste");

    imprimir();
    expect(impressoes).toHaveLength(2);
    expect(within(folha()!).getByText("Bianca Exemplo")).toBeTruthy();
  });
});
