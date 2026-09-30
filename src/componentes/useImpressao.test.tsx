import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clinica } from "@/dados/colecoes";

import FolhaImpressa from "./FolhaImpressa";
import { useImpressao } from "./useImpressao";

const DRA = { nome: "Dra. Exemplo", cro: "CRO-SP 00000" };

/** Uma tela mínima: um botão por texto a imprimir e a folha enquanto houver pedido. */
function Tela() {
  const { folha, imprimir } = useImpressao<{ texto: string }>();
  return (
    <>
      <button onClick={() => imprimir({ texto: "Primeiro" })}>Imprimir primeiro</button>
      <button onClick={() => imprimir({ texto: "Segundo" })}>Imprimir segundo</button>
      {folha && (
        <FolhaImpressa titulo="Documento" profissional={DRA}>
          {folha.texto}
        </FolhaImpressa>
      )}
    </>
  );
}

/** O que havia na tela no instante em que o navegador foi chamado para imprimir. */
let impressoes: { modo?: string; folha?: string | null }[];

const folha = () => document.querySelector<HTMLElement>("body > [data-print-clone]");
const imprimir = (qual: "primeiro" | "segundo") => fireEvent.click(screen.getByRole("button", { name: `Imprimir ${qual}` }));
const depoisDeImprimir = () => act(() => void window.dispatchEvent(new Event("afterprint")));

beforeEach(() => {
  impressoes = [];
  vi.spyOn(window, "print").mockImplementation(() =>
    impressoes.push({ modo: document.body.dataset.printMode, folha: folha()?.textContent }),
  );
  clinica.substituirTudo([]);
});

afterEach(() => vi.restoreAllMocks());

describe("useImpressao", () => {
  it("imprimir monta a folha no body, liga o modo de impressão do kit e só então abre o navegador", () => {
    render(<Tela />);
    expect(folha()).toBeNull(); // fora da impressão a folha não existe
    expect(document.body.dataset.printMode).toBeUndefined();

    imprimir("primeiro");

    expect(impressoes).toHaveLength(1);
    expect(impressoes[0].modo).toBe("clone");
    expect(impressoes[0].folha).toContain("Primeiro"); // a folha já estava no body quando o navegador foi chamado
    expect(within(folha()!).getByText("Primeiro")).toBeTruthy();
  });

  it("depois da impressão a folha some e o modo é desligado; dá para imprimir outros dados em seguida", () => {
    render(<Tela />);
    imprimir("primeiro");

    depoisDeImprimir();
    expect(folha()).toBeNull();
    expect(document.body.dataset.printMode).toBeUndefined();

    imprimir("segundo");
    expect(impressoes).toHaveLength(2);
    expect(within(folha()!).getByText("Segundo")).toBeTruthy();
    expect(within(folha()!).queryByText("Primeiro")).toBeNull();
  });

  it("imprimir de novo, mesmo sem o `afterprint`, abre a impressão outra vez e mantém uma folha só", () => {
    render(<Tela />);

    imprimir("primeiro");
    imprimir("primeiro");

    expect(impressoes).toHaveLength(2);
    expect(document.querySelectorAll("body > [data-print-clone]")).toHaveLength(1);
  });

  it("ao sair da tela com a folha montada, não deixa o modo de impressão ligado", () => {
    const { unmount } = render(<Tela />);
    imprimir("primeiro");
    expect(document.body.dataset.printMode).toBe("clone");

    unmount();

    expect(document.body.dataset.printMode).toBeUndefined();
    expect(folha()).toBeNull();
  });
});
