import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Face } from "@/dominio/odontologia";

import Dente from "./Dente";

const face = (nome: string, dente: number) => screen.getByRole("button", { name: `face ${nome} do dente ${dente}` });

describe("Dente", () => {
  it("mostra o número acima do desenho e dá ao desenho o nome do dente", () => {
    render(<Dente numero={16} />);

    const numero = screen.getByText("16");
    const desenho = screen.getByRole("group", { name: "Dente 16, primeiro molar superior direito" });
    expect(numero.compareDocumentPosition(desenho) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("desenha as cinco faces do dente que recebe, cada uma com o nome escrito", () => {
    const { unmount } = render(<Dente numero={16} />);
    expect(screen.getAllByRole("button").map((f) => f.getAttribute("aria-label"))).toEqual([
      "face vestibular do dente 16",
      "face distal do dente 16",
      "face oclusal do dente 16",
      "face mesial do dente 16",
      "face palatina do dente 16",
    ]);
    unmount();

    render(<Dente numero={31} />);
    expect(screen.getAllByRole("button").map((f) => f.getAttribute("aria-label"))).toEqual([
      "face lingual do dente 31",
      "face mesial do dente 31",
      "face incisal do dente 31",
      "face distal do dente 31",
      "face vestibular do dente 31",
    ]);
  });

  it("põe cada face no lugar da regra: a mesial fica do lado da linha média", () => {
    const { unmount } = render(<Dente numero={16} />);
    expect(face("mesial", 16).dataset.posicao).toBe("direita");
    expect(face("distal", 16).dataset.posicao).toBe("esquerda");
    expect(face("vestibular", 16).dataset.posicao).toBe("cima");
    expect(face("oclusal", 16).dataset.posicao).toBe("centro");
    unmount();

    render(<Dente numero={26} />);
    expect(face("mesial", 26).dataset.posicao).toBe("esquerda");
    expect(face("distal", 26).dataset.posicao).toBe("direita");
  });

  it("torna cada face focável por teclado", () => {
    render(<Dente numero={16} />);

    for (const botao of screen.getAllByRole("button")) expect(botao.getAttribute("tabindex")).toBe("0");
    const mesial = face("mesial", 16);
    mesial.focus();
    expect(document.activeElement).toBe(mesial);
  });

  it("avisa qual face foi ativada, por clique, Enter ou Espaço", () => {
    const aoAtivar = vi.fn<(f: Face) => void>();
    render(<Dente numero={16} onFace={aoAtivar} />);

    fireEvent.click(face("mesial", 16));
    fireEvent.keyDown(face("distal", 16), { key: "Enter" });
    fireEvent.keyDown(face("oclusal", 16), { key: " " });

    expect(aoAtivar.mock.calls.map(([f]) => f)).toEqual(["M", "D", "O"]);
  });

  it("não ativa com outras teclas nem com a tecla mantida, e o Espaço não rola a página", () => {
    const aoAtivar = vi.fn();
    render(<Dente numero={16} onFace={aoAtivar} />);
    const mesial = face("mesial", 16);

    fireEvent.keyDown(mesial, { key: "Tab" });
    fireEvent.keyDown(mesial, { key: "a" });
    fireEvent.keyDown(mesial, { key: "Enter", repeat: true });
    expect(aoAtivar).not.toHaveBeenCalled();

    const rolou = fireEvent.keyDown(mesial, { key: " " });
    expect(rolou).toBe(false); // preventDefault foi chamado
    expect(aoAtivar).toHaveBeenCalledTimes(1);
  });

  it("funciona sem a ação: clicar e apertar Enter não quebram", () => {
    render(<Dente numero={16} />);

    expect(() => {
      fireEvent.click(face("mesial", 16));
      fireEvent.keyDown(face("mesial", 16), { key: "Enter" });
    }).not.toThrow();
  });

  it("lança para um número que não é de dente", () => {
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Dente numero={19} />)).toThrow(RangeError);
    erro.mockRestore();
  });
});
