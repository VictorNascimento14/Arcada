import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, it } from "vitest";

import { ROTAS } from "@/rotas";

it("o item Clínica da coluna abre /clinica com os dados da clínica", async () => {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/"] })} />);

  fireEvent.click(screen.getAllByRole("button", { name: "Clínica" })[0]);

  expect(await screen.findByRole("heading", { name: "Dados da clínica" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Expediente" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Convênios aceitos" })).toBeTruthy();
  expect(screen.getAllByRole("button", { name: "Clínica" }).some((b) => b.getAttribute("aria-current") === "page")).toBe(true);
});
