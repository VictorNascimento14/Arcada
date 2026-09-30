import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { clinica, CLINICA_ID } from "@/dados/colecoes";
import type { Expediente } from "@/dominio";

import ExpedienteDaClinica from "./Expediente";

const MANHA = { inicio: "08:00", fim: "12:00" };
const TARDE = { inicio: "13:30", fim: "18:00" };
const EXPEDIENTE: Expediente = { 0: [], 1: [MANHA, TARDE], 2: [MANHA, TARDE], 3: [], 4: [], 5: [], 6: [MANHA] };

const dia = (nome: string) => within(screen.getByRole("group", { name: nome }));
const campo = (nome: string, rotulo: string) => dia(nome).getByLabelText(rotulo) as HTMLInputElement;
const digitar = (nome: string, rotulo: string, valor: string) => fireEvent.change(campo(nome, rotulo), { target: { value: valor } });
const salvar = () => fireEvent.click(screen.getByRole("button", { name: "Salvar expediente" }));

beforeEach(() => {
  localStorage.clear();
  clinica.substituirTudo([{ id: CLINICA_ID, nome: "Clínica Exemplo", expediente: EXPEDIENTE }]);
});

describe("ExpedienteDaClinica", () => {
  it("abre com o expediente salvo: os sete dias, de segunda a domingo, abertos com os horários ou fechados", () => {
    render(<ExpedienteDaClinica />);

    expect(screen.getAllByRole("group").map((g) => g.querySelector("p")?.textContent)).toEqual([
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
      "Domingo",
    ]);
    expect(campo("Segunda-feira", "Abertura").value).toBe("08:00");
    expect(campo("Segunda-feira", "Início do intervalo").value).toBe("12:00");
    expect(campo("Segunda-feira", "Fim do intervalo").value).toBe("13:30");
    expect(campo("Segunda-feira", "Fechamento").value).toBe("18:00");
    expect(campo("Sábado", "Fechamento").value).toBe("12:00");
    expect((dia("Domingo").getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
    expect(dia("Domingo").queryByLabelText("Abertura")).toBeNull(); // dia fechado não mostra horários
  });

  it("salva a edição: muda um horário, abre o domingo e fecha a terça, sem tocar nos dados da clínica", () => {
    render(<ExpedienteDaClinica />);

    digitar("Segunda-feira", "Fechamento", "17:00");
    fireEvent.click(dia("Terça-feira").getByRole("checkbox"));
    fireEvent.click(dia("Domingo").getByRole("checkbox"));
    digitar("Domingo", "Fechamento", "12:00"); // o horário sugerido, 08:00 às 18:00, já vem preenchido
    salvar();

    expect(clinica.obter(CLINICA_ID)).toEqual({
      id: CLINICA_ID,
      nome: "Clínica Exemplo",
      expediente: { 0: [MANHA], 1: [MANHA, { inicio: "13:30", fim: "17:00" }], 2: [], 3: [], 4: [], 5: [], 6: [MANHA] },
    });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("horário errado mostra o erro no dia, avisa e não grava nada", () => {
    render(<ExpedienteDaClinica />);

    fireEvent.click(dia("Quarta-feira").getByRole("checkbox")); // abre com 08:00 às 18:00
    digitar("Quarta-feira", "Fechamento", "07:00");
    digitar("Segunda-feira", "Fim do intervalo", "19:00"); // passa do fechamento
    salvar();

    expect(dia("Quarta-feira").getByText("Deve ser depois da abertura.")).toBeTruthy();
    expect(dia("Terça-feira").queryByText(/Deve ser|intervalo deve/)).toBeNull(); // o dia certo não recebe erro
    expect(dia("Segunda-feira").getByText("O intervalo deve ficar dentro do horário de atendimento.")).toBeTruthy();
    expect(campo("Quarta-feira", "Fechamento").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toContain("Revise");
    expect(clinica.obter(CLINICA_ID)!.expediente).toEqual(EXPEDIENTE);
  });
});
