import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, it } from "vitest";

import { ROTAS } from "@/rotas";

it("o item Documentos da coluna abre /documentos com o receituário e o aviso de que a v1 é demonstração", async () => {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/"] })} />);

  fireEvent.click(screen.getAllByRole("button", { name: "Documentos" })[0]);

  expect(await screen.findByRole("heading", { name: "Receituário" })).toBeTruthy();
  expect(screen.getByText(/não tem validade jurídica/)).toBeTruthy();
  expect(screen.getAllByRole("button", { name: "Documentos" }).some((b) => b.getAttribute("aria-current") === "page")).toBe(true);
});
