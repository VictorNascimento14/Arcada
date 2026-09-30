import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CONDICOES } from "./condicoes";
import Legenda from "./Legenda";

const nomesDoGrupo = (grupo: string) =>
  within(screen.getByRole("list", { name: grupo }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);

describe("Legenda", () => {
  it("separa as condições por face das do dente inteiro", () => {
    render(<Legenda />);

    expect(screen.getByRole("group", { name: "Legenda do odontograma" })).toBeTruthy();
    expect(nomesDoGrupo("Por face")).toEqual(["Cárie", "Restauração", "Selante"]);
    expect(nomesDoGrupo("Dente inteiro")).toEqual([
      "Fratura",
      "Extração indicada",
      "Ausente",
      "Tratamento de canal",
      "Coroa",
      "Implante",
    ]);
  });

  it("dá a cada condição um marcador decorativo, com as classes de cor da própria condição", () => {
    render(<Legenda />);

    for (const { rotulo, cor } of CONDICOES) {
      const marcador = screen.getByText(rotulo).querySelector("span");
      expect(marcador?.getAttribute("aria-hidden")).toBe("true");
      expect(marcador?.classList.contains("bg-current")).toBe(true);
      for (const classe of cor.split(" ")) expect(marcador?.classList.contains(classe)).toBe(true);
    }
  });
});
