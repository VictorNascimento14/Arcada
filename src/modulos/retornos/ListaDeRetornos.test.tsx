import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { consultas, pacientes, planos } from "@/dados/colecoes";
import type { Consulta, Paciente } from "@/dominio";

import ListaDeRetornos from "./ListaDeRetornos";

const paciente = (id: string, nome: string): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "" });
/** Consulta concluída em `dia`: o retorno cai 6 meses depois. */
const atendida = (pacienteId: string, dia: string): Consulta => ({
  id: `c-${pacienteId}`,
  pacienteId,
  profissionalId: "prof",
  cadeiraId: "cad",
  inicio: `${dia}T09:00`,
  duracaoMin: 30,
  situacao: "concluida",
});

const abrir = () =>
  render(
    <MemoryRouter>
      <ListaDeRetornos />
    </MemoryRouter>,
  );
/** O cartão de uma seção, achado pelo título. */
const cartao = (titulo: string) => within(screen.getByRole("heading", { name: titulo }).parentElement as HTMLElement);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 30, 12)); // 30/09/2026
  pacientes.substituirTudo([paciente("ana", "Ana Exemplo"), paciente("bia", "Bia Exemplo"), paciente("caio", "Caio Exemplo"), paciente("dani", "Dani Exemplo"), paciente("edu", "Edu Exemplo")]);
  consultas.substituirTudo([]);
  planos.substituirTudo([]);
});
afterEach(() => vi.useRealTimers());

describe("lista de retornos", () => {
  it("põe os vencidos e os a vencer cada um no seu cartão, com as datas, o prazo e o link para a ficha", () => {
    consultas.substituirTudo([
      atendida("ana", "2026-03-25"), // venceu em 25/09
      atendida("bia", "2026-03-30"), // vence hoje
      atendida("caio", "2026-04-29"), // vence em 29/10
      atendida("dani", "2026-05-01"), // 01/11: depois da janela
    ]);
    abrir();

    const vencidos = cartao("Vencidos");
    expect(vencidos.getByText("1 paciente")).toBeTruthy();
    expect(vencidos.getByText("Último atendimento em 25/03/2026 · retorno previsto em 25/09/2026")).toBeTruthy();
    expect(vencidos.getByText("Vencido há 5 dias")).toBeTruthy();
    expect(vencidos.getByRole("link", { name: "Ana Exemplo" }).getAttribute("href")).toBe("/pacientes/ana");

    const aVencer = cartao("A vencer nos próximos 30 dias");
    expect(aVencer.getByText("2 pacientes")).toBeTruthy();
    expect(aVencer.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      expect.stringContaining("Bia Exemplo"),
      expect.stringContaining("Caio Exemplo"),
    ]);
    expect(aVencer.getByText("Vence hoje")).toBeTruthy();
    expect(aVencer.getByText("Vence em 29 dias")).toBeTruthy();

    expect(screen.queryByText("Dani Exemplo")).toBeNull(); // fora da janela
    expect(screen.queryByText("Edu Exemplo")).toBeNull(); // nunca foi atendido
  });

  it("no singular: um dia de atraso e um dia para vencer", () => {
    consultas.substituirTudo([atendida("ana", "2026-03-29"), atendida("bia", "2026-04-01")]); // retornos em 29/09 e 01/10
    abrir();

    expect(cartao("Vencidos").getByText("Vencido há 1 dia")).toBeTruthy();
    expect(cartao("A vencer nos próximos 30 dias").getByText("Vence em 1 dia")).toBeTruthy();
  });

  it("sem retorno vencido nem a vencer, cada cartão diz que não há", () => {
    consultas.substituirTudo([atendida("ana", "2026-09-01")]);
    abrir();

    expect(screen.getByText("Nenhum retorno vencido.")).toBeTruthy();
    expect(screen.getByText("Nenhum retorno a vencer nos próximos 30 dias.")).toBeTruthy();
    expect(screen.queryByRole("listitem")).toBeNull();
  });
});
