import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pacientes } from "@/dados/colecoes";
import type { Paciente } from "@/dominio";
import { assinarToasts, type Toast } from "@/ui";

import { anamneses, salvarAnamnese } from "./dados";
import FormularioAnamnese from "./FormularioAnamnese";
import { PERGUNTAS, SECOES, type Respostas } from "./questionario";

// Fictícios, sem CPF.
const ANA: Paciente = { id: "p1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(11) 90000-0002" };
const BRUNO: Paciente = { id: "p2", nome: "Bruno Exemplo", nascimento: "1990-06-12", telefone: "(11) 90000-0003" };

const simNao = PERGUNTAS.filter((p) => p.tipo === "simNao");
const MINIMAS = Object.fromEntries(simNao.map((p) => [p.id, { sim: false }])) as Respostas;

const pergunta = (rotulo: string) => screen.getByRole("group", { name: rotulo });
const responder = (rotulo: string, resposta: "Sim" | "Não") => fireEvent.click(within(pergunta(rotulo)).getByLabelText(resposta));
const salvar = () => fireEvent.click(screen.getByRole("button", { name: "Salvar anamnese" }));
const rotulo = (id: string) => PERGUNTAS.find((p) => p.id === id)!.rotulo;
const responderTudoNao = () => simNao.forEach((p) => responder(p.rotulo, "Não"));

let avisos: Toast[];
let cancelar: () => void;

beforeEach(() => {
  localStorage.clear();
  pacientes.substituirTudo([ANA, BRUNO]);
  anamneses.substituirTudo([]);
  vi.useFakeTimers({ toFake: ["Date"] }); // só o `Date`: o resto segue real
  vi.setSystemTime(new Date(2026, 8, 30, 12));
  avisos = [];
  cancelar = assinarToasts((t) => avisos.push(t));
});

afterEach(() => {
  cancelar();
  vi.useRealTimers();
  pacientes.substituirTudo([]);
  anamneses.substituirTudo([]);
});

describe("FormularioAnamnese", () => {
  it("mostra as cinco seções com as perguntas do questionário, ainda sem resposta", () => {
    render(<FormularioAnamnese pacienteId="p1" />);

    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(SECOES.map((s) => s.titulo));
    expect(screen.getAllByRole("group")).toHaveLength(simNao.length);
    expect(screen.queryAllByRole("radio", { checked: true })).toHaveLength(0);
    for (const p of PERGUNTAS.filter((x) => x.tipo === "texto")) expect(screen.getByLabelText(p.rotulo)).toBeTruthy();
    expect(screen.getByText(/Nenhuma anamnese registrada/)).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Alertas da anamnese" })).toBeNull();
  });

  it("o detalhe só aparece no sim, e o que se digitou antes de mudar para não não é gravado", () => {
    render(<FormularioAnamnese pacienteId="p1" />);
    expect(within(pergunta(rotulo("alergia"))).queryByLabelText("A quê?")).toBeNull();

    responder(rotulo("alergia"), "Sim");
    fireEvent.change(within(pergunta(rotulo("alergia"))).getByLabelText("A quê?"), { target: { value: "  Penicilina " } });
    responder(rotulo("alergia"), "Não");
    expect(within(pergunta(rotulo("alergia"))).queryByLabelText("A quê?")).toBeNull();
    expect(within(pergunta(rotulo("diabetes"))).queryByLabelText(/qual|quê|onde/i)).toBeNull(); // sem campo de detalhe no questionário

    responderTudoNao();
    salvar();
    expect(anamneses.listar()[0].respostas.alergia).toEqual({ sim: false });
  });

  it("com pergunta sim/não sem resposta, não grava: mostra o erro na pergunta e foca a primeira", () => {
    render(<FormularioAnamnese pacienteId="p1" />);
    responder(rotulo("diabetes"), "Não");

    salvar();

    expect(anamneses.listar()).toEqual([]);
    expect(within(pergunta(rotulo("tratamentoMedico"))).getByText("Responda sim ou não.")).toBeTruthy();
    expect(within(pergunta(rotulo("diabetes"))).queryByText("Responda sim ou não.")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain(`faltam ${simNao.length - 1}`);
    expect(document.activeElement).toBe(within(pergunta(rotulo("tratamentoMedico"))).getByLabelText("Sim"));
    expect(avisos).toEqual([]);
  });

  it("grava a versão de hoje com as respostas e o detalhe, avisa e mostra a data da última versão", () => {
    render(<FormularioAnamnese pacienteId="p1" />);
    responderTudoNao();
    responder(rotulo("alergia"), "Sim");
    fireEvent.change(screen.getByLabelText("A quê?"), { target: { value: "Látex" } });
    fireEvent.change(screen.getByLabelText(rotulo("motivoDaConsulta")), { target: { value: "Revisão" } });

    salvar();

    const [versao] = anamneses.listar();
    expect(versao).toMatchObject({ pacienteId: "p1", data: "2026-09-30" });
    expect(versao.respostas).toMatchObject({ alergia: { sim: true, detalhe: "Látex" }, diabetes: { sim: false }, motivoDaConsulta: "Revisão" });
    expect(avisos).toMatchObject([{ titulo: "Anamnese salva", corpo: "Versão de 30/09/2026." }]);
    expect(screen.getByText(/Última versão: 30\/09\/2026/)).toBeTruthy();
  });

  it("abre com as respostas da última versão, e salvar de novo grava outra sem apagar a anterior", () => {
    salvarAnamnese("p1", { ...MINIMAS, gestante: { sim: true }, outrosProblemas: "Asma leve" });
    render(<FormularioAnamnese pacienteId="p1" />);

    expect((within(pergunta(rotulo("gestante"))).getByLabelText("Sim") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(rotulo("outrosProblemas")) as HTMLInputElement).value).toBe("Asma leve");

    responder(rotulo("gestante"), "Não");
    salvar();

    const versoes = anamneses.listar();
    expect(versoes).toHaveLength(2);
    expect(versoes[0].respostas.gestante).toEqual({ sim: true });
    expect(versoes[1].respostas).toMatchObject({ gestante: { sim: false }, outrosProblemas: "Asma leve" });
  });

  it("trocar de paciente na mesma tela não leva o que foi digitado, e cada um abre com a sua anamnese", () => {
    salvarAnamnese("p2", { ...MINIMAS, diabetes: { sim: true } });
    const { rerender } = render(<FormularioAnamnese pacienteId="p1" />);
    responder(rotulo("hipertensao"), "Sim");

    rerender(<FormularioAnamnese pacienteId="p2" />);

    expect((within(pergunta(rotulo("hipertensao"))).getByLabelText("Sim") as HTMLInputElement).checked).toBe(false);
    expect((within(pergunta(rotulo("diabetes"))).getByLabelText("Sim") as HTMLInputElement).checked).toBe(true);
  });

  it("se a gravação for recusada (paciente removido), avisa que não salvou", () => {
    render(<FormularioAnamnese pacienteId="p1" />);
    responderTudoNao();
    pacientes.substituirTudo([BRUNO]);

    salvar();

    expect(screen.getByRole("alert").textContent).toContain("Não foi possível salvar");
    expect(anamneses.listar()).toEqual([]);
    expect(avisos).toEqual([]);
  });

  it("mostra no topo os alertas da última versão salva: o que está só no rascunho não conta até salvar", () => {
    salvarAnamnese("p1", { ...MINIMAS, alergia: { sim: true, detalhe: "Látex" } });
    render(<FormularioAnamnese pacienteId="p1" />);
    const alertas = () =>
      within(screen.getByRole("list", { name: "Alertas da anamnese" }))
        .getAllByRole("listitem")
        .map((li) => li.textContent);
    expect(alertas()).toEqual(["Alergia informada: Látex"]);

    responder(rotulo("gestante"), "Sim");
    expect(alertas()).toEqual(["Alergia informada: Látex"]);

    salvar();
    expect(alertas()).toEqual(["Alergia informada: Látex", "Gestante"]);
  });

  it("o histórico só aparece com versão gravada e ganha uma a cada salvamento", () => {
    render(<FormularioAnamnese pacienteId="p1" />);
    expect(screen.queryByRole("heading", { name: "Histórico de versões" })).toBeNull();

    responderTudoNao();
    salvar();
    expect(screen.getByRole("heading", { name: "Histórico de versões" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ver respostas da versão 1" })).toBeTruthy();

    salvar();
    expect(screen.getByRole("button", { name: "Ver respostas da versão 2" })).toBeTruthy();
  });
});
