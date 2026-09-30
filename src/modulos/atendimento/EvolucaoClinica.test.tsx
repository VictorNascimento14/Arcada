import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { consultas, profissionais } from "@/dados/colecoes";
import type { Consulta } from "@/dominio";
import { dataBR } from "@/modulos/pacientes/exibicao";
import { diaISO } from "@/ui";

import { evolucoes } from "./dados";
import EvolucaoClinica from "./EvolucaoClinica";

const HOJE = diaISO(new Date());
const CONSULTA: Consulta = {
  id: "c1",
  pacienteId: "pac1",
  profissionalId: "pr1",
  cadeiraId: "cad1",
  inicio: `${HOJE}T09:00`,
  duracaoMin: 30,
  situacao: "em-atendimento",
};

beforeEach(() => {
  profissionais.substituirTudo([{ id: "pr1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#0f766e" }]);
  consultas.substituirTudo([CONSULTA]);
  evolucoes.substituirTudo([]);
});

const campo = () => screen.getByRole("textbox", { name: "Evolução" }) as HTMLTextAreaElement;
const botao = () => screen.getByRole("button", { name: "Registrar evolução" }) as HTMLButtonElement;
const escrever = (texto: string) => fireEvent.change(campo(), { target: { value: texto } });

describe("cartão Evolução clínica", () => {
  it("o campo nasce vazio e sem texto sugerido, e o botão espera algo escrito", () => {
    render(<EvolucaoClinica consultaId="c1" />);

    expect(campo().value).toBe("");
    expect(campo().placeholder).toBe("");
    expect(botao().disabled).toBe(true);
    expect(screen.getByText("Nenhuma evolução registrada nesta consulta.")).toBeTruthy();

    escrever("   ");
    expect(botao().disabled).toBe(true);
    escrever("Texto.");
    expect(botao().disabled).toBe(false);
  });

  it("registrar grava a evolução, limpa o campo e a mostra com o dia e o profissional", () => {
    render(<EvolucaoClinica consultaId="c1" />);
    escrever("Primeira linha.\nSegunda linha.");
    fireEvent.click(botao());

    expect(evolucoes.listar()).toHaveLength(1);
    expect(evolucoes.listar()[0]).toMatchObject({ consultaId: "c1", profissionalId: "pr1", dia: HOJE, texto: "Primeira linha.\nSegunda linha." });
    expect(campo().value).toBe("");
    expect(screen.getByText(`${dataBR(HOJE)} · Dra. Exemplo`)).toBeTruthy();
    expect(screen.getByText(/Primeira linha\.\s+Segunda linha\./).className).toContain("whitespace-pre-wrap");
    expect(screen.queryByText("Nenhuma evolução registrada nesta consulta.")).toBeNull();
  });

  it("lista só as evoluções desta consulta, da mais recente à mais antiga", () => {
    const base = { pacienteId: "pac1", profissionalId: "pr1", dia: "2026-09-30" };
    evolucoes.substituirTudo([
      { ...base, id: "e1", consultaId: "c1", texto: "Primeira." },
      { ...base, id: "e2", consultaId: "outra", texto: "De outra consulta." },
      { ...base, id: "e3", consultaId: "c1", texto: "Segunda." },
    ]);
    render(<EvolucaoClinica consultaId="c1" />);

    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "30/09/2026 · Dra. ExemploSegunda.",
      "30/09/2026 · Dra. ExemploPrimeira.",
    ]);
  });

  it("a recusa da regra (consulta que saiu de atendimento) não grava e mantém o texto digitado", () => {
    render(<EvolucaoClinica consultaId="c1" />);
    escrever("Texto que não pode se perder.");
    consultas.substituirTudo([{ ...CONSULTA, situacao: "concluida" }]);
    fireEvent.click(botao());

    expect(evolucoes.listar()).toEqual([]);
    expect(campo().value).toBe("Texto que não pode se perder.");
  });
});
