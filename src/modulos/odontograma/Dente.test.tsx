import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Face } from "@/dominio/odontologia";

import Dente from "./Dente";

const face = (nome: string, dente: number) => screen.getByRole("button", { name: new RegExp(`^face ${nome} do dente ${dente}`) });

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

describe("Dente: condições", () => {
  it("escreve a condição no nome da face marcada e põe o símbolo dela no desenho", () => {
    render(<Dente numero={16} marcas={[{ dente: 16, face: "M", condicao: "carie" }]} />);

    const marcada = face("mesial", 16);
    expect(marcada.getAttribute("aria-label")).toBe("face mesial do dente 16: cárie");
    expect(marcada.querySelector('[data-simbolo="carie"]')).toBeTruthy();
    expect(screen.getAllByRole("button").filter((f) => f.querySelector("[data-simbolo]"))).toEqual([marcada]);
  });

  it("lista as condições do dente inteiro no nome do desenho e as desenha sem pegar o clique das faces", () => {
    render(<Dente numero={16} marcas={[{ dente: 16, condicao: "tratamentoDeCanal" }, { dente: 16, condicao: "coroa" }]} />);

    const desenho = screen.getByRole("group", {
      name: "Dente 16, primeiro molar superior direito. Condições do dente: tratamento de canal, coroa",
    });
    expect(desenho.querySelector('[data-simbolo="tratamentoDeCanal"]')).toBeTruthy();
    expect(desenho.querySelector('[data-simbolo="coroa"]')?.getAttribute("pointer-events")).toBe("none");
    expect(screen.getAllByRole("button").some((f) => f.querySelector("[data-simbolo]"))).toBe(false);
  });

  it("mostra só as marcas do próprio dente", () => {
    render(<Dente numero={16} marcas={[{ dente: 26, face: "M", condicao: "carie" }, { dente: 26, condicao: "coroa" }]} />);

    expect(face("mesial", 16).getAttribute("aria-label")).toBe("face mesial do dente 16");
    expect(screen.getByRole("group", { name: "Dente 16, primeiro molar superior direito" })).toBeTruthy();
    expect(document.querySelector("[data-simbolo]")).toBeNull();
  });

  it("faz do número um botão só quando há ação para o dente inteiro", () => {
    const aoClicar = vi.fn();
    const { rerender } = render(<Dente numero={16} />);
    expect(screen.queryByRole("button", { name: "dente 16 inteiro" })).toBeNull();

    rerender(<Dente numero={16} onNumero={aoClicar} />);
    fireEvent.click(screen.getByRole("button", { name: "dente 16 inteiro" }));
    expect(aoClicar).toHaveBeenCalledTimes(1);
  });

  it("marca as faces como indisponíveis (aria-disabled) enquanto não há ação para elas", () => {
    const { rerender } = render(<Dente numero={16} />);
    expect(face("mesial", 16).getAttribute("aria-disabled")).toBe("true");

    rerender(<Dente numero={16} onFace={() => {}} />);
    expect(face("mesial", 16).hasAttribute("aria-disabled")).toBe(false);
  });
});
