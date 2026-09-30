import { fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { pacientes } from "@/dados/colecoes";
import type { Paciente } from "@/dominio";

import FichaPaciente from "./FichaPaciente";

// O registro de verdade mudaria a cada módulo que ganhasse uma aba: aqui ele é fixo, e a ficha só lê
// `NAVEGACAO.abasPaciente`, como os outros módulos a alimentam.
vi.mock("@/modulos", async () => {
  const { createElement } = await import("react");
  return {
    NAVEGACAO: {
      abasPaciente: [
        {
          chave: "anamnese",
          ordem: 1,
          rotulo: "Anamnese",
          Componente: ({ pacienteId }: { pacienteId: string }) => createElement("p", null, `Anamnese de ${pacienteId}`),
        },
        { chave: "odontograma", ordem: 2, rotulo: "Odontograma", Componente: () => createElement("p", null, "Mapa dos dentes") },
      ],
    },
  };
});

// Fictício: DDD 11 com número de exemplo; nenhum CPF.
const ANA: Paciente = {
  id: "p1",
  nome: "Ana Beatriz Moura",
  nascimento: "1985-02-03",
  telefone: "(11) 90000-0002",
  email: "paciente@exemplo.com",
  convenio: "Convênio Exemplo",
  observacoes: "Prefere o fim da tarde.",
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] }); // só o `Date`: o `findBy` da Testing Library usa os temporizadores reais
  vi.setSystemTime(new Date(2026, 8, 30, 12));
  pacientes.substituirTudo([ANA]);
});

afterEach(() => {
  vi.useRealTimers();
  pacientes.substituirTudo([]);
});

function abrir(id = "p1") {
  const rotas = [
    { path: "/pacientes/:id", Component: FichaPaciente },
    { path: "/pacientes", element: <p>Lista</p> },
  ];
  render(<RouterProvider router={createMemoryRouter(rotas, { initialEntries: [`/pacientes/${id}`] })} />);
}

describe("ficha do paciente", () => {
  it("o cabeçalho mostra nome, idade, convênio e telefone, com os botões de contato", async () => {
    abrir();

    expect(await screen.findByRole("heading", { name: "Ana Beatriz Moura" })).toBeTruthy();
    expect(screen.getByText("41 anos · Convênio Exemplo")).toBeTruthy();
    expect(screen.getAllByText("(11) 90000-0002").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /WhatsApp/ }).getAttribute("href")).toBe("https://wa.me/5511900000002");
    expect(screen.getByRole("link", { name: "Ligar" }).getAttribute("href")).toBe("tel:+5511900000002");
  });

  it.each([
    ["telefone sem DDD válido (a semente usa 00)", "(00) 90000-0001"],
    ["sem telefone", ""],
  ])("%s: os botões de contato somem", async (_caso, telefone) => {
    pacientes.substituirTudo([{ ...ANA, telefone }]);
    abrir();

    await screen.findByRole("heading", { name: ANA.nome });
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "Ligar" })).toBeNull();
  });

  it("a aba Dados vem primeiro e mostra o cadastro; as dos outros módulos vêm depois", async () => {
    abrir();

    await screen.findByRole("tablist", { name: "Seções da ficha" });
    const abas = screen.getAllByRole("tab");
    expect(abas.map((a) => a.textContent)).toEqual(["Dados", "Anamnese", "Odontograma"]);
    expect(abas[0].getAttribute("aria-selected")).toBe("true");

    const painel = screen.getByRole("tabpanel");
    expect(painel.getAttribute("aria-labelledby")).toBe(abas[0].id);
    expect(within(painel).getByText("03/02/1985")).toBeTruthy();
    expect(within(painel).getByText("paciente@exemplo.com")).toBeTruthy();
    expect(within(painel).getByText("Prefere o fim da tarde.")).toBeTruthy();
    expect(within(painel).getByText("Não informado")).toBeTruthy(); // o CPF, que não foi cadastrado
  });

  it("clicar numa aba mostra o conteúdo dela, recebendo o id do paciente", async () => {
    abrir();

    fireEvent.click(await screen.findByRole("tab", { name: "Anamnese" }));

    expect(screen.getByRole("tabpanel").textContent).toBe("Anamnese de p1");
    expect(screen.getByRole("tab", { name: "Anamnese" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Dados" }).getAttribute("aria-selected")).toBe("false");
  });

  it("as setas, Home e End trocam de aba e movem o foco, dando a volta nas pontas", async () => {
    abrir();
    const dados = await screen.findByRole("tab", { name: "Dados" });
    const selecionada = () => screen.getByRole("tab", { selected: true }).textContent;
    const tecla = (key: string) => fireEvent.keyDown(document.activeElement ?? dados, { key });

    dados.focus();
    tecla("ArrowRight");
    expect(selecionada()).toBe("Anamnese");
    expect(document.activeElement?.textContent).toBe("Anamnese"); // o foco acompanha a seleção
    tecla("ArrowRight");
    expect(selecionada()).toBe("Odontograma");
    tecla("ArrowRight");
    expect(selecionada()).toBe("Dados"); // deu a volta
    tecla("ArrowLeft");
    expect(selecionada()).toBe("Odontograma");
    tecla("Home");
    expect(selecionada()).toBe("Dados");
    tecla("End");
    expect(selecionada()).toBe("Odontograma");

    // Só a aba selecionada entra na sequência do Tab; as outras se alcançam pelas setas.
    expect(screen.getAllByRole("tab").map((a) => a.getAttribute("tabindex"))).toEqual(["-1", "-1", "0"]);
  });

  it("paciente inexistente mostra a mensagem e a volta à lista", async () => {
    abrir("nao-existe");

    expect(await screen.findByRole("heading", { name: "Paciente não encontrado" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Voltar à lista de pacientes" }).getAttribute("href")).toBe("/pacientes");
    expect(screen.queryByRole("tablist")).toBeNull();
  });
});
