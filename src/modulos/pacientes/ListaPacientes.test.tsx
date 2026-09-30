import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pacientes } from "@/dados/colecoes";
import type { Paciente } from "@/dominio";
import { ROTAS } from "@/rotas";

// Fictícios: telefones com DDD 00, que não existe; nenhum CPF.
const PACIENTES: Paciente[] = [
  { id: "a1", nome: "João Pedro Alves", nascimento: "2018-05-14", telefone: "(00) 90000-0005", convenio: "Particular" },
  { id: "a2", nome: "Ana Beatriz Moura", nascimento: "1985-02-03", telefone: "(00) 90000-0002", convenio: "Convênio Exemplo" },
  { id: "a3", nome: "Sebastião Ribeiro", nascimento: "1952-11-20", telefone: "(00) 90000-0008" },
];

beforeEach(() => {
  // Só o `Date`: os temporizadores reais seguem, e o `findBy` da Testing Library depende deles.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 30, 12));
  pacientes.substituirTudo(PACIENTES);
});

afterEach(() => {
  vi.useRealTimers();
  pacientes.substituirTudo([]);
});

// Monta as rotas de verdade: o módulo entra pelo registro, com a coluna e a casca.
async function abrir() {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/pacientes"] })} />);
  return screen.findByRole("searchbox", { name: "Buscar paciente" });
}

/** Os cartões da lista (links para a ficha), na ordem da tela. */
const cartoes = () => screen.queryAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/pacientes/"));

describe("lista de pacientes", () => {
  it("entra na coluna lateral pelo registro de módulos e o item leva à lista", async () => {
    render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/"] })} />);

    fireEvent.click((await screen.findAllByRole("button", { name: /Pacientes/ }))[0]);

    expect(await screen.findByRole("searchbox", { name: "Buscar paciente" })).toBeTruthy();
  });

  it("lista todos em ordem alfabética, com idade, convênio e o link da ficha", async () => {
    await abrir();

    const [ana, joao, sebastiao] = cartoes();
    expect(cartoes()).toHaveLength(3);
    expect(ana.getAttribute("href")).toBe("/pacientes/a2");
    expect(ana.textContent).toContain("Ana Beatriz Moura");
    expect(ana.textContent).toContain("41 anos · Convênio Exemplo");
    expect(joao.textContent).toContain("8 anos · Particular");
    expect(sebastiao.textContent).toContain("73 anos · Particular"); // sem convênio guardado: Particular
    expect(screen.getByText("3 pacientes")).toBeTruthy();
  });

  it("busca o nome sem acento e a contagem acompanha", async () => {
    const campo = await abrir();
    fireEvent.change(campo, { target: { value: "joao" } });

    expect(cartoes().map((a) => a.getAttribute("href"))).toEqual(["/pacientes/a1"]);
    expect(screen.getByText("1 de 3 pacientes")).toBeTruthy();
  });

  it("busca pelo telefone", async () => {
    const campo = await abrir();
    fireEvent.change(campo, { target: { value: "0008" } });

    expect(cartoes().map((a) => a.getAttribute("href"))).toEqual(["/pacientes/a3"]);
  });

  it("sem resultado avisa, e Limpar busca traz a lista de volta", async () => {
    const campo = (await abrir()) as HTMLInputElement;
    fireEvent.change(campo, { target: { value: "zzz" } });

    expect(screen.getByText("Nenhum paciente encontrado")).toBeTruthy();
    expect(screen.getByText("0 de 3 pacientes")).toBeTruthy();
    expect(cartoes()).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(campo.value).toBe("");
    expect(cartoes()).toHaveLength(3);
  });

  it("sem nenhum paciente cadastrado mostra o estado vazio, não a busca sem resultado", async () => {
    pacientes.substituirTudo([]);
    await abrir();

    expect(screen.getByText("Nenhum paciente cadastrado ainda")).toBeTruthy();
    expect(screen.queryByText("Nenhum paciente encontrado")).toBeNull();
    expect(cartoes()).toHaveLength(0);
  });
});
