import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect, it } from "vitest";

import { ROTAS } from "@/rotas";

it("o item Sistema da coluna abre /sistema com os cartões de backup e de restauração", async () => {
  render(<RouterProvider router={createMemoryRouter(ROTAS, { initialEntries: ["/"] })} />);

  fireEvent.click(screen.getAllByRole("button", { name: "Sistema" })[0]);

  expect(await screen.findByRole("heading", { name: "Backup dos dados" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Restaurar a demonstração" })).toBeTruthy();
  expect(screen.getAllByRole("button", { name: "Sistema" }).some((b) => b.getAttribute("aria-current") === "page")).toBe(true);
});
