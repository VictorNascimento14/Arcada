import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DENTES_DECIDUOS, DENTES_PERMANENTES } from "@/dominio/fdi";

import Odontograma from "./Odontograma";

/** Os números dos dentes de uma arcada, na ordem em que aparecem (o nome do grupo de cada dente começa com o número). */
const numerosDe = (arcada: HTMLElement) =>
  within(arcada)
    .getAllByRole("group")
    .map((dente) => Number(dente.getAttribute("aria-label")?.match(/^Dente (\d+),/)?.[1]));

const arcada = (nome: string) => screen.getByRole("group", { name: nome });

/** Os nomes das arcadas na tela, de cima para baixo. */
const arcadasNaTela = () =>
  screen
    .getAllByRole("group")
    .map((g) => g.getAttribute("aria-label") ?? "")
    .filter((nome) => nome.startsWith("Arcada"));

const escolher = (denticao: string) => fireEvent.click(screen.getByRole("radio", { name: denticao }));

const depoisDe = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

/** A linha média da arcada está entre o dente do lado direito do paciente e o do esquerdo, na ordem de leitura. */
function linhaMediaEntre(nome: string, direito: number, esquerdo: number) {
  const dentro = within(arcada(nome));
  const linha = dentro.getByRole("separator", { name: "Linha média" });

  expect(depoisDe(dentro.getByRole("group", { name: new RegExp(`^Dente ${direito},`) }), linha)).toBe(true);
  expect(depoisDe(linha, dentro.getByRole("group", { name: new RegExp(`^Dente ${esquerdo},`) }))).toBe(true);
}

describe("Odontograma", () => {
  it("desenha a arcada superior e a inferior, cada uma com o nome", () => {
    render(<Odontograma />);

    expect(arcada("Arcada superior")).toBeTruthy();
    expect(arcada("Arcada inferior")).toBeTruthy();
  });

  it("põe os dentes permanentes na ordem da FDI: o lado direito do paciente à esquerda de quem olha", () => {
    render(<Odontograma />);

    expect(numerosDe(arcada("Arcada superior"))).toEqual([...DENTES_PERMANENTES.superior]);
    expect(numerosDe(arcada("Arcada inferior"))).toEqual([...DENTES_PERMANENTES.inferior]);
  });

  it("dá as cinco faces a cada um dos 16 dentes da arcada", () => {
    render(<Odontograma />);

    for (const nome of ["Arcada superior", "Arcada inferior"]) {
      expect(within(arcada(nome)).getAllByRole("button")).toHaveLength(16 * 5);
    }
  });

  it("marca a linha média entre o 11 e o 21 em cima e entre o 41 e o 31 embaixo", () => {
    render(<Odontograma />);

    linhaMediaEntre("Arcada superior", 11, 21);
    linhaMediaEntre("Arcada inferior", 41, 31);
  });
});

describe("Odontograma: marcas", () => {
  it("leva as marcas e as ações aos dentes, com o número do dente na chamada", () => {
    const aoFace = vi.fn();
    const aoDente = vi.fn();
    render(<Odontograma marcas={[{ dente: 26, face: "D", condicao: "selante" }]} onFace={aoFace} onDente={aoDente} />);

    fireEvent.click(screen.getByRole("button", { name: "face distal do dente 26: selante" }));
    fireEvent.click(screen.getByRole("button", { name: "dente 36 inteiro" }));

    expect(aoFace).toHaveBeenCalledWith(26, "D");
    expect(aoDente).toHaveBeenCalledWith(36);
  });
});

describe("Odontograma: dentição", () => {
  it("abre na permanente, com o seletor Dentição e só as duas arcadas permanentes", () => {
    render(<Odontograma />);

    const seletor = within(screen.getByRole("group", { name: "Dentição" }));
    expect(seletor.getAllByRole("radio").map((r) => r.closest("label")?.textContent)).toEqual(["Permanente", "Decídua", "Mista"]);
    expect((screen.getByRole("radio", { name: "Permanente" }) as HTMLInputElement).checked).toBe(true);
    expect(arcadasNaTela()).toEqual(["Arcada superior", "Arcada inferior"]);
  });

  it("mostra só as arcadas de leite na decídua, com 10 dentes cada e a linha média entre o 51 e o 61 e entre o 81 e o 71", () => {
    render(<Odontograma />);
    escolher("Decídua");

    expect((screen.getByRole("radio", { name: "Decídua" }) as HTMLInputElement).checked).toBe(true);
    expect(arcadasNaTela()).toEqual(["Arcada superior decídua", "Arcada inferior decídua"]);
    expect(numerosDe(arcada("Arcada superior decídua"))).toEqual([...DENTES_DECIDUOS.superior]);
    expect(numerosDe(arcada("Arcada inferior decídua"))).toEqual([...DENTES_DECIDUOS.inferior]);
    linhaMediaEntre("Arcada superior decídua", 51, 61);
    linhaMediaEntre("Arcada inferior decídua", 81, 71);
  });

  it("mostra as quatro arcadas na mista, com as de leite juntas no meio, e volta à permanente", () => {
    render(<Odontograma />);
    escolher("Mista");

    expect(arcadasNaTela()).toEqual(["Arcada superior", "Arcada superior decídua", "Arcada inferior decídua", "Arcada inferior"]);
    expect(numerosDe(arcada("Arcada superior"))).toEqual([...DENTES_PERMANENTES.superior]);
    expect(numerosDe(arcada("Arcada inferior decídua"))).toEqual([...DENTES_DECIDUOS.inferior]);

    escolher("Permanente");
    expect(arcadasNaTela()).toEqual(["Arcada superior", "Arcada inferior"]);
  });
});
