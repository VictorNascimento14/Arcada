import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, it } from "vitest";

import { ROTAS } from "@/rotas";

it("o item Sistema da coluna abre /sistema com os cartões de backup, de restauração e de busca", async () => {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/"] })} />);

  fireEvent.click(screen.getAllByRole("button", { name: "Sistema" })[0]);

  expect(await screen.findByRole("heading", { name: "Backup dos dados" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Restaurar a demonstração" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Busca de pacientes" })).toBeTruthy();
  expect(screen.getAllByRole("button", { name: "Sistema" }).some((b) => b.getAttribute("aria-current") === "page")).toBe(true);
});

it("o botão Buscar da tela abre a busca de pacientes, e Ctrl+K a fecha", async () => {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/sistema"] })} />);

  fireEvent.click(await screen.findByRole("button", { name: "Buscar" }));
  expect(screen.getByRole("dialog", { name: "Buscar paciente" })).toBeTruthy();

  fireEvent.keyDown(document, { key: "k", ctrlKey: true });
  expect(screen.queryByRole("dialog", { name: "Buscar paciente" })).toBeNull();
});
