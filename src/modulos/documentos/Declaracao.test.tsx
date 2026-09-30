import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clinica, CLINICA_ID, consultas, pacientes, profissionais } from "@/dados/colecoes";
import type { Consulta, Expediente, Paciente, Profissional, SituacaoConsulta } from "@/dominio";

import Declaracao from "./Declaracao";

const FECHADA: Expediente = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
// Fictícios, sem CPF: DDD 00 não existe.
const ANA: Paciente = { id: "p1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002" };
const BIA: Paciente = { id: "p2", nome: "Bianca Exemplo", nascimento: "1990-06-12", telefone: "(00) 90000-0003" };
const DRA: Profissional = { id: "d1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b" };
const ANTIGO: Profissional = { id: "d2", nome: "Dr. Antigo", cro: "CRO-SP 00009", cor: "#4a6fa5", ativo: false };

const consulta = (id: string, pacienteId: string, inicio: string, duracaoMin: number, situacao: SituacaoConsulta): Consulta => ({
  id,
  pacienteId,
  profissionalId: "d1",
  cadeiraId: "c1",
  inicio,
  duracaoMin,
  situacao,
});

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
  consultas.substituirTudo([
    consulta("c1", "p1", "2026-09-10T08:00", 60, "concluida"),
    consulta("c2", "p1", "2026-09-30T14:30", 45, "confirmada"), // a mais recente
    consulta("c3", "p1", "2026-09-20T09:00", 30, "faltou"), // o paciente não veio
    consulta("c4", "p1", "2026-09-25T09:00", 30, "cancelada"), // não houve
    consulta("c5", "p2", "2026-09-15T10:00", 60, "concluida"), // de outro paciente
  ]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  pacientes.substituirTudo([]);
  profissionais.substituirTudo([]);
  clinica.substituirTudo([]);
  consultas.substituirTudo([]);
});

describe("Declaracao", () => {
  it("abre em branco: a data de hoje, sem horário e sem consulta para escolher antes do paciente", () => {
    render(<Declaracao />);

    expect(campo("Data").value).toBe("2026-09-30");
    expect(campo("Hora de início").value).toBe("");
    expect(campo("Hora de fim").value).toBe("");
    expect(opcoes("Profissional")).toEqual(["Escolha o profissional", "Dra. Exemplo"]); // o inativo não aparece
    expect(opcoes("Consulta do paciente")).toEqual(["Escolha o paciente primeiro"]);
    expect(campo("Consulta do paciente").disabled).toBe(true);
  });

  it("depois de escolher o paciente lista as consultas dele, da mais recente à mais antiga, sem faltas nem canceladas", () => {
    render(<Declaracao />);

    preencher("Paciente", "p1");

    expect(opcoes("Consulta do paciente")).toEqual([
      "Preencher a partir de uma consulta",
      "30/09/2026 · 14:30 às 15:15 · Confirmada",
      "10/09/2026 · 08:00 às 09:00 · Concluída",
    ]);
  });

  it("escolher uma consulta preenche a data e as horas, que seguem editáveis; trocar de paciente solta a consulta", () => {
    render(<Declaracao />);
    preencher("Paciente", "p1");

    preencher("Consulta do paciente", "c1");
    expect(campo("Data").value).toBe("2026-09-10");
    expect(campo("Hora de início").value).toBe("08:00");
    expect(campo("Hora de fim").value).toBe("09:00");

    preencher("Hora de fim", "08:45");
    expect(campo("Hora de fim").value).toBe("08:45");

    preencher("Paciente", "p2"); // a consulta escolhida era da Ana
    expect(campo("Consulta do paciente").value).toBe("");
    expect(opcoes("Consulta do paciente")).toEqual(["Preencher a partir de uma consulta", "15/09/2026 · 10:00 às 11:00 · Concluída"]);
    expect(campo("Data").value).toBe("2026-09-10"); // o que foi preenchido fica
  });

  it("paciente sem consulta: a lista fica desabilitada e o horário se digita", () => {
    consultas.substituirTudo([]);
    render(<Declaracao />);

    preencher("Paciente", "p1");

    expect(opcoes("Consulta do paciente")).toEqual(["Nenhuma consulta deste paciente"]);
    expect(campo("Consulta do paciente").disabled).toBe(true);
    preencher("Hora de início", "08:00");
    expect(campo("Hora de início").value).toBe("08:00");
  });

  it("sem preencher nada, Imprimir aponta o que falta em cada campo e não abre a impressão", () => {
    render(<Declaracao />);

    imprimir();

    expect(screen.getByText("Escolha o paciente.")).toBeTruthy();
    expect(screen.getByText("Escolha o profissional.")).toBeTruthy();
    expect(screen.getByText("Informe a hora de início.")).toBeTruthy();
    expect(screen.getByText("Informe a hora de fim.")).toBeTruthy();
    expect(campo("Hora de fim").getAttribute("aria-invalid")).toBe("true");
    expect(impressoes).toHaveLength(0);
    expect(folha()).toBeNull();
  });

  it("o fim antes do início é recusado na hora de fim", () => {
    render(<Declaracao />);
    preencher("Paciente", "p1");
    preencher("Profissional", "d1");
    preencher("Hora de início", "09:00");
    preencher("Hora de fim", "08:00");

    imprimir();

    expect(screen.getByRole("alert").textContent).toBe("O fim tem de ser depois do início.");
    expect(campo("Hora de fim").getAttribute("aria-invalid")).toBe("true");
    expect(impressoes).toHaveLength(0);
  });

  it("Imprimir abre só a folha: cabeçalho da clínica, a declaração com paciente, dia e horário, e a linha de assinatura com nome e CRO", () => {
    render(<Declaracao />);
    expect(folha()).toBeNull(); // fora da impressão a folha não existe
    preencher("Paciente", "p1");
    preencher("Profissional", "d1");
    preencher("Consulta do paciente", "c1");

    imprimir();

    expect(impressoes).toHaveLength(1);
    expect(impressoes[0].modo).toBe("clone");
    expect(impressoes[0].folha).toBeTruthy(); // a folha já estava no body quando o navegador foi chamado
    const dela = within(folha()!);
    expect(dela.getByText("Clínica Exemplo")).toBeTruthy();
    expect(dela.getByRole("heading", { level: 1, name: "Declaração de comparecimento" })).toBeTruthy();
    expect(
      dela.getByText((_, el) => el?.tagName === "P" && el.textContent === "Declaro que Ana Beatriz Moura compareceu a esta clínica no dia 10/09/2026, das 08:00 às 09:00."),
    ).toBeTruthy();
    expect(dela.getByRole("separator")).toBeTruthy();
    expect(dela.getByText("Dra. Exemplo")).toBeTruthy();
    expect(dela.getByText("CRO-SP 00000")).toBeTruthy();
    expect(folha()!.textContent).not.toMatch(/90000-0002|Bianca|Antigo|Confirmada|Concluída/); // nada além do nome do paciente e de quem assina
  });

  it("depois da impressão a folha some e o formulário segue preenchido, para imprimir outra via", () => {
    render(<Declaracao />);
    preencher("Paciente", "p2");
    preencher("Profissional", "d1");
    preencher("Hora de início", "10:00");
    preencher("Hora de fim", "11:00");
    imprimir();

    depoisDeImprimir();
    expect(folha()).toBeNull();
    expect(document.body.dataset.printMode).toBeUndefined();
    expect(campo("Hora de fim").value).toBe("11:00");

    imprimir();
    expect(impressoes).toHaveLength(2);
    expect(within(folha()!).getByText("Bianca Exemplo")).toBeTruthy();
  });
});
