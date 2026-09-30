import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cadeiras, clinica, CLINICA_ID, consultas, pacientes, profissionais } from "@/dados/colecoes";
import type { Consulta } from "@/dominio";
import { ROTAS } from "@/rotas";

// Tudo fictício: telefones com DDD 00, que não existe; nenhum CPF.
const MANHA = { inicio: "08:00", fim: "12:00" };
const TARDE = { inicio: "13:30", fim: "18:00" };
const consulta = (id: string, inicio: string, situacao: Consulta["situacao"] = "agendada"): Consulta => ({
  id, pacienteId: "a1", profissionalId: "p1", cadeiraId: "c1", inicio, duracaoMin: 30, situacao,
});

const TODAS = [clinica, cadeiras, profissionais, pacientes, consultas];

beforeEach(() => {
  // Só o `Date`: os temporizadores reais seguem, e o `findBy` depende deles.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 30, 12)); // quarta-feira, 30 de setembro
  clinica.substituirTudo([{ id: CLINICA_ID, nome: "Clínica Exemplo", expediente: { 0: [], 1: [MANHA, TARDE], 2: [MANHA, TARDE], 3: [MANHA, TARDE], 4: [MANHA, TARDE], 5: [MANHA, TARDE], 6: [MANHA] } }]);
  cadeiras.substituirTudo([{ id: "c1", nome: "Cadeira 1" }]);
  profissionais.substituirTudo([{ id: "p1", nome: "Dra. Exemplo", cro: "CRO-SP 00000", cor: "#1f6f5b" }]);
  pacientes.substituirTudo([{ id: "a1", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002" }]);
  consultas.substituirTudo([
    consulta("k1", "2026-09-15T09:00"),
    consulta("k2", "2026-09-16T09:00", "cancelada"),
    consulta("k3", "2026-10-01T10:00"),
  ]);
});

afterEach(() => {
  vi.useRealTimers();
  for (const c of TODAS) c.substituirTudo([]);
});

async function abrir() {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/agenda"] })} />);
  await screen.findByRole("heading", { name: "quarta-feira, 30 de setembro de 2026" });
  return within(screen.getByRole("region", { name: "Calendário do mês" }));
}

type Calendario = Awaited<ReturnType<typeof abrir>>;
const dia = (c: Calendario, n: string) => c.getByRole("button", { name: n });
/** O ponto embaixo do número é o único `<span>` dentro do botão do dia. */
const temPonto = (c: Calendario, n: string) => dia(c, n).querySelector("span") !== null;

describe("agenda: calendário do mês", () => {
  it("abre no mês de hoje e marca com o ponto só os dias que têm consulta", async () => {
    const c = await abrir();

    expect(c.getByText("setembro de 2026")).toBeTruthy();
    expect(temPonto(c, "15")).toBe(true);
    expect(temPonto(c, "16")).toBe(false); // só tem consulta cancelada
    expect(temPonto(c, "17")).toBe(false);
  });

  it("clicar num dia abre esse dia na grade", async () => {
    const c = await abrir();

    fireEvent.click(dia(c, "15"));

    expect(await screen.findByRole("heading", { name: "terça-feira, 15 de setembro de 2026" })).toBeTruthy();
    expect(within(screen.getByRole("list", { name: "Consultas da Cadeira 1" })).getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("1 consulta neste dia")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Hoje" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("anda de mês pelas setas do calendário e abre um dia do mês seguinte", async () => {
    const c = await abrir();

    fireEvent.click(c.getByRole("button", { name: "Próximo mês" }));
    expect(c.getByText("outubro de 2026")).toBeTruthy();
    expect(temPonto(c, "1")).toBe(true);

    fireEvent.click(dia(c, "1"));
    expect(await screen.findByRole("heading", { name: "quinta-feira, 1 de outubro de 2026" })).toBeTruthy();
    expect(screen.getByText("1 consulta neste dia")).toBeTruthy();
  });

  it("no celular o botão Mês abre e fecha o calendário, e escolher um dia o fecha", async () => {
    const c = await abrir();
    const mes = screen.getByRole("button", { name: "Mês" });
    expect(mes.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(mes);
    expect(mes.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(mes);
    expect(mes.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(mes);
    fireEvent.click(dia(c, "15"));
    expect(mes.getAttribute("aria-expanded")).toBe("false");
  });
});
