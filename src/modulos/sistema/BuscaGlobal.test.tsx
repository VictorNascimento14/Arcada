import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { pacientes } from "@/dados/colecoes";
import type { Paciente } from "@/dominio";
import { Modal } from "@/ui";

import { abrirBusca } from "./atalhoDeBusca";
import BuscaGlobal from "./BuscaGlobal";

const paciente = (id: string, nome: string): Paciente => ({ id, nome, nascimento: "1990-01-01", telefone: "(00) 90000-0000" });

beforeEach(() => {
  localStorage.clear();
  pacientes.substituirTudo([paciente("p1", "João Pedro Alves"), paciente("p2", "Joana Duarte"), paciente("p3", "Helena Duarte")]);
});

/** A busca no layout, como na casca: continua montada quando a rota muda. `extra` entra ao lado dela. */
function montar(extra?: ReactNode) {
  const router = createMemoryRouter([
    {
      element: (
        <>
          <BuscaGlobal />
          {extra}
          <Outlet />
        </>
      ),
      children: [
        { path: "/", element: <p>Início</p> },
        { path: "/pacientes/:id", element: <p>Ficha aberta</p> },
      ],
    },
  ]);
  render(<RouterProvider router={router} />);
  return router;
}

const teclar = (init: KeyboardEventInit) => fireEvent.keyDown(document, init);
const ctrlK = () => teclar({ key: "k", ctrlKey: true });
const caixa = () => screen.queryByRole("dialog", { name: "Buscar paciente" });
const campo = () => screen.getByRole("combobox") as HTMLInputElement;
const digitar = (valor: string) => fireEvent.change(campo(), { target: { value: valor } });
const opcoes = () => screen.queryAllByRole("option");
const selecionada = () => opcoes().findIndex((o) => o.getAttribute("aria-selected") === "true");

describe("o atalho", () => {
  it("Ctrl+K e ⌘K abrem a busca, o mesmo atalho a fecha, e o navegador não fica com ele", () => {
    montar();
    expect(caixa()).toBeNull();

    expect(fireEvent.keyDown(document, { key: "k", ctrlKey: true })).toBe(false); // `preventDefault` foi chamado
    expect(caixa()).not.toBeNull();

    ctrlK();
    expect(caixa()).toBeNull();

    teclar({ key: "k", metaKey: true });
    expect(caixa()).not.toBeNull();
  });

  it("só reage a Ctrl ou ⌘ com K, sem Shift nem Alt", () => {
    montar();

    teclar({ key: "k" });
    teclar({ key: "j", ctrlKey: true });
    teclar({ key: "k", ctrlKey: true, shiftKey: true });
    teclar({ key: "k", ctrlKey: true, altKey: true });

    expect(caixa()).toBeNull();
  });

  it("é registrado uma vez: com a busca montada em dois lugares, abre uma caixa só", () => {
    montar(<BuscaGlobal />);

    ctrlK();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);

    ctrlK();
    expect(screen.queryAllByRole("dialog")).toHaveLength(0);
  });

  it("não abre por cima de outro diálogo", () => {
    montar(
      <Modal aberto titulo="Outro diálogo" onFechar={() => {}}>
        texto
      </Modal>,
    );

    ctrlK();

    expect(caixa()).toBeNull();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("abrirBusca abre a caixa, que é o que o botão da tela faz", () => {
    montar();

    act(() => abrirBusca());

    expect(caixa()).not.toBeNull();
  });
});

describe("a caixa", () => {
  it("abre com o foco no campo e a dica, sem listar ninguém", () => {
    montar();

    ctrlK();

    expect(document.activeElement).toBe(campo());
    expect(screen.getByRole("status").textContent).toMatch(/Digite o nome/);
    expect(opcoes()).toHaveLength(0);
  });

  it("acha por nome sem acento nem caixa, em ordem alfabética, e avisa quando não acha", () => {
    montar();
    ctrlK();

    digitar("DUARTE");
    expect(opcoes().map((o) => o.textContent)).toEqual([expect.stringContaining("Helena Duarte"), expect.stringContaining("Joana Duarte")]);

    digitar("joao");
    expect(opcoes()).toHaveLength(1);
    expect(opcoes()[0].textContent).toContain("João Pedro Alves");

    digitar("zzz");
    expect(opcoes()).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toMatch(/Nenhum paciente/);
  });

  it("mostra no máximo oito e diz quantos há", () => {
    pacientes.substituirTudo(Array.from({ length: 10 }, (_, i) => paciente(`s${i}`, `Silva ${i}`)));
    montar();
    ctrlK();

    digitar("silva");

    expect(opcoes()).toHaveLength(8);
    expect(screen.getByRole("status").textContent).toMatch(/Mostrando 8 de 10/);
  });

  it("as setas movem a seleção sem passar das pontas, e Enter abre a ficha do escolhido e fecha a caixa", () => {
    const router = montar();
    ctrlK();
    digitar("duarte");
    expect(selecionada()).toBe(0);
    expect(campo().getAttribute("aria-activedescendant")).toBe(opcoes()[0].id);

    fireEvent.keyDown(campo(), { key: "ArrowDown" });
    expect(selecionada()).toBe(1);
    fireEvent.keyDown(campo(), { key: "ArrowDown" });
    expect(selecionada()).toBe(1);
    fireEvent.keyDown(campo(), { key: "ArrowUp" });
    fireEvent.keyDown(campo(), { key: "ArrowUp" });
    expect(selecionada()).toBe(0);

    fireEvent.keyDown(campo(), { key: "ArrowDown" });
    fireEvent.keyDown(campo(), { key: "Enter" });

    expect(router.state.location.pathname).toBe("/pacientes/p2");
    expect(screen.getByText("Ficha aberta")).toBeTruthy();
    expect(caixa()).toBeNull();
  });

  it("Enter sem resultado não faz nada", () => {
    const router = montar();
    ctrlK();
    digitar("zzz");

    fireEvent.keyDown(campo(), { key: "Enter" });

    expect(router.state.location.pathname).toBe("/");
    expect(caixa()).not.toBeNull();
  });

  it("clicar num resultado abre a ficha dele", () => {
    const router = montar();
    ctrlK();
    digitar("duarte");

    fireEvent.click(screen.getByRole("option", { name: /Helena Duarte/ }));

    expect(router.state.location.pathname).toBe("/pacientes/p3");
    expect(caixa()).toBeNull();
  });

  it("Escape fecha sem navegar, e cada abertura começa do zero", () => {
    const router = montar();
    ctrlK();
    digitar("duarte");

    teclar({ key: "Escape" });
    expect(caixa()).toBeNull();
    expect(router.state.location.pathname).toBe("/");

    ctrlK();
    expect(campo().value).toBe("");
    expect(opcoes()).toHaveLength(0);
  });
});
