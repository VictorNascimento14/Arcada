import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ROTAS } from "./rotas";

function abrir(caminho: string) {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: [caminho] })} />);
}

describe("rotas", () => {
  it("endereço desconhecido mostra a página não encontrada", async () => {
    abrir("/nao-existe");
    expect(await screen.findByRole("heading", { name: "Esta página não existe" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /voltar ao painel/i }).getAttribute("href")).toBe("/");
  });

  it("erro de render mostra a tela de erro em vez de tela branca", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Quebra = () => {
      throw new Error("falha de teste");
    };
    const rotas: RouteObject[] = [{ errorElement: ROTAS[0].errorElement, children: [{ path: "/quebra", Component: Quebra }] }];
    render(<RouterProvider router={createMemoryRouter(rotas, { initialEntries: ["/quebra"] })} />);
    expect(await screen.findByRole("heading", { name: "Algo não saiu como esperado" })).toBeTruthy();
  });

  it("Ctrl+K abre a busca de pacientes fora da tela de sistema", async () => {
    abrir("/pacientes");
    await screen.findAllByText("Pacientes");
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });
});
