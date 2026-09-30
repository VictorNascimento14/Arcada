import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DENTES_PERMANENTES } from "@/dominio/fdi";

import Odontograma from "./Odontograma";

/** Os números dos dentes de uma arcada, na ordem em que aparecem (o nome do grupo de cada dente começa com o número). */
const numerosDe = (arcada: HTMLElement) =>
  within(arcada)
    .getAllByRole("group")
    .map((dente) => Number(dente.getAttribute("aria-label")?.match(/^Dente (\d+),/)?.[1]));

describe("Odontograma", () => {
  it("desenha a arcada superior e a inferior, cada uma com o nome", () => {
    render(<Odontograma />);

    expect(screen.getByRole("group", { name: "Arcada superior" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Arcada inferior" })).toBeTruthy();
  });

  it("põe os dentes permanentes na ordem da FDI: o lado direito do paciente à esquerda de quem olha", () => {
    render(<Odontograma />);

    expect(numerosDe(screen.getByRole("group", { name: "Arcada superior" }))).toEqual([...DENTES_PERMANENTES.superior]);
    expect(numerosDe(screen.getByRole("group", { name: "Arcada inferior" }))).toEqual([...DENTES_PERMANENTES.inferior]);
  });

  it("dá as cinco faces a cada um dos 16 dentes da arcada", () => {
    render(<Odontograma />);

    for (const nome of ["Arcada superior", "Arcada inferior"]) {
      expect(within(screen.getByRole("group", { name: nome })).getAllByRole("button")).toHaveLength(16 * 5);
    }
  });

  it("marca a linha média entre o 11 e o 21 em cima e entre o 41 e o 31 embaixo", () => {
    render(<Odontograma />);

    for (const [nome, direito, esquerdo] of [
      ["Arcada superior", 11, 21],
      ["Arcada inferior", 41, 31],
    ] as const) {
      const arcada = within(screen.getByRole("group", { name: nome }));
      const linha = arcada.getByRole("separator", { name: "Linha média" });

      const depoisDe = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      expect(depoisDe(arcada.getByRole("group", { name: new RegExp(`^Dente ${direito},`) }), linha)).toBe(true);
      expect(depoisDe(linha, arcada.getByRole("group", { name: new RegExp(`^Dente ${esquerdo},`) }))).toBe(true);
    }
  });
});
