import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, it } from "vitest";

import { ROTAS } from "@/rotas";

it("o item Documentos da coluna abre /documentos com o receituário, o atestado e o aviso de que a v1 é demonstração", async () => {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/"] })} />);

  fireEvent.click(screen.getAllByRole("button", { name: "Documentos" })[0]);

  expect(await screen.findByRole("heading", { name: "Receituário" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Atestado" })).toBeTruthy();
  expect(screen.getByRole("form", { name: "Receituário" })).toBeTruthy(); // um formulário com nome por documento
  expect(screen.getByRole("form", { name: "Atestado" })).toBeTruthy();
  expect(screen.getByText(/não tem validade jurídica/)).toBeTruthy();
  expect(screen.getAllByRole("button", { name: "Documentos" }).some((b) => b.getAttribute("aria-current") === "page")).toBe(true);
});
